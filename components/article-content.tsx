import styles from "./article-content.module.css";
import { sanitizeHtml, decodeEscapedHtml } from "@/lib/sanitize-html";

export type ContentBlock = string;

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
