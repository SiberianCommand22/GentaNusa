import styles from "./article-content.module.css";

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

// Sanitasi: buang tag/atribut berbahaya dari input user (XSS).
// u/s/h2/h3/blockquote/ul/ol/li diizinkan karena toolbar CMS resmi
// menghasilkannya; atribut selain href selalu dibuang.
const SAFE_TAGS = ["strong", "b", "em", "i", "u", "s", "code", "a", "p", "br", "h2", "h3", "blockquote", "ul", "ol", "li"];
const FORBIDDEN = /javascript:|data:text\/html|<script|on\w+=/gi;

function sanitizeHtml(html: string) {
  return html
    .replace(FORBIDDEN, "")
    .replace(/<a\s+href="([^"]*)"/g, (_, href) => {
      if (!/^https?:\/\//i.test(href) && !href.startsWith("/")) {
        return "<a";
      }
      return `<a href="${href}"`;
    })
    .replace(/<(?!\/?(?:strong|b|em|i|u|s|code|a|p|br|h2|h3|blockquote|ul|ol|li)\b)[^>]*>/gi, "");
}

// Konvensi blok CMS (ditulis toolbar, dikupas saat render):
//   ## / ###  → h2 / h3        >  → quote      - / 1. → list
//   [L] [C] [R] [J] → rata kiri / tengah / kanan / justify
type Align = "left" | "center" | "right" | "justify" | null;

const ALIGN_CODE: Record<string, Exclude<Align, null>> = {
  L: "left",
  C: "center",
  R: "right",
  J: "justify",
};

function splitAlign(block: string): { align: Align; rest: string } {
  const m = block.match(/^\[(L|C|R|J)\]\s*/);
  if (!m) return { align: null, rest: block };
  return { align: ALIGN_CODE[m[1]], rest: block.slice(m[0].length) };
}

function cleanInline(text: string): string {
  return sanitizeHtml(parseInline(text));
}

function ContentBlockRenderer({ block }: { block: string }) {
  const { align, rest } = splitAlign(block.trim());
  const style = align ? { textAlign: align as React.CSSProperties["textAlign"] } : undefined;

  let m: RegExpMatchArray | null;
  if ((m = rest.match(/^###\s+([\s\S]*)$/))) {
    return <h2 className={styles.heading3} style={style} dangerouslySetInnerHTML={{ __html: cleanInline(m[1]) }} />;
  }
  if ((m = rest.match(/^##\s+([\s\S]*)$/))) {
    return <h2 className={styles.heading2} style={style} dangerouslySetInnerHTML={{ __html: cleanInline(m[1]) }} />;
  }
  if ((m = rest.match(/^>\s?([\s\S]*)$/))) {
    return <blockquote className={styles.quote} style={style} dangerouslySetInnerHTML={{ __html: cleanInline(m[1]) }} />;
  }
  return (
    <p
      className={styles.paragraph}
      style={style}
      dangerouslySetInnerHTML={{ __html: cleanInline(rest) }}
    />
  );
}

function isListItem(b: string, ordered: boolean): string | null {
  const t = b.trim().replace(/^\[(L|C|R|J)\]\s*/, "");
  const m = ordered ? t.match(/^1[.)]\s+([\s\S]*)$/) : t.match(/^[-•]\s+([\s\S]*)$/);
  return m ? m[1] : null;
}

function listAlign(items: string[]): Align {
  for (const b of items) {
    const m = b.trim().match(/^\[(L|C|R|J)\]/);
    if (m) return ALIGN_CODE[m[1]];
  }
  return null;
}

export function ArticleContent({ content }: { content: ContentBlock[] }) {
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < content.length) {
    const block = content[i];
    const ulItem = isListItem(block, false);
    const olItem = isListItem(block, true);
    if (ulItem !== null || olItem !== null) {
      const ordered = olItem !== null;
      const items: string[] = [];
      while (i < content.length) {
        const it = isListItem(content[i], ordered);
        if (it === null) break;
        items.push(it);
        i++;
      }
      const align = listAlign(items);
      const style = align ? { textAlign: align as React.CSSProperties["textAlign"] } : undefined;
      const Tag = ordered ? "ol" : "ul";
      out.push(
        <Tag key={key++} className={ordered ? styles.olist : styles.ulist} style={style}>
          {items.map((it, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: cleanInline(it) }} />
          ))}
        </Tag>
      );
      continue;
    }
    out.push(<ContentBlockRenderer key={key++} block={block} />);
    i++;
  }
  return <div className={styles.articleContent}>{out}</div>;
}
