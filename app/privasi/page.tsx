import type { Metadata } from "next";
import { Footer } from "@/components/site";
import styles from "./legal.module.css";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi GentaNusa — bagaimana kami mengelola data Anda.",
};

export default function PrivacyPage() {
  return (
    <>
      <main className={styles.container}>
        <h1 className={styles.title}>Kebijakan Privasi</h1>
        <p className={styles.updated}>Terakhir diperbarui: September 2026</p>

        <section className={styles.section}>
          <h2>1. Informasi yang Kami Kumpulkan</h2>
          <p>
            GentaNusa mengumpulkan data minimal yang diperlukan untuk
            memberikan layanan: data penggunaan anonim (halaman yang dikunjungi,
            waktu akses), dan — jika Anda berlangganan buletin — alamat email.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Penggunaan Data</h2>
          <p>
            Data digunakan untuk: (a) menyajikan dan memperbaiki konten, (b)
            mengirim buletin yang Anda pilih, (c) menganalisis trafik secara
            agregat. Kami tidak menjual data pribadi kepada pihak ketiga.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Cookie & Analitik</h2>
          <p>
            Situs ini dapat menggunakan cookie fungsional dan alat analitik
            anonim untuk memahami pola kunjungan. Anda dapat menonaktifkan
            cookie melalui pengaturan browser.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Keamanan</h2>
          <p>
            Kami menerapkan langkah wajar untuk melindungi data dari akses
            tidak sah, perubahan, atau penghapusan.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Hak Anda</h2>
          <p>
            Anda berhak meminta akses, koreksi, atau penghapusan data pribadi
            yang kami simpan. Hubungi redaksi@gentanusa.id untuk permintaan
            tersebut.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Perubahan Kebijakan</h2>
          <p>
            Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan
            akan diumumkan di halaman ini.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}