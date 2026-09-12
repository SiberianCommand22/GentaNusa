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

function ContentBlockRenderer({ block }: { block: string }) {
  const html = parseInline(block);

  return (
    <p
      className={styles.paragraph}
      dangerouslySetInnerHTML={{ __html: html }}
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
