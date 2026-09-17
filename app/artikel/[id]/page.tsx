import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Header, Footer } from "@/components/site";
import { getArticles, getCategoryBySlug, formatDate } from "@/lib/data";
import { ArticleContent } from "@/components/article-content";
import { CardImage } from "@/components/card-image";
import styles from "./article.module.css";

type Params = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ id: String(a.id) }));
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  const article = (await getArticles()).find((a) => a.id === Number(id));
  if (!article) return { title: "Artikel Tidak Ditemukan" };
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `${SITE_URL}/artikel/${article.id}`,
      images: [{ url: article.image || "/images/placeholder-article.svg", width: 1200, height: 630 }],
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const article = (await getArticles()).find((a) => a.id === numId);
  if (!article) notFound();

  const related = (await getArticles())
    .filter((a) => a.id !== numId && a.category === article.category)
    .slice(0, 3);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";

  return (
    <>
      <Header />
      <main className={styles.container}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Beranda</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href={`/kategori/${article.category.toLowerCase()}`}>{article.category}</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span>{article.title}</span>
        </nav>

        <article className={styles.article}>
          {article.image && (
            <figure className={styles.heroFigure}>
              <CardImage
                src={article.image}
                alt={article.title}
                className={styles.featuredImage}
              />
              <figcaption className={styles.caption}>
                Foto: {article.tags[0] || "GentaNusa"} — {formatDate(article.date)}
              </figcaption>
            </figure>
          )}

          <div className={styles.meta}>
            <span className={styles.author}>{article.author}</span>
            <span className={styles.dot}>•</span>
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          </div>

          <h1 className={styles.title}>{article.title}</h1>

          <div className={styles.content}>
            <ArticleContent content={article.content} />
          </div>

          <div className={styles.tags}>
            {article.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        </article>

        {related.length > 0 && (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>Terrelated</h2>
            <div className={styles.relatedGrid}>
              {related.map((a) => (
                <Link key={a.id} href={`/artikel/${a.id}`} className={styles.relatedCard}>
                  {a.image && (
                    <div className={styles.relatedImage}>
                      <CardImage src={a.image} alt={a.title} className={styles.cardImg} />
                    </div>
                  )}
                  <h3 className={styles.relatedCardTitle}>{a.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}