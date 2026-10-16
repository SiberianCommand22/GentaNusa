/**
 * Lapisan data Supabase via `fetch` murni — NOL dependensi npm.
 *
 * Modul ini SENGAJA tidak mengimpor `@supabase/supabase-js`,
 * `@supabase/ssr`, `isomorphic-dompurify`, atau `node:*` apa pun
 * (hanya `lib/roles.ts` yang juga tanpa dependensi + API `fetch` /
 * `process.env` bawaan runtime). Tujuannya: mengecilkan bundel
 * Vercel Serverless/Edge (`/api/articles`, `/api/articles/[id]`,
 * `middleware`) di bawah batas 1 MB paket Hobby — paket supabase-js
 * penuh (`realtime-js` + `phoenix` + `gotrue` + `storage`, ±215 KB)
 * tidak pernah ikut ter-bundel.
 *
 * Semantik DISAMAKAN PERSIS dengan implementasi supabase-js yang
 * digantikan (`lib/auth.ts`, `lib/supabase.ts`, `lib/data.ts`,
 * `lib/editorial-articles.ts`):
 *  - verifikasi token via `GET /auth/v1/user` (endpoint yang sama persis
 *    dengan `auth.getUser()`),
 *  - query PostgREST langsung (`select`/`insert`/`update`/`delete` +
 *    filter `eq`/`not.like`/`order`/`limit` yang ekuivalen),
 *  - toleransi kolom (kupas kolom hilang satu per satu, maks 8x),
 *  - isolasi kepemilikan `user_id`, pesan error 401/403/503 yang sama.
 *
 * Aman dipakai di Edge (`middleware.ts`) maupun Node (route handler):
 * tidak menyentuh `next/headers` — sesi dibaca dari header `Cookie`
 * mentah yang diteruskan pemanggil.
 */
import { isAdminIdentity } from "@/lib/roles";

// ---------------------------------------------------------------------------
// Konfigurasi
// ---------------------------------------------------------------------------

type RestConfig = { url: string; anonKey: string; serviceKey: string };

function getRestConfig(): RestConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Vercel memakai SUPABASE_SERVICE_ROLE_KEY, lokal memakai SUPABASE_SERVICE_KEY.
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !anonKey || !serviceKey) return null;
  return { url, anonKey, serviceKey };
}

/** Cek kesiapan ala `isSupabaseReady` — pesan error dipertahankan. */
export function ensureRestClient():
  | { ok: true; cfg: RestConfig }
  | { ok: false; error: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url)
    return { ok: false, error: "NEXT_PUBLIC_SUPABASE_URL belum di-set (.env.local)" };
  if (!anonKey)
    return { ok: false, error: "NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set (.env.local)" };
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return { ok: false, error: "Service key belum di-set" };
  return { ok: true, cfg: { url, anonKey, serviceKey } };
}

// ---------------------------------------------------------------------------
// Sesi redaksi (pengganti `getEditorialSession` — tanpa supabase-js)
// ---------------------------------------------------------------------------

export type EditorialSession = {
  /** UUID akun Supabase Auth pemilik artikel. */
  userId: string | null;
  email: string | null;
  role: string;
  /** true = Administrator (lihat semua + hapus), false = Penulis/Editor biasa. */
  isAdmin: boolean;
  fullName: string | null;
  authorSlug: string | null;
  /** Peran TERVERIFIKASI dari `app_metadata.role` (sumber gerbang /admin). */
  appRole: string;
  /** true bila email identitas sudah terkonfirmasi di Supabase Auth. */
  emailVerified: boolean;
};

type RestUser = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Pemetaan user → sesi, IDENTIK dengan `sessionFromSupabaseUser`. */
export function sessionFromRestUser(user: RestUser): EditorialSession {
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const adminRole = String(appMeta.role ?? "")
    .trim()
    .toLowerCase();
  const displayRole =
    adminRole || String(userMeta.role ?? "").trim().toLowerCase() || "editor";
  const email = readString(user.email);
  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
  return {
    userId: user.id || null,
    email,
    role: displayRole,
    isAdmin: isAdminIdentity({ role: adminRole, email: emailVerified ? email : null }),
    appRole: adminRole,
    emailVerified,
    fullName:
      readString(userMeta.full_name) ??
      readString(userMeta.name) ??
      readString(userMeta.display_name),
    authorSlug: readString(userMeta.author_slug),
  };
}

/** Verifikasi access token langsung ke Supabase Auth (setara `auth.getUser`). */
export async function verifyAuthToken(token: string): Promise<RestUser | null> {
  const cfg = getRestConfig();
  if (!cfg || !token) return null;
  try {
    const res = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as RestUser;
    if (!user || typeof user.id !== "string") return null;
    return user;
  } catch {
    return null;
  }
}

