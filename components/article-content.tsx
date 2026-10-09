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

// Kutipan narasumber: paragraf polos yang diawali tanda kutip atau markdown `>`.
const QUOTE_START = /^([">“‘»]|&gt;|&quot;|&#39;|—\s)/;

function isQuoteParagraph(raw: string): boolean {
  const t = raw.trimStart();
  return (
    t.startsWith('"') ||
    t.startsWith("“") ||
    t.startsWith("‘") ||
    t.startsWith(">") ||
    t.startsWith("»") ||
    /^—\s/.test(t)
  );
}

function stripQuoteMarkers(text: string): string {
  let t = text.trim();
  // Buang penanda markdown `>` di awal.
  t = t.replace(/^>\s?/, "").trim();
  // Buang sepasang tanda kutip luar bila mengapit seluruh paragraf.
  const pairs: Array<[string, string]> = [
    ['"', '"'],
    ["“", "”"],
    ["‘", "’"],
    ["»", "«"],
  ];
  for (const [open, close] of pairs) {
    if (t.startsWith(open) && t.endsWith(close) && t.length > 2) {
      t = t.slice(open.length, t.length - close.length).trim();
      break;
    }
  }
  return t;
}

export function ArticleContent({ content }: { content: ContentBlock[] }) {
  // MODUL 1: setiap <p> mempertahankan text-justify + hyphens:auto +
  // [text-align-last:left] agar baris terakhir tidak tertarik renggang.
  const JUSTIFY = "text-justify [text-align-last:left] [hyphens:auto]";
  const QUOTE_TW =
    "my-7 pl-5 pr-4 py-4 border-l-4 border-[#041d56] bg-blue-50/60 rounded-r-2xl text-justify [text-align-last:left] [hyphens:auto] italic text-slate-800 text-base sm:text-lg leading-relaxed font-serif shadow-sm";
  return (
    <div className={`${styles.articleContent} richtext article-body article-content`}>
      {content.map((raw, i) => {
        // Kutipan narasumber polos → Executive Blockquote langsung,
        // tanpa menunggu tag <blockquote> dari CMS.
        if (isQuoteParagraph(raw) && !/<[a-z][\s\S]*>/i.test(raw)) {
          const quoteText = stripQuoteMarkers(raw);
          const html = sanitizeHtml(parseInline(quoteText));
          return <blockquote key={i} className={`${styles.quote} ${QUOTE_TW}`} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        // Dekode entitas escape dulu, lalu sanitasi. Render SELALU via
        // dangerouslySetInnerHTML — jangan pernah `{p}` teks biasa.
        const decoded = decodeEscapedHtml(raw);
        const html = sanitizeHtml(decoded.includes("<") ? decoded : parseInline(legacyToHtml(decoded)));
        if (BLOCK_TAG.test(html)) {
          return <div key={i} className={`${styles.rawBlock} ${JUSTIFY}`} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        // Fallback: paragraf hasil sanitasi yang ternyata diawali kutip
        // (mis. lolos dari toolbar) tetap diangkat jadi blockquote.
        const textOnly = html.replace(/<[^>]*>/g, "").trim();
        if (QUOTE_START.test(html.trimStart()) || isQuoteParagraph(textOnly)) {
          const inner = sanitizeHtml(parseInline(stripQuoteMarkers(textOnly)));
          return <blockquote key={i} className={`${styles.quote} ${QUOTE_TW}`} dangerouslySetInnerHTML={{ __html: inner }} />;
        }
        return (
          <p key={i} className={`${styles.paragraph} ${JUSTIFY}`} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </div>
  );
}
