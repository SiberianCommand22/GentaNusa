import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/app/api/rate-limit";
import { CATEGORIES, PRIMARY_CATEGORY_SLUGS } from "@/lib/categories";
import { canAccessAnalytics, EDITORIAL_NON_ADMIN_ROLES } from "@/lib/roles";
import {
  ensureRestClient,
  getEditorialSessionRest,
  type ArticleRow,
} from "@/lib/supabase-rest";

// Artikel dari REST memuat kolom created_at (lihat select di fetchAllRows),
// tapi tipe ArticleRow di lib/supabase-rest tidak mendeklarasikannya —
// perpanjang lokal agar tidak mengubah kontrak bersama.
type AnalyticsRow = ArticleRow & { created_at?: string | null };

// Selalu dinamis: baca cookie sesi + searchParams per request.
export const dynamic = "force-dynamic";
// Node.js Serverless (kuota 50 MB) — JANGAN Edge.
export const runtime = "nodejs";

type RangeKey = "hari-ini" | "7-hari" | "bulan-ini" | "semua";
const RANGES: readonly RangeKey[] = ["hari-ini", "7-hari", "bulan-ini", "semua"];

const WIB_OFFSET_MINUTES = 7 * 60; // Asia/Jakarta (WIB, UTC+7) tanpa DST.

function startOfDayWib(now: Date): Date {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const wib = new Date(utcMs + WIB_OFFSET_MINUTES * 60_000);
  wib.setHours(0, 0, 0, 0);
  const backToUtc = wib.getTime() - WIB_OFFSET_MINUTES * 60_000;
  return new Date(backToUtc - now.getTimezoneOffset() * 60_000);
}

function parseCreatedAt(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t);
}

function isDraftRow(a: ArticleRow): boolean {
  if (a.status === "draft") return true;
  if (typeof a.author_slug === "string" && a.author_slug.startsWith("staging-")) return true;
  return false;
}

type RangeFilter = { since: Date | null };

function resolveRange(key: RangeKey, now: Date): RangeFilter {
  switch (key) {
    case "hari-ini":
      return { since: startOfDayWib(now) };
    case "7-hari": {
      const start = startOfDayWib(now);
      return { since: new Date(start.getTime() - 6 * 86_400_000) };
    }
    case "bulan-ini": {
      // Awal bulan berjalan di zona WIB (bulan kembalinya new Date(utc) = WIB).
      const wibNow = new Date(
        now.getTime() + now.getTimezoneOffset() * 60_000 + WIB_OFFSET_MINUTES * 60_000
      );
      const backToUtc = Date.UTC(
        wibNow.getUTCFullYear(),
        wibNow.getUTCMonth(),
        1
      );
      return { since: new Date(backToUtc - now.getTimezoneOffset() * 60_000) };
    }
    case "semua":
    default:
      return { since: null };
  }
}

function inRange(row: AnalyticsRow, filter: RangeFilter): boolean {
  const since = filter.since;
  if (!since) return true;
  const created = parseCreatedAt(row.created_at);
  return created !== null && created.getTime() >= since.getTime();
}

function matchesCategory(row: AnalyticsRow, name: string, slug: string): boolean {
  const cat = String(row.category || "").trim().toLowerCase();
  return cat === name.toLowerCase() || cat === slug.toLowerCase();
}