/** Parser header `Cookie` mentah — tanpa `next/headers` (aman Edge). */
function parseCookies(header: string | null): Map<string, string> {
  const out = new Map<string, string>();
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    let value = part.slice(idx + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch {
      // biarkan mentah
    }
    if (name && !out.has(name)) out.set(name, value);
  }
  return out;
}

/**
 * Sesi redaksi aktif dari header `Cookie` mentah, atau null.
 * TIDAK PERNAH melempar — kegagalan apa pun = "belum login" (null).
 * Aturan IDENTIK dengan `getEditorialSession`: flag `genta_admin` +
 * token `genta_token` wajib ada, lalu verifikasi ke Supabase Auth.
 */
export async function getEditorialSessionRest(
  cookieHeader: string | null
): Promise<EditorialSession | null> {
  try {
    const jar = parseCookies(cookieHeader);
    if (jar.get("genta_admin") !== "1") return null;
    const token = jar.get("genta_token");
    if (!token) return null;
    const user = await verifyAuthToken(token);
    if (!user) return null;
    return sessionFromRestUser(user);
  } catch {
    return null;
  }
}

// Nama byline otomatisasi/bot yang dilarang tampil sebagai penulis artikel.
const BLOCKED_AUTHOR_NAMES = new Set([
  "redaksigenta",
  "hermes",
  "bot",
  "autobot",
  "scraper",
  "autopost",
  "autoposter",
]);

function normalizeAuthorName(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (BLOCKED_AUTHOR_NAMES.has(key)) return "";
  return s;
}

/**
 * Nama penulis tampilan — IDENTIK dengan `resolveAuthorName`.
 * Admin bebas (kecuali nama bot); penulis terkunci ke identitas sesi
 * (atau byline kustom bila diizinkan). Kepemilikan tetap murni `user_id`.
 */
export function resolveAuthorNameRest(
  session: EditorialSession,
  requested: unknown,
  fallback = "Redaksi GentaNusa",
  allowCustomByline = false
): string {
  const clean = normalizeAuthorName(requested).slice(0, 80);
  if (session.isAdmin) {
    return clean || session.fullName || fallback;
  }
  if (allowCustomByline && clean) {
    return clean;
  }
  return session.fullName || clean || fallback;
}

// ---------------------------------------------------------------------------
// PostgREST via fetch (pengganti query-builder supabase-js)
// ---------------------------------------------------------------------------

export type ArticleRow = {
  id: number;
  slug?: string | null;
  title: string;
  category: string;
  excerpt?: string | null;
  content?: string[] | string | null;
  lead?: string | null;
  date: string;
  author: string;
  author_slug?: string | null;
  author_role?: string | null;
  image?: string | null;
  cover_image?: string | null;
  image_caption?: string | null;
  image_credit?: string | null;
  secondary_image?: string | null;
  secondary_image_caption?: string | null;
  secondary_image_credit?: string | null;
  optional_image?: string | null;
  optional_image_caption?: string | null;
  optional_image_credit?: string | null;
  tags?: string[] | string | null;
  status?: string | null;
  user_id?: string | null;
};

export const ARTICLE_COLUMNS_BASE =
  "id,slug,title,category,excerpt,content,lead,date,author,author_slug,author_role,image,cover_image,image_caption,image_credit,secondary_image,secondary_image_caption,secondary_image_credit,optional_image,optional_image_caption,tags,status,created_at";

export const ARTICLE_COLUMNS_WITH_OWNER = `${ARTICLE_COLUMNS_BASE},user_id`;

/** Pesan error kanonik saat penulis mencoba menyentuh artikel milik orang lain. */
export const ACCESS_DENIED_EDIT =
  "Akses Ditolak: Anda tidak memiliki izin mengedit artikel ini.";

/** Pesan error kanonik saat penulis biasa mencoba menghapus berita. */
export const ACCESS_DENIED_DELETE =
  "Hanya Administrator Utama yang berhak menghapus berita.";

/** Pesan error saat penulis mencoba menghapus artikel milik penulis lain. */
export const ACCESS_DENIED_DELETE_OWN =
  "Anda hanya memiliki izin untuk menghapus artikel buatan Anda sendiri.";

type PgError = { code?: string; message?: string };

