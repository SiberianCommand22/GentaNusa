import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";
import { canonicalCategoryHref } from "@/lib/site";
import { CATEGORIES } from "@/lib/categories";
import styles from "./[slug]/category.module.css";

// Halaman indeks kanal 100% statis (tanpa query DB) — cache CDN 24 jam.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Berita Terkini | GentaNusa" },
  description:
    "Jelajahi kanal berita GentaNusa: Nasional, Politik, Dunia, Pertahanan, Keamanan, Sosial Budaya, Kesehatan, Olahraga, Ekonomi, dan Peduli.",
  alternates: { canonical: "https://gentanusa.id/kategori" },
  openGraph: {
    url: "https://gentanusa.id/kategori",
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    title: "Berita Terkini | GentaNusa",
    description:
      "Jelajahi kanal berita GentaNusa: Nasional, Politik, Dunia, Pertahanan, Keamanan, Sosial Budaya, Kesehatan, Olahraga, Ekonomi, dan Peduli.",
    images: [
      {
        url: "https://gentanusa.id/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Kanal Berita GentaNusa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Berita Terkini | GentaNusa",
    description:
      "Jelajahi kanal berita GentaNusa: Nasional, Politik, Dunia, Pertahanan, Keamanan, Sosial Budaya, Kesehatan, Olahraga, Ekonomi, dan Peduli.",
    images: ["https://gentanusa.id/og-default.jpg"],
  },
};

export default function CategoryIndexPage() {
  return (
    <>
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span aria-hidden="true"> &gt; </span>
          <span aria-current="page">Kategori</span>
        </nav>

        <div className={styles.banner}>
          <div className={styles.bannerInner}>
            <span className={styles.bannerLabel}>Kanal</span>
            <h1 className={styles.title}>Kanal Berita</h1>
            <p className={styles.subtitle}>
              Jelajahi liputan GentaNusa berdasarkan kanal editorial.
            </p>
          </div>
          <div className={styles.bannerAccent} />
        </div>

        <div className={styles.grid}>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={canonicalCategoryHref(c.slug)} className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.cardBadge}>{c.label}</div>
                <h2 className={styles.cardTitle}>{c.label}</h2>
                <p className={styles.cardExcerpt}>{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
