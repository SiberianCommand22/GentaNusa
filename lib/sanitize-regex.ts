/**
 * Pembersih HTML regex murni — NOL dependensi DOM/jsdom.
 *
 * Modul ini SENGAJA tidak mengimpor `isomorphic-dompurify`, `dompurify`,
 * `jsdom`, atau `node:*` apa pun, sehingga aman di-bundle ke Vercel
 * Serverless Functions (jalur tulis `POST/PUT /api/articles`) tanpa pernah
 * memicu `Error [ERR_REQUIRE_ESM]: require() of ES Module`.
 *
 * Kebijakan allowlist TUNGGAL dipakai bersama `lib/sanitize-server.ts`
 * (satu-satunya sanitasi backend) dan komponen render/editor frontend.
 */

// Tag yang boleh lolos sanitasi.
export const SAFE_TAGS = new Set([
  "p", "b", "i", "em", "strong", "a",
  "h1", "h2", "h3", "h4", "ul", "ol", "li",
  "blockquote", "img", "figure", "figcaption", "br", "hr", "span",
]);

// Token class yang diizinkan (subset aman ala prose, tanpa Tailwind).
export const SAFE_CLASSES = new Set([
  "text-left",
  "text-center",
  "text-right",
  "text-justify",
  "leading-relaxed",
  "border-l-4",
  "border-[#041d56]",
  "pl-4",
  "pl-5",
  "pr-4",
  "py-3",
  "my-2",
  "my-6",
  "rounded-r-xl",
  "bg-blue-50/50",
  "text-base",
  "text-lg",
  "sm:text-lg",
  "text-slate-800",
  "font-serif",
  "italic",
  "text-blue-600",
  "underline",
]);

// Batas anti-abuse: murah untuk editor sah, mahal untuk spam bloat.
export const MAX_BLOCKS = 1000;
export const MAX_BLOCK_CHARS = 100_000;

const FORBIDDEN = /javascript:|data:text\/html|<script|on\w+=/gi;

function cleanAttrs(tag: string, name: string, attrs: string): string {
  let out = "";
  const href = attrs.match(/href\s*=\s*"([^"]*)"/i);
  if (name === "a" && href && (/^https?:\/\//i.test(href[1]) || href[1].startsWith("/"))) {
    out += ` href="${href[1]}"`;
    // target/rel hanya nilai aman: target dibatasi _blank/_self, rel ke
    // token allowlist (mencegah rel="opener" dsb). Seluruh link <a> otomatis
    // mendapat rel="noopener noreferrer" (anti reverse-tabnabbing XSS).
    const target = attrs.match(/target\s*=\s*"([^"]*)"/i);
    let isBlank = false;
    if (target && /^\s*_(blank|self)\s*$/i.test(target[1])) {
      const t = target[1].trim().toLowerCase();
      out += ` target="${t}"`;
      isBlank = t === "_blank";
    }
    const rel = attrs.match(/rel\s*=\s*"([^"]*)"/i);
    const kept = new Set<string>(["noopener", "noreferrer"]);
    if (rel) {
      for (const t of rel[1].split(/[\s,]+/).map((s) => s.trim().toLowerCase())) {
        if (["noopener", "noreferrer", "nofollow", "ugc", "sponsored"].includes(t)) kept.add(t);
      }
    }
    // Eksternal (http...) selalu bawa noopener+noreferrer walau tanpa target.
    if (isBlank || /^https?:\/\//i.test(href[1])) {
      kept.add("noopener");
      kept.add("noreferrer");
    }
    out += ` rel="${[...kept].join(" ")}"`;
  }
  // Gambar: src https/relatif saja (tolak javascript:/data:text/html),
  // alt/title/width/height lolos; class difilter allowlist di bawah.
  if (name === "img") {
    const src = attrs.match(/src\s*=\s*"([^"]*)"/i);
    if (src && (/^https?:\/\//i.test(src[1]) || src[1].startsWith("/") || src[1].startsWith("blob:") || src[1].startsWith("data:image/"))) {
      if (!/^javascript:/i.test(src[1])) out += ` src="${src[1]}"`;
    }
    const alt = attrs.match(/alt\s*=\s*"([^"]*)"/i);
    if (alt) out += ` alt="${alt[1].slice(0, 300)}"`;
    const title = attrs.match(/title\s*=\s*"([^"]*)"/i);
    if (title) out += ` title="${title[1].slice(0, 300)}"`;
    for (const dim of ["width", "height"] as const) {
      const m = attrs.match(new RegExp(`${dim}\\s*=\\s*"([^"]*)"`, "i"));
      if (m && /^\d{1,4}$/.test(m[1].trim())) out += ` ${dim}="${m[1].trim()}"`;
    }
  }
  // Inline style diloloskan HANYA untuk perataan teks toolbar
  // (text-align + text-justify). Deklarasi lain dibuang agar aman.
  const style = attrs.match(/style\s*=\s*"([^"]*)"/i);
  if (style && (name === "p" || name === "h2" || name === "h3" || name === "blockquote")) {
    const kept = style[1]
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .filter(
        (d) =>
          /^text-align\s*:\s*(left|center|right|justify)$/i.test(d) ||
          /^text-justify\s*:\s*inter-word$/i.test(d)
      );
    if (kept.length > 0) out += ` style="${kept.join("; ")};"`;
  }
  // Event handler inline (onclick="...", onerror='...', unquoted) dibuang
  // total — tidak ada atribut on* yang pernah lolos ke output.
  const cls = attrs.match(/class\s*=\s*"([^"]*)"/i);
  if (cls) {
    const kept = cls[1].split(/\s+/).filter((t) => SAFE_CLASSES.has(t));
    if (kept.length > 0) out += ` class="${kept.join(" ")}"`;
  }
  return `<${tag}${out}`;
}

// Parser tag ringan: tag tak dikenal dibuang (isi dipertahankan),
// atribut disaring ketat. Blok komentar & doctype dibuang.
export function regexScrub(html: string): string {
  return html
    .replace(FORBIDDEN, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>/g, (full, rawName: string, attrs: string) => {
      const closing = full.startsWith("</");
      const name = rawName.toLowerCase();
      if (!SAFE_TAGS.has(name)) return "";
      if (closing) return `</${name}>`;
      if (full.endsWith("/>")) return `${cleanAttrs(name, name, attrs)}/>`;
      return cleanAttrs(name, name, attrs) + ">";
    });
}

// Strip konten AKTIF beserta isinya — regexScrub hanya membuang tag tapi
// mempertahankan isi teks, yang berbahaya untuk <script>/<style>/<iframe>.
export function stripActiveContent(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style\s*>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi, "");
}

// Blok yang terlanjur tersimpan sebagai entitas escape (`&lt;p ...&gt;`)
// didekode kembali menjadi HTML sebelum sanitasi agar tidak tampil mentah.
export function decodeEscapedHtml(block: string): string {
  if (!block.includes("&lt;")) return block;
  return block
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Pembersih HTML aman untuk backend — murni string/regex, tanpa DOM.
 * Urutan: buang event handler (double/single/unquoted quote) → strip
 * <script>/<style>/<iframe> beserta isi → scrub allowlist ketat.
 */
export function cleanArticleHtml(html: string): string {
  const input = String(html ?? "");
  if (!input) return "";
  return regexScrub(
    stripActiveContent(
      input
        .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
        .replace(/on\w+\s*=\s*'[^']*'/gi, "")
        .replace(/on\w+\s*=\s*[^\s>]+/gi, "")
    )
  );
}