async function pgRequest(
  cfg: RestConfig,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  params: string,
  body?: unknown
): Promise<{ rows: ArticleRow[]; error: PgError | null }> {
  try {
    const headers: Record<string, string> = {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
    };
    const init: RequestInit = { method, headers };
    if (method === "POST" || method === "PATCH") {
      headers["Content-Type"] = "application/json";
      headers["Prefer"] = "return=representation";
      init.body = JSON.stringify(body);
    }
    const res = await fetch(`${cfg.url}/rest/v1/articles${params}`, init);
    if (!res.ok) {
      let parsed: PgError = {};
      try {
        parsed = (await res.json()) as PgError;
      } catch {
        // body bukan JSON — pakai status sebagai pesan
      }
      return {
        rows: [],
        error: {
          code: parsed.code,
          message: parsed.message || `PostgREST ${res.status}`,
        },
      };
    }
    if (method === "DELETE") return { rows: [], error: null };
    const rows = (await res.json()) as ArticleRow[];
    return { rows: Array.isArray(rows) ? rows : [rows], error: null };
  } catch (e) {
    return {
      rows: [],
      error: { message: e instanceof Error ? e.message : "Jaringan Supabase gagal" },
    };
  }
}

function extractMissingColumn(error: PgError | null): string | null {
  const m = /Could not find the '([^']+)' column/i.exec(error?.message || "");
  return m ? m[1] : null;
}

function isMissingOwnerColumn(error: PgError | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /user_id/i.test(error.message || "");
}

/**
 * Sanitasi slug ketat untuk nilai apa pun yang menyentuh query PostgREST.
 * Whitelist: huruf kecil, angka, tanda hubung.
 */
export function sanitizeSlugRest(value: unknown, maxLen = 80): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
}

/** Baris dianggap milik sesi bila UUID server cocok. TIDAK ADA fallback slug. */
export function ownsArticleRest(
  article: { user_id?: string | null } | null,
  session: EditorialSession | null
): boolean {
  if (!article || !session) return false;
  if (!article.user_id || !session.userId) return false;
  return article.user_id === session.userId;
}

/** Administrator boleh mengedit apa pun; selain itu harus pemilik artikel. */
export function canEditArticleRest(
  article: { user_id?: string | null } | null,
  session: EditorialSession | null
): boolean {
  if (!session) return false;
  if (session.isAdmin) return true;
  return ownsArticleRest(article, session);
}

/**
 * Administrator boleh menghapus apa pun; penulis redaksi boleh menghapus
 * HANYA artikel miliknya sendiri (user_id === session.userId).
 */
export function canDeleteArticleRest(
  article: { user_id?: string | null } | null,
  session: EditorialSession | null
): boolean {
  if (!session) return false;
  if (session.isAdmin) return true;
  return ownsArticleRest(article, session);
}

export type ArticleListResult =
  | { ok: true; data: ArticleRow[] }
  | { ok: false; status: number; error: string };

/** Cache proses: null = belum diketahui, true = kolom ada, false = belum ada. */
let ownerColumnAvailable: boolean | null = null;

function orderParams(sp: URLSearchParams): void {
  sp.append("order", "date.desc");
  sp.append("order", "id.desc");
}

/**
 * Daftar artikel untuk ruang kerja redaksi — IDENTIK dengan
 * `fetchArticlesForSession` (admin: semua; penulis: hanya miliknya).
 */
export async function fetchArticlesForSessionRest(
  session: EditorialSession,
  options: { draftsOnly?: boolean } = {}
): Promise<ArticleListResult> {
  const c = ensureRestClient();
  if (!c.ok) return { ok: false, status: 503, error: c.error };

  const run = async (withOwner: boolean, columns: string) => {
    const sp = new URLSearchParams({ select: columns });
    orderParams(sp);
    if (options.draftsOnly) sp.set("status", "eq.draft");
    if (!session.isAdmin) {
      if (!withOwner || !session.userId) return { rows: [] as ArticleRow[], error: null };
      sp.set("user_id", `eq.${session.userId}`);
    }
    return pgRequest(c.cfg, "GET", `?${sp.toString()}`);
  };

  const withOwner = ownerColumnAvailable !== false;
  let columns = withOwner ? ARTICLE_COLUMNS_WITH_OWNER : ARTICLE_COLUMNS_BASE;
  let useOwner = withOwner;
  let first = await run(useOwner, columns);
  let data = first.rows;
  let error = first.error;

  for (let attempt = 0; attempt < 8 && error; attempt++) {
    const missing = extractMissingColumn(error);
    if (!missing) break;
    if (/^user_id$/i.test(missing)) {
      ownerColumnAvailable = false;
      useOwner = false;
      columns = ARTICLE_COLUMNS_BASE;
    } else {
      const parts = columns.split(",").map((s) => s.trim()).filter(Boolean);
      const kept = parts.filter((p) => p !== missing);
      if (kept.length === parts.length) break;
      columns = kept.join(",");
    }
    const retry = await run(useOwner, columns);
    data = retry.rows;
    error = retry.error;
  }
  if (!error && useOwner) ownerColumnAvailable = true;

  if (error) return { ok: false, status: 500, error: error.message ?? "Gagal memuat artikel" };
  return { ok: true, data };
}

