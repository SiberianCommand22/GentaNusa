import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { Header, Footer } from "@/components/site";
import { NewsletterBox } from "@/components/newsletter";
import { Reveal } from "@/components/reveal";
import { getArticles, getCategories, formatDate, sortByDate } from "@/lib/data";

export const metadata: Metadata = {
  title: "Beranda",
};

export const revalidate = 60;

function ArticleImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
}: {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 600}
      height={height || 340}
      style={{ width: "100%", height: "auto" }}
      className={className}
      priority={priority}
    />
  );
}

export default async function Home() {
  const latest = sortByDate(await getArticles());
  const featured = latest[0];

  const cats = (["Politik", "Ekonomi", "Nasional"] as const).map((name) => ({
    name,
    articles: latest
      .filter((a) => a.category.toLowerCase() === name.toLowerCase())
      .slice(0, 3),
  }));

  return (
    <main>
      <Header />

      {/* ===== Hero ===== */}
      <Reveal>
        <section className={styles.hero}>
          <div className={styles.container}>
            <Link href={`/artikel/${featured.id}`} className={styles.heroCard}>
              <div className={styles.heroImageWrapper}>
                <ArticleImage
                  src={featured.image}
                  alt={featured.title}
                  width={1200}
                  height={500}
                  priority
                />
                <div className={styles.heroOverlay}>
                  <span className={styles.badge} style={{ background: "#c8102e" }}>
                    {featured.category}
                  </span>
                  <h1 className={styles.heroTitle}>{featured.title}</h1>
                  <p className={styles.heroExcerpt}>{featured.excerpt}</p>
                  <div className={styles.meta}>
                    <span>{featured.author}</span>
                    <span>•</span>
                    <span>{formatDate(featured.date)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ===== Terbaru ===== */}
      <Reveal>
        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Terbaru</h2>
            <div className={styles.grid}>
              {latest.map((a) => (
                <Link key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                  <ArticleImage src={a.image} alt={a.title} className={styles.cardImage} />
                  <div className={styles.cardBody}>
                    <span className={styles.cardBadge} style={{ background: "#c8102e" }}>
                      {a.category}
                    </span>
                    <h3 className={styles.cardTitle}>{a.title}</h3>
                    <p className={styles.cardSummary}>{a.excerpt}</p>
                    <span className={styles.cardReadMore}>Baca selengkapnya →</span>
                    <div className={styles.meta}>
                      <span>{a.author}</span>
                      <span>•</span>
                      <span>{formatDate(a.date)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ===== Kategori ===== */}
      {cats.map((cat, idx) => (
        <Reveal key={cat.name} delay={idx * 100}>
          <section className={styles.section}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>
                <span
                  style={{
                    color: idx === 0 ? "#c8102e" : idx === 1 ? "#1a5c8a" : "#2e7d32",
                  }}
                >
                  {cat.name}
                </span>
              </h2>
              {cat.articles.length > 0 ? (
                <div className={styles.cardGrid}>
                  {cat.articles.map((a) => (
                    <Link key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                      <ArticleImage src={a.image} alt={a.title} className={styles.cardImage} />
                      <div className={styles.cardBody}>
                        <span
                          className={styles.cardBadge}
                          style={{
                            background:
                              idx === 0 ? "#c8102e" : idx === 1 ? "#1a5c8a" : "#2e7d32",
                          }}
                        >
                          {a.category}
                        </span>
                        <h3 className={styles.cardTitle}>{a.title}</h3>
                        <p className={styles.cardSummary}>{a.excerpt}</p>
                        <span className={styles.cardReadMore}>Baca selengkapnya →</span>
                        <div className={styles.meta}>
                          <span>{a.author}</span>
                          <span>•</span>
                          <span>{formatDate(a.date)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)" }}>
                  Belum ada artikel {cat.name}.
                </p>
              )}
            </div>
          </section>
        </Reveal>
      ))}

      <NewsletterBox />
      <Footer />
    </main>
  );
}