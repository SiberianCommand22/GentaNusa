import { NextResponse } from "next/server";
import { getArticles, getCategories, formatDate, sortByDate } from "@/lib/data";
import { Header, Footer } from "@/components/site";
import { NewsletterBox } from "@/components/newsletter";
import { CardImage } from "@/components/card-image";
import { AdSlot } from "@/components/ad-slot";
import styles from "./page.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export const metadata = {
  title: "Portal Berita Politik, Ekonomi & Nasional Terkini",
  description: "Baca berita terbaru hari ini seputar politik, ekonomi, hukum, dan peristiwa nasional Indonesia secara akurat dan mendalam di GentaNusa.",
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    url: `${SITE_URL}/`,
  },
};
export const revalidate = 60;

export default async function Home() {
  const latest = sortByDate(await getArticles());
  const categories = await getCategories();
  const featured = latest[0];

  return (
    <main>
      <Header />
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
                  <span className={styles.badge} style={{ background: "#1a5c8a" }}>
                    {featured.category}
                  </span>
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
              {latest.slice(1, 5).map((a, i) => (
                <a key={a.id} href={`/artikel/${a.id}`} className={styles.sideItem}>
                  <span className={styles.sideNum}>{i + 1}</span>
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
          <h2 className={styles.sectionTitle}>Terbaru</h2>
          <div className={styles.grid}>
            {latest.slice(0, 6).map((a) => (
              <a
                key={a.id}
                href={`/artikel/${a.id}`}
                className={a.id === featured.id ? `${styles.card} ${styles.cardFeatured}` : styles.card}
              >
                <CardImage src={a.image} alt={a.title} className={styles.cardImage} />
                <div className={styles.cardBody}>
                  <div className={styles.cardBadge}>{a.category}</div>
                  <h3 className={styles.cardTitle}>{a.title}</h3>
                  <p className={styles.cardExcerpt}>{a.excerpt}</p>
                  <span className={styles.readMore}>Baca selengkapnya -&gt;</span>
                  <div className={styles.meta}>
                    <span>{a.author}</span>
                    <span> | </span>
                    <span>{formatDate(a.date)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
            {/* Google AdSense — In-feed */}
            <AdSlot slot="0987654321" style={{ margin: "2rem auto", maxWidth: "1200px", minHeight: "100px", background: "#f8f9fa", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }} />
            <section className={styles.section}>
              <div className={styles.container}>
                <NewsletterBox />
              </div>
            </section>
      {categories.map((cat) => (
        <section key={cat.slug} className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>{cat.name}</h2>
            <div className={styles.grid}>
              {latest.filter((a) => a.category === cat.name).map((a) => (
                <a key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                  <CardImage src={a.image} alt={a.title} className={styles.cardImage} />
                  <div className={styles.cardBody}>
                    <div className={styles.cardBadge}>{a.category}</div>
                    <h3 className={styles.cardTitle}>{a.title}</h3>
                    <p className={styles.cardExcerpt}>{a.excerpt}</p>
                    <span className={styles.readMore}>Baca selengkapnya -&gt;</span>
                    <div className={styles.meta}>
                      <span>{a.author}</span>
                      <span> | </span>
                      <span>{formatDate(a.date)}</span>
                    </div>
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