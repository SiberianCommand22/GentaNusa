import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";
import styles from "@/app/tentang/about.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export const metadata: Metadata = {
  title: { absolute: "Tentang Kami & Struktur Redaksi GentaNusa" },
  description:
    "GentaNusa adalah portal berita nasional independen yang menyajikan informasi akurat, berimbang, dan berdaulat. Kenali visi, misi, dan struktur manajemen redaksi kami.",
  alternates: { canonical: `${SITE_URL}/tentang-kami` },
  openGraph: {
    url: `${SITE_URL}/tentang-kami`,
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    title: "Tentang Kami & Struktur Redaksi GentaNusa",
    description:
      "Portal berita nasional independen menyajikan informasi akurat, berimbang, dan berdaulat.",
    images: [
      {
        url: `${SITE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "Tentang Kami GentaNusa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tentang Kami & Struktur Redaksi GentaNusa",
    description:
      "Portal berita nasional independen menyajikan informasi akurat, berimbang, dan berdaulat.",
    images: [`${SITE_URL}/og-default.jpg`],
  },
};

export default function TentangKamiPage() {
  return (
    <>
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span aria-hidden="true"> {" > "} </span>
          <span aria-current="page">Tentang Kami</span>
        </nav>

        <header className={styles.header}>
          <h1 className={styles.title}>Tentang Kami & Struktur Redaksi</h1>
          <p className={styles.lead}>
            <strong>GentaNusa</strong> — <em>"Lonceng Nusantara"</em> — hadir sebagai
            penanda kabar penting bagi bangsa. Lonceng membunyikan peringatan,
            panggilan, dan tanda. Seperti itulah GentaNusa: menyuarakan kabar
            yang perlu diketahui seluruh negeri.
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Visi</h2>
          <p className={styles.sectionText}>
            Menjadi portal berita nasional terpercaya yang menyajikan informasi
            politik, ekonomi, pertahanan, dan kemanusiaan secara akurat, cepat,
            dan mudah dipahami rakyat Indonesia.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Misi</h2>
          <ul className={styles.list}>
            <li>Menyajikan berita yang terverifikasi sebelum tayang.</li>
            <li>Menggunakan bahasa yang jelas, ringkas, dan mudah dipahami.</li>
            <li>Menjaga independensi dan integritas jurnalistik tanpa kompromi.</li>
            <li>Terbuka terhadap koreksi, klarifikasi, dan masukan pembaca.</li>
            <li>Mendokumentasikan aksi sosial, bakti, dan kemanusiaan di Nusantara.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Komitmen Jurnalistik</h2>
          <ul className={styles.list}>
            <li>
              <strong>Verifikasi dulu, baru tayang.</strong> Setiap berita
              diperiksa faktanya melalui multi-sumber sebelum dipublikasikan.
            </li>
            <li>
              <strong>Bahasa rakyat.</strong> Berita ditulis sederhana, tanpa
              jargon berat, agar seluruh lapisan masyarakat memahami.
            </li>
            <li>
              <strong>Transparan & Berimbang.</strong> Koreksi dicantumkan secara
              terbuka; hak jawab dipenuhi sesuai UU Pers No. 40 Tahun 1999.
            </li>
            <li>
              <strong>Peduli Nusantara.</strong> Kanal <strong>Peduli</strong>
              mendokumentasikan aksi sosial, bakti masyarakat, dan kemanusiaan.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Struktur Manajemen Redaksi</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Pemimpin Umum / Penanggung Jawab</h3>
              <p className={styles.cardText}>
                Bertanggung jawab penuh atas seluruh penerbitan, kebijakan
                editorial, dan kepatuhan hukum pers.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Pemimpin Redaksi & Redaktur Pelaksana</h3>
              <p className={styles.cardText}>
                Mengelola operasional harian redaksi, penetapan agenda berita,
                dan koordinasi desk.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Dewan Redaksi & Tim Siber</h3>
              <p className={styles.cardText}>
                Menentukan kebijakan editorial, standar etika, dan pengembangan
                platform digital.
              </p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Redaktur Desk</h3>
              <ul className={styles.deskList}>
                <li>Desk Nasional</li>
                <li>Desk Pertahanan</li>
                <li>Desk Politik</li>
                <li>Desk Ekonomi</li>
                <li>Desk Dunia</li>
                <li>Desk Peduli (Kemanusiaan & Sosial)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Alamat & Kontak Redaksi</h2>
          <address className={styles.address}>
            <p>GentaNusa — Jakarta, Indonesia</p>
            <p>
              Surel Resmi: <a href="mailto:redaksi@gentanusa.id">redaksi@gentanusa.id</a>
            </p>
            <p>
              Aduan Jurnalistik & Hak Jawab: <a href="mailto:aduan@gentanusa.id">aduan@gentanusa.id</a>
            </p>
            <p>
              Kemitraan & Iklan: <a href="mailto:bisnis@gentanusa.id">bisnis@gentanusa.id</a>
            </p>
          </address>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Landasan Hukum</h2>
          <ul className={styles.list}>
            <li>UU No. 40 Tahun 1999 tentang Pers</li>
            <li>Kode Etik Jurnalistik (Dewan Pers)</li>
            <li>Pedoman Pemberitaan Media Siber (Dewan Pers)</li>
            <li>UU Perlindungan Data Pribadi (UU PDP)</li>
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}