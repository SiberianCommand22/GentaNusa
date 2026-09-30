import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Footer } from "@/components/site";
import { getArticlesByCategory, getCategories, getCategoryBySlug, formatDate, articleUrl } from "@/lib/data";
import styles from "./category.module.css";

type Params = { params: Promise<{ slug: string }> };

// ID kategori baru (dari admin) harus bisa diakses
export const dynamicParams = true;
// Auto-refresh: kategori & artikel baru muncul ≤60 detik tanpa deploy
export const revalidate = 60;

async function loadCategory(slug: string) {
  return getCategoryBySlug(slug);
}

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cat = await loadCategory(slug);
  if (!cat) return { title: "Kategori tidak ditemukan" };
  const url = `${SITE_URL}/kategori/${cat.slug}`;
  return {
    title: `${cat.name} — Berita`,
    description: `Kumpulan berita ${cat.name} terbaru dari GentaNusa.`,
    alternates: { canonical: url },
    openGraph: { url, title: `${cat.name} — Berita`, description: `Kumpulan berita ${cat.name} terbaru dari GentaNusa.` },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const cat = await loadCategory(slug);
  if (!cat) notFound();

  // Query DB per kategori (ilike) supaya baris baru langsung tampil tanpa
  // deploy, dan supaya pencocokan tidak bergantung kapitalisasi nama kategori.
  const list = await getArticlesByCategory(cat.slug);

  return (
    <>
      <main className={styles.container}>
        {/* ===== Banner Kategori ===== */}
        <div className={styles.banner}>
          <div className={styles.bannerInner}>
            <span className={styles.bannerLabel}>Kategori</span>
            <h1 className={styles.title}>{cat.name}</h1>
            <p className={styles.subtitle}>
              Kumpulan berita {cat.name.toLowerCase()} terbaru dari GentaNusa.
            </p>
          </div>
          <div className={styles.bannerAccent} />
        </div>

        {list.length === 0 ? (
          <p className={styles.empty}>Belum ada berita dalam kategori ini.</p>
        ) : (
          <div className={styles.grid}>
            {list.map((a) => (
              <a key={a.id} href={articleUrl(a)} className={styles.card}>
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
                  <div className={styles.cardBadge}>
                    {a.category}
                  </div>
                  <h2 className={styles.cardTitle}>{a.title}</h2>
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