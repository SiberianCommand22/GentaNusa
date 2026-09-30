import styles from "./article-content.module.css";

export type ContentBlock = string;

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
  "pl-4",
  "italic",
  "my-2",
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
  const cls = attrs.match(/class\s*=\s*"([^"]*)"/i);
  if (cls) {
    const kept = cls[1].split(/\s+/).filter((t) => SAFE_CLASSES.has(t));
    if (kept.length > 0) out += ` class="${kept.join(" ")}"`;
  }
  return `<${tag}${out}`;
}

// Parser tag ringan: tag tak dikenal dibuang (isi dipertahankan),
// atribut disaring ketat. Blok komentar & doctype dibuang.
function sanitizeHtml(html: string): string {
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
function decodeEscapedHtml(block: string): string {
  if (!block.includes("&lt;")) return block;
  return block
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseInline(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

// Fallback penanda lawas CMS ([L]/[C]/[R]/[J], ##, >, -) → HTML setara.
const ALIGN_OF: Record<string, string> = { L: "text-left", C: "text-center", R: "text-right", J: "text-justify" };

function legacyToHtml(block: string): string {
  let align = "";
  let rest = block;
  const am = rest.match(/^\[(L|C|R|J)\]\s*/);
  if (am) {
    align = am[1] === "L" ? "" : ` class="${ALIGN_OF[am[1]]}"`;
    rest = rest.slice(am[0].length);
  }
  let m: RegExpMatchArray | null;
  if ((m = rest.match(/^###\s+([\s\S]*)$/))) return `<h3${align}>${m[1]}</h3>`;
  if ((m = rest.match(/^##\s+([\s\S]*)$/))) return `<h2${align}>${m[1]}</h2>`;
  if ((m = rest.match(/^>\s?([\s\S]*)$/))) return `<blockquote${align}>${m[1]}</blockquote>`;
  const t = rest.trim();
  const um = t.match(/^[-•]\s+([\s\S]*)$/);
  if (um) return `<ul${align}><li>${um[1]}</li></ul>`;
  const om = t.match(/^1[.)]\s+([\s\S]*)$/);
  if (om) return `<ol${align}><li>${om[1]}</li></ol>`;
  if (align) return `<p${align}>${rest}</p>`;
  return rest;
}

const BLOCK_TAG = /^\s*<(p|h2|h3|blockquote|ul|ol)\b/i;

export function ArticleContent({ content }: { content: ContentBlock[] }) {
  return (
    <div className={`${styles.articleContent} richtext article-body`}>
      {content.map((raw, i) => {
        // Dekode entitas escape dulu, lalu sanitasi. Render SELALU via
        // dangerouslySetInnerHTML — jangan pernah `{p}` teks biasa.
        const decoded = decodeEscapedHtml(raw);
        const html = sanitizeHtml(decoded.includes("<") ? decoded : parseInline(legacyToHtml(decoded)));
        if (BLOCK_TAG.test(html)) {
          return <div key={i} className={styles.rawBlock} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        return (
          <p key={i} className={styles.paragraph} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </div>
  );
}
