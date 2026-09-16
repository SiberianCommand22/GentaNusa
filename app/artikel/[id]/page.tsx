import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site";
import { ArticleContent } from "@/components/article-content";
import { ArticleImage } from "@/components/article-image";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ShareButtons } from "@/components/share-buttons";
import { AuthorBox } from "@/components/author-box";
import { NewsletterBox } from "@/components/newsletter";
import { ListenButton } from "@/components/listen-button";
import { getArticles, getArticle, getRelated, formatDate, type Article } from "@/lib/data";
import styles from "./article.module.css";

type Params = { params: Promise<{ id: string }> };

// ID artikel baru (dari admin) harus bisa diakses — dynamicParams true
// (notFound() tetap lindungi ID sampah)
export const dynamicParams = true;
// Auto-refresh: artikel baru muncul ≤60 detik tanpa deploy
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ id: String(a.id) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";
  const { id } = await params;
  const article = await getArticle(Number(id));
  if (!article) return { title: "Artikel tidak ditemukan" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: `${SITE_URL}/artikel/${article.id}`,
      siteName: "GentaNusa",
      title: article.title,
      description: article.excerpt,
      images: article.image
        ? [{ url: `${SITE_URL}${article.image}`, width: 1200, height: 630, alt: article.title }]
        : undefined,
      publishedTime: undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.image ? [`${SITE_URL}${article.image}`] : undefined,
    },
    alternates: {
      canonical: `/artikel/${article.id}`,
      types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
    },
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";

function jsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.image ? `${SITE_URL}${article.image}` : undefined,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: "GentaNusa", logo: { "@type": "ImageObject", url: `${SITE_URL}/images/placeholder-article.svg` } },
    datePublished: article.date,
    mainEntityOfPage: `${SITE_URL}/artikel/${article.id}`,
    keywords: article.tags.join(", "),
  };
}

export default async function ArticlePage({ params }: Params) {
  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isFinite(articleId) || articleId <= 0) notFound();
  const article = await getArticle(articleId);
  if (!article) notFound();

  const related = await getRelated(article);
  const readingTime = Math.max(
    1,
    Math.round(article.content.join(" ").split(/\s+/).length / 200)
  );

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(article)) }}
      />
      <main className={styles.container}>
        <article className={styles.article}>
          <Breadcrumbs
            items={[
              { label: "Beranda", href: "/" },
              { label: article.category, href: `/kategori/${article.category.toLowerCase()}` },
              { label: article.title },
            ]}
          />
          <span className={styles.badge}>
            <a href={`/kategori/${article.category.toLowerCase()}`}>
              {article.category}
            </a>
          </span>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            <span>{article.author}</span>
            <span>•</span>
            <span>{formatDate(article.date)}</span>
            <span>•</span>
            <span>{readingTime} menit baca</span>
          </div>
          <ListenButton text={article.content.join(" ")} />

          {article.image && (
            <div className={styles.featuredImage}>
              <ArticleImage
                src={article.image}
                alt={article.title}
                className={styles.image}
              />
            </div>
          )}

          <p className={styles.excerpt}>{article.excerpt}</p>

          <ArticleContent content={article.content} />
          <AuthorBox
            name={article.author}
            slug={article.authorSlug}
            role={article.authorRole}
          />

          <div className={styles.tags}>
            {article.tags.map((t) => (
              <span key={t} className={styles.tag}>
                #{t}
              </span>
            ))}
          </div>

          <ShareButtons title={article.title} url={`/artikel/${article.id}`} />

          <NewsletterBox compact />
        </article>

        <aside className={styles.related}>
          <h2 className={styles.relatedTitle}>Berita Terkait</h2>
          {related.map((a) => (
            <a key={a.id} href={`/artikel/${a.id}`} className={styles.relatedCard}>
              {a.image && (
                <div className={styles.relatedImage}>
                  <ArticleImage src={a.image} alt={a.title} className={styles.relatedImg} />
                </div>
              )}
              <span className={styles.relatedCat}>{a.category}</span>
              <h3 className={styles.relatedHeadline}>{a.title}</h3>
              <span className={styles.relatedDate}>{formatDate(a.date)}</span>
            </a>
          ))}
        </aside>
      </main>
      <Footer />
    </>
  );
}