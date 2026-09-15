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

// Sanitasi: buang tag/atribut berbahaya dari input user (XSS)
const SAFE_TAGS = ["strong", "b", "em", "i", "code", "a", "p", "br"];
const SAFE_ATTR = ["href"];
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
    .replace(/<(?!\/?(?:strong|b|em|i|code|a|p|br)\b)[^>]*>/gi, "");
}

function ContentBlockRenderer({ block }: { block: string }) {
  const html = parseInline(block);
  const clean = sanitizeHtml(html);

  return (
    <p
      className={styles.paragraph}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export function ArticleContent({ content }: { content: ContentBlock[] }) {
  return (
    <div className={styles.articleContent}>
      {content.map((block, i) => (
        <ContentBlockRenderer key={i} block={block} />
      ))}
    </div>
  );
}
