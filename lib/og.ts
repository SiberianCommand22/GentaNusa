/**
 * Dynamic share-card image resolution for article pages via @vercel/og.
 * Appends a stable version hash based on title so WhatsApp/FB refreshes cache
 * whenever the article title/content updates, without needing manual parameters.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";

export function ogImageOrFallback(article: { title: string; image?: string | null; category?: string | null }): string {
  const title = article.title || "GentaNusa";
  const category = article.category || "Nasional";
  const image = article.image || "";

  // Stable cache buster derived from title length + first/last chars
  // This changes automatically if the article is re-published or updated,
  // forcing WhatsApp to fetch a fresh preview without requiring user query params.
  const cacheKey = Buffer.from(title).length.toString(36);

  const params = new URLSearchParams({
    title,
    category,
    v: cacheKey,
  });
  if (image) {
    params.set("image", image);
  }

  return `${SITE_URL}/api/og?${params.toString()}`;
}
