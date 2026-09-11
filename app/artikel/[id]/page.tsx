import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site";
import { articles, getArticle, getRelated } from "@/lib/data";
import styles from "./article.module.css";

type Params = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return articles.map((a) => ({ id: String(a.id) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const article = getArticle(Number(id));
  if (!article) return { title: "Artikel tidak ditemukan" };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: Params) {
  const { id } = await params;
  const article = getArticle(Number(id));
  if (!article) notFound();

  const related = getRelated(article);

  return (
    <>
      <Header />
      <main className={styles.container}>
        <article className={styles.article}>
          <span className={styles.badge}>
            <a href={`/kategori/${article.category.toLowerCase()}`}>
              {article.category}
            </a>
          </span>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            <span>{article.author}</span>
            <span>•</span>
            <span>{article.date}</span>
          </div>
          <p className={styles.excerpt}>{article.excerpt}</p>
          <div className={styles.content}>
            {article.content.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className={styles.tags}>
            {article.tags.map((t) => (
              <span key={t} className={styles.tag}>
                #{t}
              </span>
            ))}
          </div>
        </article>

        <aside className={styles.related}>
          <h2 className={styles.relatedTitle}>Berita Terkait</h2>
          {related.map((a) => (
            <a key={a.id} href={`/artikel/${a.id}`} className={styles.relatedCard}>
              <span className={styles.relatedCat}>{a.category}</span>
              <h3 className={styles.relatedHeadline}>{a.title}</h3>
              <span className={styles.relatedDate}>{a.date}</span>
            </a>
          ))}
        </aside>
      </main>
      <Footer />
    </>
  );
}