export type ArticleFetchResult =
  | { ok: true; article: ArticleRow }
  | { ok: false; status: number; error: string };

/**
 * Ambil satu artikel untuk diedit — dengan PENJAGAAN KEPEMILIKAN.
 * IDENTIK dengan `fetchArticleForSession`.
 */
export async function fetchArticleForSessionRest(
  session: EditorialSession,
  rawId: string | number
): Promise<ArticleFetchResult> {
  const c = ensureRestClient();
  if (!c.ok) return { ok: false, status: 503, error: c.error };

  const id = String(rawId).trim();
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return { ok: false, status: 400, error: "id tidak valid" };
  }

  const withOwner = ownerColumnAvailable !== false;
  let selColumns = withOwner ? ARTICLE_COLUMNS_WITH_OWNER : ARTICLE_COLUMNS_BASE;
  let selOwner = withOwner;
  const read = async (useOwner: boolean, columns: string) => {
    void useOwner;
    const sp = new URLSearchParams({ select: columns, id: `eq.${Number(id)}`, limit: "1" });
    const { rows, error: err } = await pgRequest(c.cfg, "GET", `?${sp.toString()}`);
    return { data: (rows[0] ?? null) as ArticleRow | null, error: err };
  };

  const first = await read(selOwner, selColumns);
  let article = first.data;
  let error = first.error;

  for (let attempt = 0; attempt < 8 && error; attempt++) {
    const missing = extractMissingColumn(error);
    if (!missing) break;
    if (/^user_id$/i.test(missing)) {
      ownerColumnAvailable = false;
      selOwner = false;
      selColumns = ARTICLE_COLUMNS_BASE;
    } else {
      const parts = selColumns.split(",").map((s) => s.trim()).filter(Boolean);
      const kept = parts.filter((p) => p !== missing);
      if (kept.length === parts.length) break;
      selColumns = kept.join(",");
    }
    const retry = await read(selOwner, selColumns);
    article = retry.data;
    error = retry.error;
  }
  if (!error && selOwner) ownerColumnAvailable = true;

  if (error) return { ok: false, status: 500, error: error.message ?? "Gagal memuat artikel" };
  if (!article) return { ok: false, status: 404, error: "Artikel tidak ditemukan" };
  if (!canEditArticleRest(article, session)) {
    return { ok: false, status: 403, error: ACCESS_DENIED_EDIT };
  }
  return { ok: true, article };
}

// ---------------------------------------------------------------------------
// Jalur publik (pengganti `getArticles` / `getArticleBySlugOrId` dari lib/data)
// ---------------------------------------------------------------------------

export type PublicArticleLite = {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  image?: string;
  tags: string[];
};

function slugifyTitleLite(title: string): string {
  const slug = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug || "artikel";
}

function parseJsonBlocksLite(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((b): b is string => typeof b === "string");
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((b): b is string => typeof b === "string");
    }
    return [];
  } catch {
    return [value];
  }
}

// Cache per-process 30 detik — selaras kuota dengan `lib/data.ts`.
const liteCache = new Map<string, { data: PublicArticleLite[]; timestamp: number }>();
const LITE_CACHE_TTL = 30000;

/** Feed publik: HANYA published, tanpa baris staging lawas. */
export async function getPublicArticlesLite(): Promise<PublicArticleLite[]> {
  const cached = liteCache.get("articles");
  if (cached && Date.now() - cached.timestamp < LITE_CACHE_TTL) return cached.data;
  const c = ensureRestClient();
  let result: PublicArticleLite[] = [];
  if (c.ok) {
    try {
      const sp = new URLSearchParams({ select: "*" });
      sp.set("status", "eq.published");
      sp.set("author_slug", "not.like.staging-*");
      orderParams(sp);
      const { rows, error } = await pgRequest(c.cfg, "GET", `?${sp.toString()}`);
      if (!error && rows.length > 0) {
        result = rows.map((a) => ({
          id: a.id,
          slug: String(a.slug || "").trim() || slugifyTitleLite(a.title),
          title: a.title,
          category: a.category,
          excerpt: String(a.excerpt ?? ""),
          date: a.date,
          author: a.author,
          image: a.image ?? undefined,
          tags: parseJsonBlocksLite(a.tags),
        }));
      }
    } catch {
      // jatuh ke [] (empty state), sama seperti fallback lib/data.ts
    }
  }
  liteCache.set("articles", { data: result, timestamp: Date.now() });
  return result;
}

