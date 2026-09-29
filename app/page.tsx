import Link from "next/link";
import { getArticles, formatDate, sortByDate, articleUrl } from "@/lib/data";
import { Footer } from "@/components/site";
import { CardImage } from "@/components/card-image";
import styles from "./page.module.css";

const CATEGORY_BADGE_BG = "#2563EB";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const latest = sortByDate(await getArticles());

  if (latest.length === 0) {
    return (
      <main>
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9" />
              <path d="M18 14h-8M15 18h-5M10 6H8v4h2" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>Belum Ada Berita yang Diterbitkan</h3>
          <p className={styles.emptyText}>
            Redaksi GentaNusa sedang menyiapkan liputan terkini untuk Anda.
            Silakan kembali beberapa saat lagi.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  const headlineArticle = latest[0];
  const popular = latest.slice(1, 4);
  const recentArticles = latest
    .filter((a) => a.slug !== headlineArticle.slug && a.id !== headlineArticle.id)
    .slice(0, 6);

  const showPopular = latest.length >= 3 && popular.length > 0;

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={showPopular ? styles.heroGrid : styles.heroGridFull}>
            <article className={styles.heroMain}>
              <Link href={articleUrl(headlineArticle)} className={styles.heroCard}>
                <div className={styles.heroImage}>
                  <img
                    src={headlineArticle.image || "/images/placeholder-article.svg"}
                    alt={headlineArticle.title}
                    width={1200}
                    height={630}
                    loading="eager"
                  />
                </div>
                <div className={styles.heroGradient} aria-hidden="true" />
                <span className={styles.badge}>{headlineArticle.category}</span>
                <div className={styles.heroText}>
                  <h1 className={styles.heroTitle}>{headlineArticle.title}</h1>
                  <p className={styles.heroExcerpt}>{headlineArticle.excerpt}</p>
                  <div className={styles.meta}>
                    <span>{headlineArticle.author}</span>
                    <span aria-hidden="true"> • </span>
                    <span>{formatDate(headlineArticle.date)}</span>
                  </div>
                </div>
              </Link>
            </article>
            {showPopular && (
              <aside className={styles.heroSide} aria-label="Berita terpopuler">
                <h3 className={styles.sideHeading}>Terpopuler</h3>
                {popular.map((a, i) => (
                  <Link key={a.id} href={articleUrl(a)} className={styles.sideItem}>
                    <span className={styles.sideNum}>{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className={styles.sideCat}>{a.category}</span>
                      <p className={styles.sideTitle}>{a.title}</p>
                    </span>
                  </Link>
                ))}
              </aside>
            )}
          </div>
        </div>
      </section>

      {recentArticles.length > 0 && (
        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Berita Terbaru</h2>
            <div className={styles.grid}>
              {recentArticles.map((a) => (
                <Link key={a.id} href={articleUrl(a)} className={styles.card}>
                  <CardImage src={a.image} alt={a.title} className={styles.cardImage} />
                  <div className={styles.cardBody}>
                    <div
                      className={styles.cardBadge}
                      style={{ background: CATEGORY_BADGE_BG }}
                    >
                      {a.category}
                    </div>
                    <h3 className={styles.cardTitle}>{a.title}</h3>
                    <div className={styles.cardMeta}>
                      <span>{a.author}</span>
                      <span> · </span>
                      <span>{formatDate(a.date)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}