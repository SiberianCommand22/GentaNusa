import { NextResponse, type NextRequest } from "next/server";
import { recordAnalytics } from "@/lib/analytics-server";
import { getArticles } from "@/lib/data";
import { rateLimit } from "@/app/api/rate-limit";

// Endpoint pencatat view — TIDAK PERNAH mengembalikan 4xx/5xx ke browser.
// Payload tracker yang belum lengkap (mis. tanpa articleId) atau kegagalan
// penyimpanan dijawab 200 `{ ok: false }` agar konsol browser bersih;
// kegagalan nyata tetap dicatat di log server.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, rateLimited: true }, { status: 200 });
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
  const path = typeof body.path === "string" ? body.path : "";
  const rawId = body.articleId;
  const slug =
    typeof body.slug === "string" && body.slug.trim().length > 0
      ? body.slug.trim()
      : null;
  const visitorId =
    typeof body.visitorId === "string" ? body.visitorId : undefined;

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
