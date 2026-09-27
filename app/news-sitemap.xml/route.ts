import { getArticles, sortByDate } from "@/lib/data";

export const dynamic = "force-static";
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";
const SITE_NAME = "GentaNusa";

// Google News only surfaces articles published in the last 48 hours, and rejects
// any feed older than that as "stale". Capping at 100 is well inside the limit.
const MAX_ARTICLES = 100;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Google News requires full RFC 3339 timestamps, not RFC 822 like plain RSS.
function toRfc3339(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function GET() {
  const articles = sortByDate(await getArticles()).slice(0, MAX_ARTICLES);

  const items = articles
    .map((a) => {
      const url = `${SITE_URL}/artikel/${a.id}`;
      // Article images must be reachable without a cookie and at least 1200px wide,
      // otherwise Google silently drops the whole article from the News tab.
      const raw = a.image || "/images/placeholder-article.svg";
      const image = /^https?:\/\//i.test(raw) ? raw : `${SITE_URL}${raw}`;
      return `    <url>
      <loc>${escapeXml(url)}</loc>
      <news:news>
        <news:publication>
          <news:name>${escapeXml(SITE_NAME)}</news:name>
          <news:language>id</news:language>
        </news:publication>
        <news:publication_date>${toRfc3339(a.date)}</news:publication_date>
        <news:title>${escapeXml(a.title)}</news:title>
      </news:news>
      <image:image>
        <image:loc>${escapeXml(image)}</image:loc>
      </image:image>
    </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>id</news:language>
      </news:publication>
      <news:publication_date>${new Date().toISOString()}</news:publication_date>
      <news:title>${escapeXml(SITE_NAME)}</news:title>
    </news:news>
  </url>
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
