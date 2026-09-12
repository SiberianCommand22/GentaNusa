import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site";
import { getArticles, getCategories, getCategoryBySlug } from "@/lib/data";
import styles from "./category.module.css";

type Params = { params: Promise<{ slug: string }> };

async function loadCategory(slug: string) {
  return getCategoryBySlug(slug);
}

export async function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cat = await loadCategory(slug);
  if (!cat) return { title: "Kategori tidak ditemukan" };
  return {
    title: `${cat.name} — Berita`,
    description: `Kumpulan berita ${cat.name} terbaru dari GentaNusa.`,
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const cat = await loadCategory(slug);
  if (!cat) notFound();

  const list = getArticles().filter((a) => a.category === cat.name);

  return (
    <>
      <Header />
      <main className={styles.container}>
        <h1 className={styles.title}>
          <span style={{ color: cat.color }}>{cat.name}</span>
        </h1>
        <p className={styles.subtitle}>
          Kumpulan berita {cat.name.toLowerCase()} terbaru dari GentaNusa.
        </p>

        {list.length === 0 ? (
          <p className={styles.empty}>Belum ada berita dalam kategori ini.</p>
        ) : (
          <div className={styles.grid}>
            {list.map((a) => (
              <a key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                <div className={styles.cardBadge} style={{ background: cat.color }}>
                  {a.category}
                </div>
                <h2 className={styles.cardTitle}>{a.title}</h2>
                <p className={styles.cardExcerpt}>{a.excerpt}</p>
                <div className={styles.meta}>
                  <span>{a.author}</span>
                  <span>•</span>
                  <span>{a.date}</span>
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