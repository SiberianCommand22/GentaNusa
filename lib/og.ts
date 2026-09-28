/**
 * Share-card image URL for article pages.
 *
 * Must stay a plain static file: WhatsApp/Facebook/X give og:image roughly two
 * seconds, and any on-the-fly rendering (fetch a photo, composite it) blows
 * past that. The page then renders fine but the card has no thumbnail, which is
 * exactly the failure this replaced.
 *
 * scripts/og-render.py pre-renders these into the Supabase `articles` bucket as
 * JPEG q82 (~120 KB); PNG of a photo is ~500 KB and crawlers drop it.
 * The filename is a charCode*31 hash of the article title, mirrored in
 * og_object_name() on the Python side; check with og-hash-check.mjs.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dxysjpuisahujjacwvua.supabase.co";

export function ogHash(title: string): string {
  let h = 0;
  for (const ch of title) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h.toString(16);
}

export function ogImageOrFallback(article: { title: string }): string {
  return `${SUPABASE_URL}/storage/v1/object/public/articles/og-${ogHash(article.title)}.jpg`;
}
