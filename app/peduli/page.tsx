import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/site";
import styles from "@/app/kategori/[slug]/category.module.css";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export const metadata: Metadata = {
  title: { absolute: "GentaNusa Peduli — Dokumentasi Aksi Sosial Segera Hadir" },
  description:
    "Kanal dokumentasi aksi sosial, bakti masyarakat, dan kemanusiaan GentaNusa. Segera hadir.",
  alternates: { canonical: `${SITE_URL}/peduli` },
  openGraph: {
    url: `${SITE_URL}/peduli`,
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    title: "GentaNusa Peduli — Dokumentasi Aksi Sosial Segera Hadir",
    description:
      "Kanal dokumentasi aksi sosial, bakti masyarakat, dan kemanusiaan GentaNusa. Segera hadir.",
    images: [
      {
        url: `${SITE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "GentaNusa Peduli",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GentaNusa Peduli — Dokumentasi Aksi Sosial Segera Hadir",
    description:
      "Kanal dokumentasi aksi sosial, bakti masyarakat, dan kemanusiaan GentaNusa. Segera hadir.",
    images: [`${SITE_URL}/og-default.jpg`],
  },
};

export default function PeduliPage() {
  return (
    <>
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span aria-hidden="true"> {" > "} </span>
          <span aria-current="page">Peduli</span>
        </nav>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs uppercase tracking-widest text-blue-600 font-bold">Kanal Liputan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Peduli</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Dokumentasi kegiatan sosial, aksi kemanusiaan, dan bakti nusantara GentaNusa.</p>
        </div>

        <section className={styles.comingSoon} aria-labelledby="peduli-title">
          <span className={styles.soonBadge}>GENTANUSA PEDULI</span>
          <h2 id="peduli-title" className={styles.soonTitle}>
            Kanal Dokumentasi Aksi Sosial Segera Hadir
          </h2>
          <p className={styles.soonText}>
            Redaksi GentaNusa sedang mempersiapkan ruang khusus peliputan dan
            dokumentasi program kepedulian sosial, bakti masyarakat, dan aksi
            kemanusiaan di berbagai pelosok negeri.
          </p>

          <div className={styles.soonCard} role="img" aria-label="Ilustrasi kegiatan sosial dan kemanusiaan GentaNusa">
            <div className={styles.soonCardArt} aria-hidden="true">
              <svg
                viewBox="0 0 120 120"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="60" cy="42" r="16" />
                <path d="M28 104c0-17.7 14.3-32 32-32s32 14.3 32 32" />
                <path d="M22 30h12l4-8 4 8h12" />
                <path d="M98 52v-12M92 46h12" />
                <path d="M60 84c-4-3-9 1-9 5 0 5 9 11 9 11s9-6 9-11c0-4-5-8-9-5z" />
              </svg>
            </div>
            <div className={styles.soonCardBody}>
              <h3 className={styles.soonCardTitle}>Ruang Liputan Sosial & Kemanusiaan</h3>
              <p className={styles.soonCardText}>
                Liputan lapangan, bakti masyarakat, bantuan bencana, dan cerita
                inspiratif warga akan hadir di kanal ini.
              </p>
              <ul className={styles.soonList}>
                <li>Dokumentasi bakti dan bhakti sosial desa</li>
                <li>Aksi kemanusiaan dan bantuan bencana</li>
                <li>Program Posyandu & Pemberdayaan Desa</li>
              </ul>
            </div>
          </div>

          <span className={styles.soonStatus}>Segera hadir</span>

          <div className={styles.soonActions}>
            <Link href="/" className={styles.emptyButton}>
              Kembali ke Beranda
            </Link>
            <Link href="/kategori" className={styles.soonGhostButton}>
              Lihat Semua Kanal
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}