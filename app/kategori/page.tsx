import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";
import styles from "./[slug]/category.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Berita Terkini | GentaNusa" },
  description:
    "Jelajahi kanal berita GentaNusa: Nasional, Pertahanan, Politik, Ekonomi, dan Dunia.",
  alternates: { canonical: "https://www.gentanusa.id/kategori" },
  openGraph: {
    url: "https://www.gentanusa.id/kategori",
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    title: "Berita Terkini | GentaNusa",
    description:
      "Jelajahi kanal berita GentaNusa: Nasional, Pertahanan, Politik, Ekonomi, dan Dunia.",
    images: [
      {
        url: "https://www.gentanusa.id/og-default.jpg",
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
      "Jelajahi kanal berita GentaNusa: Nasional, Pertahanan, Politik, Ekonomi, dan Dunia.",
    images: ["https://www.gentanusa.id/og-default.jpg"],
  },
};

const CHANNELS: { slug: string; label: string; desc: string }[] = [
  {
    slug: "nasional",
    label: "Nasional",
    desc: "Kabar dan peristiwa terkini seputar kebijakan nasional dan dinamika tanah air.",
  },
  {
    slug: "pertahanan",
    label: "Pertahanan",
    desc: "Sorotan strategis militer, alutsista, dan kedaulatan wilayah Indonesia.",
  },
  {
    slug: "politik",
    label: "Politik",
    desc: "Dinamika parlemen, kebijakan publik, dan lanskap demokrasi nasional.",
  },
  {
    slug: "ekonomi",
    label: "Ekonomi",
    desc: "Perkembangan pasar modal, perbankan, dan kebijakan makroekonomi.",
  },
  {
    slug: "dunia",
    label: "Dunia",
    desc: "Kabar internasional, geopolitik kawasan, dan hubungan diplomatik global.",
  },
];

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
          {CHANNELS.map((c) => (
            <Link key={c.slug} href={`/kategori/${c.slug}`} className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.cardBadge}>{c.label}</div>
                <h2 className={styles.cardTitle}>{c.label}</h2>
                <p className={styles.cardExcerpt}>{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
