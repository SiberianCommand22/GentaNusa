import { getArticles, formatDate, sortByDate } from "@/lib/data";
import { Footer } from "@/components/site";
import { CardImage } from "@/components/card-image";
import styles from "./page.module.css";

const categoryColors: Record<string, string> = {
  "Nasional": "#2e7d32",
  "Politik": "#c8102e",
  "Ekonomi": "#1a5c8a",
  "Kesehatan": "#0288d1",
  "Teknologi": "#6a1b9a",
  "Pendidikan": "#e65100",
  "Budaya": "#ad1457",
  "Lingkungan": "#558b2f",
  "Dunia": "#00695c",
  "Olahraga": "#d84315",
};

export const revalidate = 60;

export default async function Home() {
  const latest = sortByDate(await getArticles());

  // Empty state — tabel artikel kosong (mis. DB baru): sambut pembaca
  // dengan pesan elegan, bukan crash (latest[0] undefined) atau hero kosong.
  if (latest.length === 0) {
    return (
      <main>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>📰</p>
              <h1 className={styles.emptyTitle}>Belum ada berita terbaru</h1>
              <p className={styles.emptyText}>
                Redaksi kami sedang menyiapkan liputan terbaru untuk Anda.
                Silakan kembali lagi nanti.
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  const featured = latest[0];
  const popular = latest.slice(1, 6);
  const recent = latest.slice(0, 6);

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <article className={styles.heroMain}>
              <a href={`/artikel/${featured.id}`} className={styles.heroCard}>
                <div className={styles.heroImage}>
                  <img
                    src={featured.image || "/images/placeholder-article.svg"}
                    alt={featured.title}
                    width={1200}
                    height={630}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className={styles.heroOverlay}>
                  <span className={styles.badge}>{featured.category}</span>
                  <h1 className={styles.heroTitle}>{featured.title}</h1>
                  <p className={styles.heroExcerpt}>{featured.excerpt}</p>
                  <div className={styles.meta}>
                    <span>{featured.author}</span>
                    <span> | </span>
                    <span>{formatDate(featured.date)}</span>
                  </div>
                </div>
              </a>
            </article>
            <aside className={styles.heroSide}>
              <h3 className={styles.sideHeading}>Terpopuler</h3>
              {popular.map((a, i) => (
                <a key={a.id} href={`/artikel/${a.id}`} className={styles.sideItem}>
                  <span className={styles.sideNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className={styles.sideCat}>{a.category}</span>
                    <p className={styles.sideTitle}>{a.title}</p>
                  </span>
                </a>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Berita Terbaru</h2>
          <div className={styles.grid}>
            {recent.map((a) => (
              <a key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                <CardImage src={a.image} alt={a.title} className={styles.cardImage} />
                <div className={styles.cardBody}>
                  <div
                    className={styles.cardBadge}
                    style={{ background: categoryColors[a.category] || "#c8102e" }}
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
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
