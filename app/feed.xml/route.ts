import { getArticles } from "@/lib/data";

export const dynamic = "force-static";

const SITE_URL = "https://gentanusa.id";
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

const MONTHS: Record<string, string> = {
  Januari: "01", Februari: "02", Maret: "03", April: "04",
  Mei: "05", Juni: "06", Juli: "07", Agustus: "08",
  September: "09", Oktober: "10", November: "11", Desember: "12",
};

function toUTC(dateStr: string): string {
  // Format: "11 September 2026" -> RFC 822
  const [day, month, year] = dateStr.split(" ");
  const m = MONTHS[month];
  if (!m) return new Date().toUTCString();
  const d = `${year}-${m}-${day.padStart(2, "0")}T00:00:00+07:00`;
  return new Date(d).toUTCString();
}

export async function GET() {
  const articles = getArticles()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 20);

  const items = articles
    .map((a) => {
      const pubDate = toUTC(a.date);
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${SITE_URL}/artikel/${a.id}</link>
      <guid>${SITE_URL}/artikel/${a.id}</guid>
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