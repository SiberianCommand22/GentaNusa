import { NextResponse, type NextRequest } from "next/server";
import { recordAnalytics } from "@/lib/analytics-server";
import { rateLimit } from "@/app/api/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (!limited.ok) return limited.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const kind = body?.kind;
  const path = body?.path;
  const articleId = body?.articleId;
  const visitorId = body?.visitorId;

  if (kind !== "site" && kind !== "article") {
    return NextResponse.json({ error: "Kind harus 'site' atau 'article'" }, { status: 400 });
  }
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "Path wajib" }, { status: 400 });
  }
  if (kind === "article" && (!articleId || typeof articleId !== "number" || articleId <= 0)) {
    return NextResponse.json({ error: "ID artikel wajib untuk kind=article" }, { status: 400 });
  }

  try {
    await recordAnalytics({ kind, path, articleId, visitorId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[analytics/record]", e);
    return NextResponse.json({ error: "Gagal mencatat statistik" }, { status: 500 });
  }
}