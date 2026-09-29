import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/site";
import {
  getArticles,
  getArticleBySlugOrId,
  formatDate,
  articleUrl,
} from "@/lib/data";
import styles from "./page.module.css";
import { getArticleReadCount } from "@/lib/analytics-server";
import { ArticleContent } from "@/components/article-content";
import { CardImage } from "@/components/card-image";
import { AdSlot } from "@/components/ad-slot";
import { ShareButtons } from "@/components/share-buttons";

const RESERVED_SLUGS = [
  "admin",
  "api",
  "cari",
  "tentang",
  "kebijakan-privasi",
  "syarat-ketentuan",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "kategori",
  "penulis",
  "privasi",
  "syarat",
  "kontak",
  "susunan-redaksi",
  "sindikasi",
  "feed.xml",
  "news-sitemap.xml",
];

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

function resolveAbsoluteImageUrl(image?: string): string {
  const siteUrl = "https://www.gentanusa.id";
  const fallback = `${siteUrl}/gentanusa.jpeg`;
  if (!image) return fallback;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${siteUrl}${image.startsWith("/") ? "" : "/"}${image}`;
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;

  if (RESERVED_SLUGS.includes(slug)) {
    return { title: "Halaman Tidak Ditemukan" };
  }

  const article = await getArticleBySlugOrId(slug);
  if (!article) return { title: "Artikel Tidak Ditemukan" };

  const SITE_URL = "https://www.gentanusa.id";
  const canonical = `${SITE_URL}/${article.slug || article.id}`;
  const imageUrl = resolveAbsoluteImageUrl(article.image);

  return {
    title: article.title,
    description: article.excerpt || article.title,
    alternates: { canonical },
    openGraph: {
      type: "article",
      siteName: "GentaNusa",
      title: article.title,
      description: article.excerpt || article.title,
      url: canonical,
      locale: "id_ID",
      publishedTime: article.date,
      authors: [article.author || "Redaksi GentaNusa"],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || article.title,
      images: [imageUrl],
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;

  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  const article = await getArticleBySlugOrId(slug);
  if (!article) notFound();

  const readCount = await getArticleReadCount(article.id);
  const related = (await getArticles())
    .filter((a) => {
      if (a.id === article.id) return false;
      if (a.category === article.category) return true;
      const shared = a.tags.filter(
        (t) => t !== "headline" && article.tags.includes(t)
      );
      return shared.length > 0;
    })
    .slice(0, 3);

  const SITE_URL = "https://www.gentanusa.id";
  const [lead, ...body] = article.content;

  return (
    <>
      <main className={styles.container}>
        {/* 1. Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Beranda</Link>
          <span className={styles.breadcrumbSep}></span>
          <Link href={"/kategori/" + article.category.toLowerCase()}>
            {article.category}
          </Link>
          <span className={styles.breadcrumbSep}></span>
          <span>{article.title}</span>
        </nav>

        <article className={styles.article}>
          {/* 2. Badge kategori */}
          <span className={styles.categoryBadge}>{article.category}</span>

          {/* 3. Judul utama */}
          <h1 className={styles.title}>{article.title}</h1>

          {/* 4. Metadata penulis & tanggal */}
          <div className={styles.meta}>
            <span className={styles.avatar} aria-hidden="true">
              {(article.author || "R").charAt(0).toUpperCase()}
            </span>
            <span className={styles.author}>{article.author}</span>
            <span className={styles.dot}>•</span>
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            <span className={styles.dot}>•</span>
            <span className={styles.readCount}>{readCount} kali dibaca</span>
          </div>

          {/* 5. Foto sampul + caption */}
          {article.image && (
            <figure className={styles.heroFigure}>
              <CardImage
                src={article.image}
                alt={article.title}
                className={styles.featuredImage}
              />
              <figcaption className={styles.caption}>
                <span>{article.image_caption || "Dokumentasi redaksi"}</span>
                <span className={styles.credit}>
                  Foto: {article.image_credit || "Redaksi GentaNusa"}
                </span>
              </figcaption>
            </figure>
          )}

          {/* 6. Lead pembuka */}
          {lead && <p className={styles.lead}>{lead}</p>}

          {/* 7. Isi artikel */}
          <div className={styles.content}>
            <ArticleContent content={body.length > 0 ? body : []} />
            {/* Google AdSense — In-article */}
            <AdSlot
              slot="1234567890"
              style={{
                margin: "2rem 0",
                minHeight: "250px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            />
          </div>

          <div className={styles.tags}>
            {article.tags
              .filter((tag) => tag !== "headline")
              .map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                </span>
              ))}
          </div>

          {/* 8. Share bar — langsung tombol, tanpa kotak abu-abu kosong */}
          <ShareButtons
            title={article.title}
            url={`${SITE_URL}${articleUrl(article)}`}
          />
        </article>

        {related.length > 0 && (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>Berita Terkait</h2>
            <div className={styles.relatedGrid}>
              {related.map((a) => (
                <Link key={a.id} href={articleUrl(a)} className={styles.relatedCard}>
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