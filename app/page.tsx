import type { Metadata } from "next";
import styles from "./page.module.css";
import { Header, Footer } from "@/components/site";
import { getArticles, getCategories, formatDate, sortByDate } from "@/lib/data";

export const metadata: Metadata = {
  title: "Beranda",
};

export default function Home() {
  const latest = sortByDate(getArticles());
  const categories = getCategories();
  const featured = latest[0];

  return (
    <main>
      <Header />

      {/* ===== Hero / Headline ===== */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <article className={styles.heroMain}>
              <span className={styles.badge} style={{ background: "#1a5c8a" }}>
                {featured.category}
              </span>
              <h1 className={styles.heroTitle}>{featured.title}</h1>
              <p className={styles.heroExcerpt}>{featured.excerpt}</p>
              <div className={styles.meta}>
                <span>{featured.author}</span>
                <span>•</span>
                <span>{featured.date}</span>
              </div>
            </article>
            <aside className={styles.heroSide}>
              <h3 className={styles.sideHeading}>Terpopuler</h3>
              {latest.slice(1, 5).map((a) => (
                <a key={a.id} href={`/artikel/${a.id}`} className={styles.sideItem}>
                  <span className={styles.sideCat}>{a.category}</span>
                  <p className={styles.sideTitle}>{a.title}</p>
                </a>
              ))}
            </aside>
          </div>
        </div>
      </section>

      {/* ===== Berita Terbaru ===== */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Terbaru</h2>
          <div className={styles.grid}>
            {latest.map((a) => (
              <a key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                <div className={styles.cardBadge}>{a.category}</div>
                <h3 className={styles.cardTitle}>{a.title}</h3>
                <p className={styles.cardExcerpt}>{a.excerpt}</p>
                <div className={styles.meta}>
                  <span>{a.author}</span>
                  <span>•</span>
                  <span>{formatDate(a.date)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Per Kategori ===== */}
      {categories.map((cat) => (
        <section key={cat.slug} className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              <span style={{ color: cat.color }}>{cat.name}</span>
            </h2>
            <div className={styles.grid}>
              {latest.filter((a) => a.category === cat.name).map((a) => (
                <a key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                  <div className={styles.cardBadge} style={{ background: cat.color }}>
                    {a.category}
                  </div>
                  <h3 className={styles.cardTitle}>{a.title}</h3>
                  <p className={styles.cardExcerpt}>{a.excerpt}</p>
                  <div className={styles.meta}>
                    <span>{a.author}</span>
                    <span>•</span>
                    <span>{formatDate(a.date)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ))}

      <Footer />
    </main>
  );
}