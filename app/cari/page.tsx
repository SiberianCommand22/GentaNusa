import type { Metadata } from "next";
import Image from "next/image";
import { Header, Footer } from "@/components/site";
import { SearchForm } from "@/components/search-form";
import { getArticles, formatDate } from "@/lib/data";
import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Cari Berita",
  description: "Cari artikel GentaNusa berdasarkan kata kunci.",
};

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const results = query
    ? getArticles().filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.excerpt.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query))
      )
    : [];

  return (
    <>
      <Header />
      <main className={styles.container}>
        <h1 className={styles.title}>Cari Berita</h1>
        <SearchForm initial={q} />

        {q && (
          <p className={styles.count}>
            {results.length === 0
              ? `Tidak ada hasil untuk "${q}"`
              : `${results.length} ${results.length === 1 ? "hasil" : "hasil"} untuk "${q}"`}
          </p>
        )}

        {results.length > 0 && (
          <div className={styles.grid}>
            {results.map((a) => (
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
                  <h2 className={styles.cardTitle}>{highlight(a.title, q)}</h2>
                  <p className={styles.cardExcerpt}>{highlight(a.excerpt, q)}</p>
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