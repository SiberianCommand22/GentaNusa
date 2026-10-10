/**
 * Sanitizer HTML bersama (server-safe: tanpa API DOM, hanya regex).
 *
 * Kebijakan allowlist tunggal untuk seluruh render + penyimpanan konten:
 * dipakai oleh `components/article-content.tsx` (render publik),
 * `components/visual-editor.tsx` (kanvas editor), dan rute API
 * `POST /api/articles` / `PUT /api/articles/[id]` (sanitasi server-side
 * sebelum tulis DB — titik kepercayaan terakhir).
 */

// Tag yang boleh lolos sanitasi (semua yang dihasilkan toolbar CMS).
const SAFE_TAGS = new Set([
  "strong", "b", "em", "i", "u", "s", "code", "a",
  "p", "br", "h2", "h3", "blockquote", "ul", "ol", "li",
]);

// Token class yang diizinkan (subset aman ala prose, tanpa Tailwind).
const SAFE_CLASSES = new Set([
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

const FORBIDDEN = /javascript:|data:text\/html|<script|on\w+=/gi;

function cleanAttrs(tag: string, name: string, attrs: string): string {
  let out = "";
  const href = attrs.match(/href\s*=\s*"([^"]*)"/i);
  if (name === "a" && href && (/^https?:\/\//i.test(href[1]) || href[1].startsWith("/"))) {
    out += ` href="${href[1]}"`;
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
  const cls = attrs.match(/class\s*=\s*"([^"]*)"/i);
  if (cls) {
    const kept = cls[1].split(/\s+/).filter((t) => SAFE_CLASSES.has(t));
    if (kept.length > 0) out += ` class="${kept.join(" ")}"`;
  }
  return `<${tag}${out}`;
}

// Parser tag ringan: tag tak dikenal dibuang (isi dipertahankan),
// atribut disaring ketat. Blok komentar & doctype dibuang.
export function sanitizeHtml(html: string): string {
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

// Batas anti-abuse: murah untuk editor sah, mahal untuk spam bloat.
const MAX_BLOCKS = 1000;
const MAX_BLOCK_CHARS = 100_000;

/**
 * Sanitasi input `content` artikel (string | string[]) sebelum simpan DB.
 * Blok teks polos dikembalikan apa adanya; blok ber-HTML disanitasi dengan
 * kebijakan yang SAMA persis dengan jalur render. Kembalikan null bila tipe
 * input tidak dikenali.
 */
export function sanitizeContentInput(content: unknown): string[] | null {
  const list: unknown[] = Array.isArray(content)
    ? content
    : typeof content === "string"
      ? [content]
      : [];
  if (!Array.isArray(content) && typeof content !== "string") return null;
  const out: string[] = [];
  for (const raw of list.slice(0, MAX_BLOCKS)) {
    if (typeof raw !== "string") continue;
    const decoded = decodeEscapedHtml(raw);
    const clean = decoded.includes("<") ? sanitizeHtml(decoded) : raw;
    out.push(clean.slice(0, MAX_BLOCK_CHARS));
  }
  return out;
}
