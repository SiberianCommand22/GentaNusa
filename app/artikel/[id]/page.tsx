import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site";
import { ArticleContent } from "@/components/article-content";
import { ArticleImage } from "@/components/article-image";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ShareButtons } from "@/components/share-buttons";
import { getArticles, getArticle, getRelated } from "@/lib/data";
import styles from "./article.module.css";

type Params = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return getArticles().map((a) => ({ id: String(a.id) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const article = getArticle(Number(id));
  if (!article) return { title: "Artikel tidak ditemukan" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      type: "article",
      locale: "id_ID",
      url: `https://gentanusa.id/artikel/${article.id}`,
      siteName: "GentaNusa",
      title: article.title,
      description: article.excerpt,
      images: article.image
        ? [{ url: `https://gentanusa.id${article.image}`, width: 1200, height: 630, alt: article.title }]
        : undefined,
      publishedTime: undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.image ? [`https://gentanusa.id${article.image}`] : undefined,
    },
    alternates: {
      canonical: `/artikel/${article.id}`,
      types: { "application/rss+xml": "https://gentanusa.id/feed.xml" },
    },
  };
}

function jsonLd(article: Extract<ReturnType<typeof getArticle>, NonNullable<unknown>>) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.image ? `https://gentanusa.id${article.image}` : undefined,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: "GentaNusa", logo: { "@type": "ImageObject", url: "https://gentanusa.id/images/placeholder-article.svg" } },
    datePublished: article.date,
    mainEntityOfPage: `https://gentanusa.id/artikel/${article.id}`,
    keywords: article.tags.join(", "),
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
            <span>{article.date}</span>
          </div>

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

          <div className={styles.tags}>
            {article.tags.map((t) => (
              <span key={t} className={styles.tag}>
                #{t}
              </span>
            ))}
          </div>

          <ShareButtons title={article.title} url={`/artikel/${article.id}`} />
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