import { getArticles, sortByDate, articleUrl } from "@/lib/data";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";
const SITE_NAME = "GentaNusa";
const SITE_DESC = "Berita Nusantara terkini, akurat, dan terpercaya.";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toUTC(dateStr: string): string {
  // ISO "2026-09-11" -> RFC 822
  const d = new Date(dateStr + "T00:00:00+07:00");
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const articles = sortByDate(await getArticles()).slice(0, 20);

  const items = articles
    .map((a) => {
      const pubDate = toUTC(a.date);
      const loc = `${SITE_URL}${articleUrl(a)}`;
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${loc}</link>
      <guid>${loc}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(a.category)}</category>
      <description>${escapeXml(a.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>id-id</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}