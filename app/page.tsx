import Link from "next/link";
import Image from "next/image";
import {
  getArticles,
  formatDate,
  formatRelative,
  sortByDate,
  articleUrl,
  type Article,
} from "@/lib/data";
import { Footer } from "@/components/site";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function inCategories(a: Article, names: string[]): boolean {
  const c = String(a.category || "").trim().toLowerCase();
  return names.some((n) => n.toLowerCase() === c);
}

function isOpinion(a: Article): boolean {
  const tags = Array.isArray(a.tags) ? a.tags : [];
  return tags.some((t) =>
    /opini|analisis|kolom|tajuk|editorial/i.test(String(t || ""))
  );
}

function Meta({ a, light = false }: { a: Article; light?: boolean }) {
  return (
    <div className={light ? styles.metaLight : styles.meta}>
      <span className={styles.metaAuthor}>{a.author || "Redaksi GentaNusa"}</span>
      <span aria-hidden="true">•</span>
      <time dateTime={a.date}>{formatRelative(a.date, a.created_at)}</time>
    </div>
  );
}

function CategoryTag({ label }: { label: string }) {
  return <span className={styles.catTag}>{label}</span>;
}

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

  const [lead, ...rest] = latest;
  const secondary = rest.slice(0, 4);
  const popular = rest.slice(0, 5);
  const opinions = latest.filter(isOpinion).slice(0, 3);

  const blocks: Array<{ title: string; href: string; items: Article[] }> = [
    {
      title: "Pertahanan & Keamanan",
      href: "/kategori/pertahanan",
      items: latest.filter((a) => inCategories(a, ["Pertahanan", "Keamanan"])).slice(0, 4),
    },
    {
      title: "Sosial & Budaya",
      href: "/kategori/sosial-budaya",
      items: latest
        .filter((a) => inCategories(a, ["Sosial Budaya", "Kesehatan"]))
        .slice(0, 4),
    },
    {
      title: "Olahraga",
      href: "/kategori/olahraga",
      items: latest.filter((a) => inCategories(a, ["Olahraga"])).slice(0, 4),
    },
  ].filter((b) => b.items.length > 0);

  const seen = new Set<number>([
    lead.id,
    ...secondary.map((a) => a.id),
    ...popular.map((a) => a.id),
  ]);
  const recentArticles = latest.filter((a) => !seen.has(a.id)).slice(0, 8);

  return (
    <main className={styles.main}>
      {/* ===== HERO: lead 7 kolom + sekunder 5 kolom ===== */}
      <section className={styles.hero} aria-label="Sorotan utama">
        <div className={styles.container}>
          <div className={styles.splitGrid}>
            <article className={styles.headline}>
              <Link href={articleUrl(lead)} className={styles.headlineCard}>
                <div className={styles.headlineThumb}>
                  <Image
                    src={lead.image || "/images/placeholder-article.svg"}
                    alt={lead.title}
                    width={1200}
                    height={675}
                    priority
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <CategoryTag label={lead.category} />
                <h1 className={styles.headlineTitle}>{lead.title}</h1>
                <p className={styles.headlineLead}>{lead.excerpt}</p>
                <Meta a={lead} />
              </Link>
            </article>

            {secondary.length > 0 && (
              <aside className={styles.sideGrid} aria-label="Berita sekunder">
                <h2 className={styles.sideHeading}>Sorotan</h2>
                <ul className={styles.sideList}>
                  {secondary.map((a) => (
                    <li key={a.id} className={styles.sideRow}>
                      <Link href={articleUrl(a)} className={styles.sideLink}>
                        <span className={styles.sideText}>
                          <CategoryTag label={a.category} />
                          <span className={styles.sideTitle}>{a.title}</span>
                          <Meta a={a} />
                        </span>
                        <span className={styles.sideThumb}>
                          <Image
                            src={a.image || "/images/placeholder-article.svg"}
                            alt=""
                            width={320}
                            height={180}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* ===== TERPOPULER horizontal kompak + OPINI ===== */}
      {popular.length > 0 && (
        <section className={styles.section} aria-label="Terpopuler">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Terpopuler</h2>
            <ol className={styles.popGridFlat}>
              {popular.map((a, i) => (
                <li key={a.id} className={styles.popCell}>
                  <span className={styles.popNum} aria-hidden="true">
                    {i + 1}
                  </span>
                  <Link href={articleUrl(a)} className={styles.popLink}>
                    <span className={styles.popTitle}>{a.title}</span>
                    <Meta a={a} />
                  </Link>
                </li>
              ))}
            </ol>
            {opinions.length > 0 && (
              <div className={styles.opiniStrip}>
                <h2 className={styles.sectionTitle}>Opini &amp; Analisis</h2>
                <div className={styles.opiniStack}>
                  {opinions.map((a) => (
                    <Link key={a.id} href={articleUrl(a)} className={styles.opiniCard}>
                      <span className={styles.opiniBadge}>OPINI</span>
                      <span className={styles.opiniTitle}>{a.title}</span>
                      <Meta a={a} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== BLOK KATEGORI modular ===== */}
      {blocks.map((b) => (
        <section key={b.title} className={styles.section} aria-label={b.title}>
          <div className={styles.container}>
            <div className={styles.blockHead}>
              <h2 className={styles.sectionTitle}>{b.title}</h2>
              <Link href={b.href} className={styles.blockMore}>
                Lihat Semua
              </Link>
            </div>
            <div className={styles.grid}>
              {b.items.map((a) => (
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
                  <CategoryTag label={a.category} />
                  <h3 className={styles.compactTitle}>{a.title}</h3>
                  <Meta a={a} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ===== SISA ARSIP terbaru ===== */}
      {recentArticles.length > 0 && (
        <section className={styles.section} aria-label="Berita terbaru">
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
                  <div className={styles.compactCat}>
                    {a.category} • {formatDate(a.date)}
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
