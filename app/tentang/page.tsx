import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";
import styles from "./about.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "GentaNusa adalah portal berita nasional yang menyajikan informasi politik, ekonomi, dan nasional secara akurat dan terpercaya.",
  alternates: { canonical: `${SITE_URL}/tentang` },
  openGraph: {
    url: `${SITE_URL}/tentang`,
    title: "Tentang Kami | GentaNusa",
    description:
      "GentaNusa adalah portal berita nasional yang menyajikan informasi politik, ekonomi, dan nasional secara akurat dan terpercaya.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.container}>
        <h1 className={styles.title}>Tentang GentaNusa</h1>
        <p className={styles.lead}>
          <strong>GentaNusa</strong> — &quot;Lonceng Nusantara&quot; — hadir sebagai
          penanda kabar penting bagi bangsa. Lonceng membunyikan peringatan,
          panggilan, dan tanda. Seperti itulah GentaNusa: menyuarakan kabar
          yang perlu diketahui seluruh negeri.
        </p>

        <section className={styles.section}>
          <h2>Visi</h2>
          <p>
            Menjadi portal berita nasional terpercaya yang menyajikan informasi
            politik, ekonomi, dan nasional secara akurat, cepat, dan mudah
            dipahami rakyat Indonesia.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Misi</h2>
          <ul className={styles.list}>
            <li>Menyajikan berita yang terverifikasi sebelum tayang.</li>
            <li>Menggunakan bahasa yang jelas dan mudah dipahami.</li>
            <li>Menjaga independensi dan integritas jurnalistik.</li>
            <li>Terbuka terhadap koreksi dan masukan pembaca.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Prinsip</h2>
          <ul className={styles.list}>
            <li>
              <strong>Verifikasi dulu, baru tayang.</strong> Setiap berita
              diperiksa faktanya sebelum dipublikasikan.
            </li>
            <li>
              <strong>Bahasa rakyat.</strong> Berita ditulis sederhana, tanpa
              jargon berat.
            </li>
            <li>
              <strong>Transparan.</strong> Koreksi dicantumkan secara terbuka.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Kontak Redaksi</h2>
          <p>
            Email: <a href="mailto:redaksi@gentanusa.id">redaksi@gentanusa.id</a>
            <br />
            Jakarta, Indonesia
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}