/**
 * URL kanonis + href kategori kanonis GentaNusa — TERPUSAT.
 *
 * Domain kanonis: https://gentanusa.id (TANPA `www`, tanpa trailing slash).
 * Normalisasi bertahan terhadap env yang keliru berisi `www.` / trailing
 * slash / spasi, sehingga sitemap, robots, feed, dan canonical metadata
 * tidak pernah menunjuk ke host ganda.
 */

// Kategori yang punya halaman root-level (sesuai redirects next.config.ts:
// /kategori/<slug> -> /<slug> 301). Selain daftar ini, href kanonis memakai
// prefix /kategori/<slug> (dilayani rewrite, tanpa redirect).
export const ROOT_CATEGORY_SLUGS = new Set([
  "nasional",
  "pertahanan",
  "politik",
  "ekonomi",
  "dunia",
  "peduli",
]);

/** Domain kanonis — tanpa www, tanpa trailing slash. */
export const CANONICAL_SITE_URL = "https://gentanusa.id";

/**
 * Normalisasi base URL aman: terima env apa pun, kembalikan origin kanonis.
 * - pangkas spasi & trailing slash
 * - paksa https (kecuali localhost http untuk dev)
 * - hapus `www.` agar selalu apex domain
 * - fallback ke CANONICAL_SITE_URL bila kosong / tidak valid
 */
export function canonicalSiteUrl(raw?: string | null): string {
  const fallback = CANONICAL_SITE_URL;
  let s = String(raw ?? "").trim().replace(/\/+$/, "");
  if (!s) return fallback;
  if (/^localhost(:\d+)?$/i.test(s)) return `http://${s}`;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!host) return fallback;
    const isLocal =
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.startsWith("127.") ||
      host === "::1";
    if (!isLocal && !host.includes(".")) return fallback;
    const protocol = isLocal ? "http:" : "https:";
    const port = u.port ? `:${u.port}` : "";
    return `${protocol}//${host}${port}`;
  } catch {
    return fallback;
  }
}

/** Base URL situs saat runtime (env ternormalisasi, atau kanonis). */
export function siteUrl(): string {
  return canonicalSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_SITE_URL
  );
}

/**
 * Href kanonis sebuah kanal kategori — selaras dengan redirects/rewrites
 * next.config.ts sehingga navigasi tidak memicu redirect 301 sia-sia:
 * - 6 kanal lama -> `/<slug>` (halaman root-level)
 * - kanal baru   -> `/kategori/<slug>` (rewrite internal)
 */
export function canonicalCategoryHref(slug: string): string {
  const key = String(slug || "").trim().toLowerCase();
  if (ROOT_CATEGORY_SLUGS.has(key)) return `/${key}`;
  return `/kategori/${key}`;
}
