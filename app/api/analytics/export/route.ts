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

    // CSV builder
    const lines: string[] = [];

    // Header summary
    lines.push(`# GentaNusa Analytics Export`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push(`# Total Site Views: ${report.totalSiteViews}`);
    lines.push(`# Total Article Views: ${report.totalArticleViews}`);
    lines.push(`# Updated At: ${report.updatedAt}`);
    lines.push(`# Truncated: ${report.truncated}`);
    lines.push("");

    // Article reads table
    lines.push("article_id,title,date,reads");
    for (const a of report.articles) {
      const title = `"${a.title.replace(/"/g, '""')}"`;
      lines.push(`${a.id},${title},${a.date},${a.reads}`);
    }
    lines.push("");

    // Site views breakdown (optional: per-day aggregation if available)
    lines.push("metric,value");
    lines.push(`total_site_views,${report.totalSiteViews}`);
    lines.push(`total_article_views,${report.totalArticleViews}`);

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gentanusa-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    console.error("[analytics/export]", e);
    return NextResponse.json({ error: "Gagal export statistik" }, { status: 500 });
  }
}
