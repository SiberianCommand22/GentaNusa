import type { Metadata } from "next";
import { Footer } from "@/components/site";
import styles from "../syarat/legal.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan penggunaan situs GentaNusa.",
  alternates: { canonical: `${SITE_URL}/syarat-ketentuan` },
};

export default function SyaratKetentuanPage() {
  return (
    <>
      <main className={styles.container}>
        <h1 className={styles.title}>Syarat &amp; Ketentuan</h1>
        <p className={styles.updated}>Terakhir diperbarui: September 2026</p>

        <section className={styles.section}>
          <h2>1. Penerimaan Ketentuan</h2>
          <p>
            Dengan mengakses situs GentaNusa, Anda menyetujui syarat dan
            ketentuan ini. Jika tidak setuju, mohon tidak menggunakan situs ini.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Konten</h2>
          <p>
            Seluruh konten — termasuk berita, gambar, dan desain — dilindungi
            hak cipta GentaNusa. Pengutipan diperbolehkan dengan menyebutkan
            sumber dan tautan ke artikel asli.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Ketepatan Informasi</h2>
          <p>
            Kami berupaya menyajikan informasi akurat dan terverifikasi. Namun,
            kami tidak menjamin keakuratan, kelengkapan, atau ketepatan waktu
            seluruh konten. Kesalahan akan dikoreksi segera setelah diketahui.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Penggunaan Wajar</h2>
          <p>
            Dilarang menggunakan situs ini untuk: menyebarkan konten ilegal,
            melakukan scraping massal tanpa izin, atau mengganggu operasional
            situs.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Batasan Tanggung Jawab</h2>
          <p>
            GentaNusa tidak bertanggung jawab atas kerugian yang timbul dari
            penggunaan informasi di situs ini. Keputusan berdasarkan konten
            menjadi tanggung jawab pembaca.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Kontak</h2>
          <p>
            Pertanyaan terkait ketentuan ini dapat diajukan ke
            redaksi@gentanusa.id.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
