import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Footer } from "@/components/site";
import { getAuthor, getAuthors, getArticlesByAuthor, formatDate } from "@/lib/data";
import styles from "./author.module.css";

type Params = { params: Promise<{ slug: string }> };

// Penulis tetap statis (daftar penulis fixed), artikel-nya auto-refresh
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getAuthors()).map((a) => ({ slug: a.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return { title: "Penulis tidak ditemukan" };
  const url = `${SITE_URL}/penulis/${slug}`;
  return {
    title: `${author.name} — Penulis`,
    description: author.bio,
    alternates: { canonical: url },
    openGraph: { url, title: `${author.name} — Penulis | GentaNusa`, description: author.bio },
  };
}

export default async function AuthorPage({ params }: Params) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();

  const articles = await getArticlesByAuthor(slug);

  return (
    <>
      <main className={styles.container}>
        <section className={styles.profile}>
          <div className={styles.avatar}>{author.name.charAt(0)}</div>
          <div>
            <h1 className={styles.name}>{author.name}</h1>
            <p className={styles.role}>{author.role}</p>
            <p className={styles.bio}>{author.bio}</p>
          </div>
        </section>

        <h2 className={styles.sectionTitle}>
          Artikel oleh {author.name} ({articles.length})
        </h2>

        {articles.length === 0 ? (
          <p className={styles.empty}>Belum ada artikel dari penulis ini.</p>
        ) : (
          <div className={styles.grid}>
            {articles.map((a) => (
              <a key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                {a.image && (
                  <div className={styles.cardImage}>
                    <Image
                      src={a.image}
                      alt={a.title}
                      width={1200}
                      height={630}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
                <div className={styles.cardBody}>
                  <div className={styles.cardBadge}>{a.category}</div>
                  <h3 className={styles.cardTitle}>{a.title}</h3>
                  <p className={styles.cardExcerpt}>{a.excerpt}</p>
                  <div className={styles.meta}>
                    <span>{a.author}</span>
                    <span>•</span>
                    <span>{formatDate(a.date)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}