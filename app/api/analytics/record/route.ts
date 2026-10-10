import { NextResponse, type NextRequest } from "next/server";
import { recordAnalytics } from "@/lib/analytics-server";
import { getArticles } from "@/lib/data";
import { rateLimit } from "@/app/api/rate-limit";

// Endpoint pencatat view — TIDAK PERNAH mengembalikan 4xx/5xx ke browser.
// Payload tracker yang belum lengkap (mis. tanpa articleId) atau kegagalan
// penyimpanan dijawab 200 `{ ok: false }` agar konsol browser bersih;
// kegagalan nyata tetap dicatat di log server.
function siteHosts(): Set<string> {
  const hosts = new Set<string>();
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "";
  try {
    if (raw) hosts.add(new URL(raw).hostname.toLowerCase());
  } catch {
    /* abaikan SITE_URL malformed */
  }
  hosts.add("gentanusa.id");
  hosts.add("www.gentanusa.id");
  hosts.add("gentanusa.vercel.app");
  hosts.add("localhost");
  return hosts;
}

// MEDIUM: endpoint publik tanpa auth — tolak penulisan lintas-origin agar
// tidak dipakai membanjiri bucket storage dari situs mana pun. Header
// Origin/Referer absen (curl, beacon tertentu) tetap lolos ke rate limit.
function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  if (!origin) return true;
  try {
    return siteHosts().has(new URL(origin).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, rateLimited: true }, { status: 200 });
  }
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  // Robust parser: dukung JSON standar maupun text/plain
  // (mis. bila tracker dikirim via navigator.sendBeacon).
  let body: Record<string, unknown> = {};
  try {
    try {
      const parsed: unknown = await req.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      const text = await req.text();
      const parsed: unknown = text ? JSON.parse(text) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const kind = body.kind;
  // Batas panjang anti-abuse: path/visitorId tak wajar ditolak sebelum
  // menyentuh storage (satu event = satu objek JSON di bucket).
  const rawPath = typeof body.path === "string" ? body.path : "";
  const path = rawPath.length > 500 ? "" : rawPath;
  const rawId = body.articleId;
  const slug =
    typeof body.slug === "string" && body.slug.trim().length > 0
      ? body.slug.trim().slice(0, 200)
      : null;
  const rawVisitor = typeof body.visitorId === "string" ? body.visitorId : undefined;
  const visitorId = rawVisitor ? rawVisitor.slice(0, 100) : undefined;

  if ((kind !== "site" && kind !== "article") || !path) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  let articleId: number | undefined;
  if (typeof rawId === "number" && Number.isFinite(rawId) && rawId > 0) {
    articleId = Math.floor(rawId);
  } else if (typeof rawId === "string" && /^\d+$/.test(rawId.trim())) {
    articleId = Number(rawId.trim());
  }

  // Fallback slug → id: tracker artikel tidak selalu tahu ID numerik
  // (counter selalu 0 bila event ditolak). Resolusi dilakukan di sisi
  // server memakai cache getArticles (30 dtk).
  if (kind === "article" && !articleId) {
    const targetSlug =
      slug ?? path.replace(/^\//, "").split("/").filter(Boolean).pop() ?? "";
    if (targetSlug) {
      try {
        const articles = await getArticles();
        articleId = articles.find((a) => a.slug === targetSlug)?.id;
      } catch (e) {
        console.error("[analytics/record] gagal resolusi slug", e);
      }
    }
    if (!articleId) {
      // Bukan artikel dikenal (mis. halaman statis) — diam, bukan error.
      return NextResponse.json({ ok: false }, { status: 200 });
    }
  }

  try {
    await recordAnalytics({ kind, path, articleId, visitorId });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[analytics/record]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
