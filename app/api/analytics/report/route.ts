import { NextResponse, type NextRequest } from "next/server";
import { getAnalyticsReport } from "@/lib/analytics-server";
import { getEditorialSession } from "@/lib/auth";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge.
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak. Wajib login." }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Hanya Administrator." }, { status: 403 });
  }

  try {
    const report = await getAnalyticsReport();
    return NextResponse.json(report);
  } catch (e) {
    console.error("[analytics/report]", e);
    return NextResponse.json({ error: "Gagal memuat statistik" }, { status: 500 });
  }
}