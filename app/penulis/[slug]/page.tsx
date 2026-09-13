import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Header, Footer } from "@/components/site";
import { getAuthor, getAuthors, getArticlesByAuthor, formatDate } from "@/lib/data";
import styles from "./author.module.css";

type Params = { params: Promise<{ slug: string }> };

// URL penulis tak dikenal = 404 beneran
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) return { title: "Penulis tidak ditemukan" };
  return {
    title: `${author.name} — Penulis`,
    description: author.bio,
  };
}

export default async function AuthorPage({ params }: Params) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) notFound();

  const articles = await getArticlesByAuthor(slug);

  return (
    <>
      <Header />
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