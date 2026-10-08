import Link from "next/link";
import Image from "next/image";
import { getArticles, formatDate, sortByDate, articleUrl } from "@/lib/data";
import { Footer } from "@/components/site";
import styles from "./page.module.css";

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
  // TERPOPULER adalah bagian permanen: begitu ada artikel kedua, sisanya
  // dipamerkan sebagai daftar terpopuler. Tidak ada kondisi hide/show lagi.
  const popularList = latest.length > 1 ? latest.slice(1) : latest;
  const showPopular = popularList.length > 0;
  const recentArticles = latest
    .filter((a) => a.slug !== headlineArticle.slug && a.id !== headlineArticle.id)
    .slice(0, 8);

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={showPopular ? styles.splitGrid : styles.splitGridFull}>
            <article className={styles.headline}>
              <Link href={articleUrl(headlineArticle)} className={styles.headlineCard}>
                <div className={styles.headlineThumb}>
                  <Image
                    src={
                      headlineArticle.image || "/images/placeholder-article.svg"
                    }
                    alt={headlineArticle.title}
                    width={1200}
                    height={675}
                    priority
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <h1 className={styles.headlineTitle}>{headlineArticle.title}</h1>
                <p className={styles.headlineLead}>{headlineArticle.excerpt}</p>
                <div className={styles.headlineMeta}>
                  <span>{headlineArticle.category}</span>
                  <span aria-hidden="true">•</span>
                  <span>{formatDate(headlineArticle.date)}</span>
                </div>
              </Link>
            </article>
            {showPopular && (
              <aside className={styles.sideGrid} aria-label="Berita terpopuler">
                <h3 className={styles.sideHeading}>Terpopuler</h3>
                <div className={styles.sideCards}>
                  {popularList.slice(0, 4).map((a) => (
                    <Link
                      key={a.id}
                      href={articleUrl(a)}
                      className={styles.compactCard}
                    >
                      <div className={styles.compactThumb}>
                        <Image
                          src={a.image || "/images/placeholder-article.svg"}
                          alt={a.title}
                          width={640}
                          height={360}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <h4 className={styles.compactTitle}>{a.title}</h4>
                      <div className={styles.compactCat}>{a.category}</div>
                    </Link>
                  ))}
                </div>
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
                <Link key={a.id} href={articleUrl(a)} className={styles.compactCard}>
                  <div className={styles.compactThumb}>
                    <Image
                      src={a.image || "/images/placeholder-article.svg"}
                      alt={a.title}
                      width={640}
                      height={360}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <h3 className={styles.compactTitle}>{a.title}</h3>
                  <div className={styles.compactCat}>{a.category}</div>
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