/** Cari artikel publik via slug SEO / ID numerik / slug-id. */
export async function getArticleBySlugOrIdLite(
  slugOrId: string
): Promise<PublicArticleLite | undefined> {
  const key = String(slugOrId || "").trim();
  if (!key) return undefined;
  const all = await getPublicArticlesLite();
  const direct = all.find((a) => a.slug === key);
  if (direct) return direct;
  if (!isNaN(Number(key))) {
    const byId = all.find((a) => a.id === Number(key));
    if (byId) return byId;
  }
  return all.find((a) => key === `${a.slug}-${a.id}`);
}

// ---------------------------------------------------------------------------
// Tulis / hapus (pengganti builder supabase-js di kedua rute artikel)
// ---------------------------------------------------------------------------

/** Insert toleran skema: kupas kolom hilang satu per satu (maks 8x). */
export async function insertArticleTolerant(
  payload: Record<string, unknown>
): Promise<{ data: ArticleRow | null; error: PgError | null }> {
  const c = ensureRestClient();
  if (!c.ok) return { data: null, error: { message: c.error } };
  const pending: Record<string, unknown> = { ...payload };
  let lastError: PgError | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const { rows, error } = await pgRequest(c.cfg, "POST", "", [pending]);
    if (!error) return { data: rows[0] ?? null, error: null };
    const missing = extractMissingColumn(error);
    if (!missing || !(missing in pending)) return { data: null, error };
    delete pending[missing];
    lastError = error;
  }
  return { data: null, error: lastError };
}

/** Update toleran skema — IDENTIK dengan `updateTolerant` di [id]/route. */
export async function updateArticleTolerant(
  id: string,
  values: Record<string, unknown>
): Promise<{ data: ArticleRow | null; error: PgError | null }> {
  const c = ensureRestClient();
  if (!c.ok) return { data: null, error: { message: c.error } };
  const pending: Record<string, unknown> = { ...values };
  let lastError: PgError | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const sp = new URLSearchParams({ id: `eq.${id}` });
    const { rows, error } = await pgRequest(c.cfg, "PATCH", `?${sp.toString()}`, pending);
    if (!error) return { data: rows[0] ?? null, error: null };
    const missing = extractMissingColumn(error);
    if (!missing || !(missing in pending)) return { data: null, error };
    delete pending[missing];
    lastError = error;
  }
  return { data: null, error: lastError };
}

/** Hapus permanen via service_role (bypass RLS) — admin only (dicek pemanggil). */
export async function deleteArticleById(
  id: string | number
): Promise<{ error: PgError | null }> {
  const c = ensureRestClient();
  if (!c.ok) return { error: { message: c.error } };
  const sp = new URLSearchParams({ id: `eq.${id}` });
  const { error } = await pgRequest(c.cfg, "DELETE", `?${sp.toString()}`);
  return { error };
}

/**
 * Satu artikel by ID numerik untuk jalur publik — IDENTIK dengan `getArticle`
 * di [id]/route (filter `status=published` di query; fallback tanpa filter +
 * tegak JS bila kolom `status` belum ada; fail-closed untuk non-published).
 */
export async function getArticleByIdLite(
  id: string,
  publishedOnly: boolean
): Promise<ArticleRow | null> {
  const c = ensureRestClient();
  if (!c.ok) return null;
  let columns = ARTICLE_COLUMNS_WITH_OWNER;
  for (let attempt = 0; attempt < 8; attempt++) {
    const sp = new URLSearchParams({ select: columns, id: `eq.${id}`, limit: "1" });
    if (publishedOnly) sp.set("status", "eq.published");
    const { rows, error } = await pgRequest(c.cfg, "GET", `?${sp.toString()}`);
    if (!error) return rows[0] ?? null;
    const missing = extractMissingColumn(error);
    if (!missing) {
      if (publishedOnly) {
        const fallback = await getArticleByIdLite(id, false);
        return fallback && fallback.status === "published" ? fallback : null;
      }
      return null;
    }
    const parts = columns.split(",").map((s) => s.trim()).filter(Boolean);
    const kept = parts.filter((p) => p !== missing);
    if (kept.length === parts.length) return null;
    columns = kept.join(",");
  }
  return null;
}
