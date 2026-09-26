import { NextResponse, type NextRequest } from "next/server";
import { getAnalyticsReport } from "@/lib/analytics-server";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }

  try {
    const report = await getAnalyticsReport();
    return NextResponse.json(report);
  } catch (e) {
    console.error("[analytics/report]", e);
    return NextResponse.json({ error: "Gagal memuat statistik" }, { status: 500 });
  }
}