async function fetchAllRows(): Promise<{ ok: true; rows: AnalyticsRow[] } | { ok: false; error: string; status: number }> {
  const c = ensureRestClient();
  if (!c.ok) return { ok: false, error: c.error, status: 503 };

  const columns =
    "id,slug,title,category,date,author,author_slug,status,user_id,created_at";
  const sp = new URLSearchParams({ select: columns });
  sp.append("order", "created_at.desc");

  try {
    const res = await fetch(`${c.cfg.url}/rest/v1/articles?${sp.toString()}`, {
      headers: {
        apikey: c.cfg.serviceKey,
        Authorization: `Bearer ${c.cfg.serviceKey}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      let detail = `PostgREST ${res.status}`;
      try {
        const j = (await res.json()) as { message?: string };
        if (j?.message) detail = j.message;
      } catch {
        // body bukan JSON
      }
      return { ok: false, error: detail, status: 500 };
    }
    const rows = (await res.json()) as AnalyticsRow[];
    return { ok: true, rows: Array.isArray(rows) ? rows : [] };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Jaringan Supabase gagal",
      status: 500,
    };
  }
}

type AuthUserLite = {
  id: string;
  email: string | null;
  fullName: string | null;
  authorSlug: string | null;
  role: string;
};

// Daftar akun Auth (admin list endpoint) — cache in-proses 60 detik agar
// dashboard tidak memanggil endpoint admin Auth pada setiap request.
let authUsersCache: { at: number; users: AuthUserLite[] } | null = null;
const AUTH_USERS_TTL_MS = 60_000;

async function fetchAuthUsers(): Promise<AuthUserLite[] | null> {
  const c = ensureRestClient();
  if (!c.ok) return null;

  const now = Date.now();
  if (authUsersCache && now - authUsersCache.at < AUTH_USERS_TTL_MS) {
    return authUsersCache.users;
  }

  const out: AuthUserLite[] = [];
  const perPage = 1000;
  try {
    for (let page = 1; page <= 10; page++) {
      const sp = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      const res = await fetch(`${c.cfg.url}/auth/v1/admin/users?${sp.toString()}`, {
        headers: {
          apikey: c.cfg.serviceKey,
          Authorization: `Bearer ${c.cfg.serviceKey}`,
        },
        cache: "no-store",
      });
      if (!res.ok) return out.length > 0 ? out : null;
      const body = (await res.json()) as {
        users?: Array<{
          id?: string;
          email?: string | null;
          app_metadata?: Record<string, unknown> | null;
          user_metadata?: Record<string, unknown> | null;
        }>;
      };
      const users = Array.isArray(body?.users) ? body.users : [];
      for (const u of users) {
        if (!u || typeof u.id !== "string") continue;
        const appMeta = (u.app_metadata ?? {}) as Record<string, unknown>;
        const userMeta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const email = typeof u.email === "string" && u.email ? u.email.trim() : null;
        const fullName =
          (typeof userMeta.full_name === "string" && userMeta.full_name.trim()) ||
          (typeof userMeta.name === "string" && userMeta.name.trim()) ||
          (email ? email.split("@")[0] : null);
        const authorSlug =
          typeof userMeta.author_slug === "string" && userMeta.author_slug.trim()
            ? userMeta.author_slug.trim()
            : null;
        out.push({
          id: u.id,
          email,
          fullName,
          authorSlug,
          role: String(appMeta.role ?? "").trim().toLowerCase(),
        });
      }
      if (users.length < perPage) break;
    }
  } catch {
    return out.length > 0 ? out : null;
  }
  authUsersCache = { at: now, users: out };
  return out;
}

type CategoryStat = {
  slug: string;
  name: string;
  label: string;
  /** Jumlah artikel pada rentang terpilih. */
  count: number;
  /** Jumlah artikel kategori ini yang terbit hari ini (WIB). */
  countToday: number;
  /** Total akumulasi seluruh waktu (publikasi, bukan draft). */
  totalAll: number;
  /** true bila kategori ini sudah menerbitkan artikel hari ini. */
  hasUpload: boolean;
  latest: { title: string; createdAt: string | null } | null;
};

type RedakturStat = {
  name: string;
  email: string | null;
  slug: string;
  /** Jumlah artikel pada rentang terpilih. */
  uploadsInRange: number;
  /** Jumlah artikel yang terbit hari ini (WIB). */
  uploadsToday: number;
  /** Total akumulasi seluruh waktu. */
  totalAll: number;
  /** Artikel terakhir yang pernah diterbitkan (seluruh waktu). */
  lastArticle: { title: string; createdAt: string | null } | null;
};

type AnalyticsPayload = {
  range: RangeKey;
  rangeLabel: string;
  summary: {
    totalInRange: number;
    totalToday: number;
    kategoriTerisi: number;
    kategoriTotal: number;
    redakturAktif: number;
    redakturTerdaftar: number;
    kategoriTerpopuler: { name: string; count: number } | null;
  };
  categories: CategoryStat[];
  redaktur: RedakturStat[];
};

const RANGE_LABELS: Record<RangeKey, string> = {
  "hari-ini": "Hari Ini",
  "7-hari": "7 Hari Terakhir",
  "bulan-ini": "Bulan Ini",
  semua: "Semua Waktu",
};

function buildPayload(
  rows: AnalyticsRow[],
  authUsers: AuthUserLite[] | null,
  range: RangeKey,
  now: Date
): AnalyticsPayload {
  const filter = resolveRange(range, now);
  const todayFilter = resolveRange("hari-ini", now);
  const todaySince = todayFilter.since?.getTime() ?? Infinity;

  const published = rows.filter((r) => !isDraftRow(r));
  const inWindow = published.filter((r) => inRange(r, filter));
  const today = published.filter((r) => inRange(r, todayFilter));

  // Peta user Auth → email/nama, plus lookup by author_slug untuk baris lawas
  // yang tidak memiliki user_id.
  const authById = new Map<string, AuthUserLite>();
  const authBySlug = new Map<string, AuthUserLite>();
  for (const u of authUsers ?? []) {
    authById.set(u.id, u);
    if (u.authorSlug) authBySlug.set(u.authorSlug.toLowerCase(), u);
  }

  const categories: CategoryStat[] = CATEGORIES.map((cat) => {
    const inCatAll = published.filter((r) => matchesCategory(r, cat.name, cat.slug));
    const inCatWindow = inWindow.filter((r) => matchesCategory(r, cat.name, cat.slug));
    const inCatToday = today.filter((r) => matchesCategory(r, cat.name, cat.slug));
    const latestRow = inCatAll[0] ?? null;
    return {
      slug: cat.slug,
      name: cat.name,
      label: cat.label,
      count: inCatWindow.length,
      countToday: inCatToday.length,
      totalAll: inCatAll.length,
      hasUpload: inCatToday.length > 0,
      latest: latestRow
        ? {
            title: latestRow.title,
            createdAt:
              typeof latestRow.created_at === "string" ? latestRow.created_at : null,
          }
        : null,
    };
  });

  // Produktivitas redaktur: kelompokkan per akun (user_id) bila ada,
  // fallback ke byline (author_slug / nama) untuk baris lawas.
  const byRedaktur = new Map<string, RedakturStat>();
  for (const row of published) {
    const name = String(row.author || "").trim() || "Tanpa Nama";
    const slug = String(row.author_slug || "").trim();
    const userId = typeof row.user_id === "string" && row.user_id ? row.user_id : null;
    const key = userId ?? `by:${slug || name.toLowerCase()}`;
    const created = parseCreatedAt(row.created_at);
    const entry =
      byRedaktur.get(key) ??
      ({
        name,
        email: null,
        slug,
        uploadsInRange: 0,
        uploadsToday: 0,
        totalAll: 0,
        lastArticle: null,
      } satisfies RedakturStat);

    // Lengkapi email + nama dari akun Auth (user_id langsung, atau byline).
    const auth = userId ? authById.get(userId) : authBySlug.get(slug.toLowerCase());
    if (auth) {
      entry.email = auth.email;
      if (name === "Tanpa Nama" && auth.fullName) entry.name = auth.fullName;
      if (!entry.slug && auth.authorSlug) entry.slug = auth.authorSlug;
    }

    entry.totalAll += 1;
    if (inRange(row, filter)) entry.uploadsInRange += 1;
    if (created && created.getTime() >= todaySince) entry.uploadsToday += 1;
    // published urut created_at.desc — kemunculan pertama = terbaru.
    if (!entry.lastArticle) {
      entry.lastArticle = {
        title: row.title,
        createdAt: typeof row.created_at === "string" ? row.created_at : null,
      };
    }
    byRedaktur.set(key, entry);
  }

  // Akun redaksi terdaftar yang belum pernah unggah tetap tampil
  // (badge "Belum Ada Rilis") agar koordinator memantau cakupan tim.
  if (authUsers) {
    for (const u of authUsers) {
      if (!EDITORIAL_NON_ADMIN_ROLES.has(u.role)) continue;
      if (byRedaktur.has(u.id)) continue;
      byRedaktur.set(u.id, {
        name: u.fullName || u.email || "Tanpa Nama",
        email: u.email,
        slug: u.authorSlug ?? "",
        uploadsInRange: 0,
        uploadsToday: 0,
        totalAll: 0,
        lastArticle: null,
      });
    }
  }

  const redaktur = [...byRedaktur.values()].sort(
    (a, b) =>
      b.uploadsToday - a.uploadsToday ||
      b.totalAll - a.totalAll ||
      a.name.localeCompare(b.name, "id")
  );

  const primaryStats = categories.filter((c) =>
    PRIMARY_CATEGORY_SLUGS.includes(c.slug as never)
  );
  const filled = primaryStats.filter((c) => c.hasUpload).length;
  const top = categories.reduce<CategoryStat | null>(
    (best, c) => (best === null || c.count > best.count ? c : best),
    null
  );

  return {
    range,
    rangeLabel: RANGE_LABELS[range],
    summary: {
      totalInRange: inWindow.length,
      totalToday: today.length,
      kategoriTerisi: filled,
      kategoriTotal: primaryStats.length,
      redakturAktif: redaktur.filter((r) => r.uploadsToday > 0).length,
      redakturTerdaftar: redaktur.length,
      kategoriTerpopuler: top && top.count > 0 ? { name: top.name, count: top.count } : null,
    },
    categories,
    redaktur,
  };
}

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "analitik-redaksi", limit: 30, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const noStore = { headers: { "Cache-Control": "no-store" } } as const;

  let session;
  try {
    session = await getEditorialSessionRest(req.headers.get("cookie"));
  } catch {
    return NextResponse.json(
      { error: "Gagal memeriksa sesi. Coba muat ulang halaman." },
      { status: 500, ...noStore }
    );
  }
  if (!session) {
    return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401, ...noStore });
  }
  if (!canAccessAnalytics(session.appRole, session.emailVerified ? session.email : null)) {
    return NextResponse.json(
      { error: "Hanya Administrator atau Koordinator Redaksi yang dapat melihat analitik." },
      { status: 403, ...noStore }
    );
  }

  const rawRange = req.nextUrl.searchParams.get("range") ?? "hari-ini";
  const range: RangeKey = (RANGES as readonly string[]).includes(rawRange)
    ? (rawRange as RangeKey)
    : "hari-ini";

  const result = await fetchAllRows();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status, ...noStore });
  }

  // Daftar akun Auth bersifat pelengkap (email + akun nol-unggah) —
  // kegagalannya tidak menggugurkan payload analitik inti.
  const authUsers = await fetchAuthUsers();

  const payload = buildPayload(result.rows, authUsers, range, new Date());
  return NextResponse.json(payload, noStore);
}
