/**
 * Share-card image resolution for article pages.
 *
 * The article page has to choose between two URLs: a pre-rendered PNG written
 * by scripts/og-render.py, and the dynamic /api/og-image route. Static wins
 * because social crawlers time out waiting for a remote fetch plus a sharp
 * composite, and drop the thumbnail entirely when that happens.
 */

/** charCode*31 rolling hash — must stay byte-identical to og_object_name() in
 *  scripts/og-render.py, or the page points at a file that was never written. */
export function ogHash(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

export function ogUrlFor(title: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!base) return "";
  return `${base}/storage/v1/object/public/articles/og-${ogHash(title)}.png`;
}

export async function ogImageOrFallback(preRendered: string, dynamic: string): Promise<string> {
  if (!preRendered.startsWith("http")) return dynamic;
  try {
    const res = await fetch(preRendered, { method: "HEAD", cache: "force-cache" });
    if (res.ok) return preRendered;
  } catch {
    // Storage unreachable — fall through to the route that renders on demand.
  }
  return dynamic;
}
