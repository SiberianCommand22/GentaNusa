import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";
import styles from "../privasi/legal.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export const metadata: Metadata = {
  title: { absolute: "Kebijakan Privasi | GentaNusa" },
  description:
    "Kebijakan privasi GentaNusa standar UU PDP: informasi yang dikumpulkan, tujuan penggunaan, keamanan data, hak subjek data, dan mekanisme pengaduan.",
  alternates: { canonical: `${SITE_URL}/kebijakan-privasi` },
  openGraph: {
    url: `${SITE_URL}/kebijakan-privasi`,
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    title: "Kebijakan Privasi | GentaNusa",
    description:
      "Kebijakan privasi GentaNusa standar UU Perlindungan Data Pribadi (UU PDP).",
    images: [
      {
        url: `${SITE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "Kebijakan Privasi GentaNusa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kebijakan Privasi | GentaNusa",
    description:
      "Kebijakan privasi GentaNusa standar UU Perlindungan Data Pribadi (UU PDP).",
    images: [`${SITE_URL}/og-default.jpg`],
  },
};

export default function KebijakanPrivasiPage() {
  return (
    <>
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span aria-hidden="true"> {" > "} </span>
          <span aria-current="page">Kebijakan Privasi</span>
        </nav>

        <header className={styles.header}>
          <h1 className={styles.title}>Kebijakan Privasi</h1>
          <p className={styles.updated}>Terakhir diperbarui: Oktober 2026</p>
          <p className={styles.lead}>
            GentaNusa menghargai privasi Anda. Kebijakan ini menjelaskan data apa
            yang kami kumpulkan, bagaimana kami menggunakannya, dan hak apa yang
            Anda miliki atas data tersebut — sesuai <strong>UU No. 27 Tahun 2022
            tentang Perlindungan Data Pribadi (UU PDP)</strong>.
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Pengendali Data</h2>
          <p className={styles.sectionText}>
            <strong>GentaNusa</strong> (Portal Berita Nasional), Jakarta, Indonesia.<br />
            Surel: <a href="mailto:privasi@gentanusa.id">privasi@gentanusa.id</a> |
            Telepon: +62-21-XXXX-XXXX
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Informasi yang Kami Kumpulkan</h2>
          <h3 className={styles.subSectionTitle}>2.1 Data yang Anda Berikan Secara Sukarela</h3>
          <ul className={styles.list}>
            <li><strong>Formulir Kontak:</strong> Nama lengkap, alamat surel, subjek, dan isi pesan.</li>
            <li><strong>Buletin/Surel Langsung:</strong> Alamat surel (dengan persetujuan eksplisit via double opt-in).</li>
            <li><strong>Aduan Jurnalistik/Hak Jawab:</strong> Identitas pengaju, dokumen pendukung, dan korespondensi.</li>
          </ul>
          <h3 className={styles.subSectionTitle}>2.2 Data Otomatis (Akses & Performa)</h3>
          <ul className={styles.list}>
            <li>Alamat IP (dianonimkan: 3 oktet terakhir di-hash), tipe peramban, sistem operasi, perangkat.</li>
            <li>Halaman yang dikunjungi, durasi kunjungan, tautan rujukan (referrer), waktu akses.</li>
            <li>Data analitik agregat (Google Analytics 4 / Plausible) — <strong>tanpa identitas pribadi</strong>.</li>
          </ul>
          <h3 className={styles.subSectionTitle}>2.3 Cookie & Teknologi Serupa</h3>
          <ul className={styles.list}>
            <li><strong>Cookie Fungsional:</strong> Preferensi bahasa, mode gelap/terang, status cookie banner.</li>
            <li><strong>Cookie Analitik:</strong> Pengukuran trafik anonim (dapat ditolak via banner cookie).</li>
            <li>Kami <strong>tidak</strong> menggunakan cookie pencarian silang (cross-site tracking) atau fingerprinting invasif.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Tujuan Penggunaan Data</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Kategori Data</th>
                <th>Tujuan</th>
                <th>Dasar Hukum (UU PDP)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Formulir Kontak / Aduan</td>
                <td>Merespons pertanyaan, memproses aduan jurnalistik, hak jawab</td>
                <td>Pasal 20 ayat (1) huruf b (Kontrak) & Pasal 20 ayat (1) huruf e (Kepentingan Hukum)</td>
              </tr>
              <tr>
                <td>Buletin/Surel Langsung</td>
                <td>Mengirim kurasi berita terpilih</td>
                <td>Pasal 20 ayat (1) huruf a (Persetujuan)</td>
              </tr>
              <tr>
                <td>Data Akses Anonim</td>
                <td>Optimasi performa situs, keamanan (DDoS protection), analitik agregat</td>
                <td>Pasal 20 ayat (1) huruf f (Kepentingan Sah Pengendali)</td>
              </tr>
              <tr>
                <td>Cookie Fungsional</td>
                <td>Menyimpan preferensi pengguna (bahasa, tema, consent)</td>
                <td>Pasal 20 ayat (1) huruf f (Kepentingan Sah Pengendali)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Penyimpanan & Retensi Data</h2>
          <ul className={styles.list}>
            <li><strong>Data Kontak/Aduan:</strong> Disimpan selama <strong>24 bulan</strong> setelah kasus selesai, lalu dihapus aman.</li>
            <li><strong>Data Buletin:</strong> Disimpan selama langganan aktif + <strong>30 hari</strong> setelah berhenti berlangganan.</li>
            <li><strong>Log Akses Anonim (IP ter-hash):</strong> <strong>90 hari</strong> untuk keamanan & analitik, lalu dihapus.</li>
            <li><strong>Cookie Fungsional:</strong> Maksimal <strong>12 bulan</strong> atau hingga dibersihkan pengguna.</li>
          </ul>
          <p className={styles.sectionText}>
            Data tidak disimpan lebih lama dari yang diperlukan untuk tujuan pengumpulan, kecuali diwajibkan undang-undang.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Keamanan Data</h2>
          <ul className={styles.list}>
            <li>Enkripsi TLS 1.3 untuk semua transmisi data (HTTPS wajib, HSTS, certificate pinning).</li>
            <li>Pembatasan akses internal: hanya personel berwenang (DPO, tim teknis) yang mengakses data pribadi.</li>
            <li>Penerapan <strong>Privacy by Design</strong>: minimisasi data, anonimisasi IP, pembatasan tujuan.</li>
            <li>Audit keamanan berkala & penetration testing tahunan oleh pihak ketiga independen.</li>
            <li>Rencana respons insiden kebocoran data (Data Breach Response Plan) siap aktif dalam 72 jam.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Pihak Ketiga & Transfer Data</h2>
          <p className={styles.sectionText}>
            GentaNusa <strong>TIDAK PERNAH</strong> menjual, menyewakan, atau memperdagangkan data pribadi pengguna kepada pihak ketiga mana pun.
          </p>
          <p className={styles.sectionText}>
            Data hanya dibagikan kepada pemroses data (data processor) terpercaya untuk keperluan operasional:
          </p>
          <ul className={styles.list}>
            <li><strong>Penyedia Hosting/CDN (Vercel, Supabase):</strong> Infrastruktur situs & database — DPA (Data Processing Agreement) ditandatangani.</li>
            <li><strong>Analitik (Google Analytics 4 / Plausible):</strong> Data anonim, IP anonimisasi aktif, tidak dibagikan untuk iklan.</li>
            <li><strong>Email Transaksional (Resend / SendGrid):</strong> Hanya untuk pengiriman buletin/otomatisasi kontak — tidak untuk pemasaran.</li>
          </ul>
          <p className={styles.sectionText}>
            Tidak ada transfer data lintas batas (cross-border) ke negara tanpa keputusan keadekauan Kominfo, kecuali dengan SCC (Standard Contractual Clauses) yang sah.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Hak Subjek Data (Hak Anda)</h2>
          <p className={styles.sectionText}>
            Sebagai subjek data, Anda berhak (Pasal 5-14 UU PDP):
          </p>
          <ol className={styles.orderedList}>
            <li><strong>Hak Akses:</strong> Meminta salinan data pribadi yang kami proses.</li>
            <li><strong>Hak Koreksi:</strong> Meminta perbaikan data yang tidak akurat/lengkap.</li>
            <li><strong>Hak Penghapusan (Right to be Forgotten):</strong> Meminta penghapusan data jika tidak lagi diperlukan, persetujuan ditarik, atau pemrosesan melanggar hukum.</li>
            <li><strong>Hak Pembatasan Pemrosesan:</strong> Membatasi penggunaan data dalam kondisi tertentu (mis. saat pengaduan diverifikasi).</li>
            <li><strong>Hak Keberatan:</strong> Menolak pemrosesan untuk pemasaran langsung/profiling.</li>
            <li><strong>Hak Portabilitas Data:</strong> Menerima data dalam format terstruktur, umum, dan mesin-baca.</li>
            <li><strong>Hak Tarik Persetujuan:</strong> Menarik persetujuan kapan saja (tidak mempengaruhi legalitas pemrosesan sebelum penarikan).</li>
          </ol>
          <div className={styles.notice}>
            <strong>Cara Mengajukan Hak:</strong> Kirim surel ke <a href="mailto:privasi@gentanusa.id">privasi@gentanusa.id</a> dengan subjek "HAK SUBJEK DATA — [Nama Lengkap]". Kami akan merespons dalam <strong>14 hari kerja</strong> sesuai Pasal 14 UU PDP.
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Cookie & Teknologi Pelacakan</h2>
          <p className={styles.sectionText}>
            Situs ini menggunakan cookie kategori:
          </p>
          <ul className={styles.list}>
            <li><strong>Wajib (Strictly Necessary):</strong> Sesı, keamanan, preferensi consent — <em>tidak bisa dinonaktifkan</em>.</li>
            <li><strong>Fungsional:</strong> Preferensi bahasa, tema — <em>opsional</em>.</li>
            <li><strong>Analitik:</strong> Pengukuran trafik anonim — <em>opsional, butuh consent</em>.</li>
          </ul>
          <p className={styles.sectionText}>
            Anda dapat mengelola preferensi cookie kapan saja via tombol <strong>"Preferensi Cookie"</strong> di footer atau mengatur peramban untuk menolak/menghapus cookie.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Privasi Anak</h2>
          <p className={styles.sectionText}>
            GentaNusa tidak sengaja mengumpulkan data pribadi dari anak di bawah 13 tahun (atau usia minimum consent per jurisdiksi). Jika orang tua/wali menyadari anak memberikan data tanpa izin, hubungi kami untuk penghapusan segera.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Perubahan Kebijakan</h2>
          <p className={styles.sectionText}>
            Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan substantif (mis. perubahan dasar hukum, penerima data baru, atau hak pengguna) akan diumumkan melalui:
          </p>
          <ul className={styles.list}>
            <li>Notifikasi banner di situs (minimal 14 hari sebelum berlaku).</li>
            <li>Surel ke pelanggan buletin (jika relevan).</li>
            <li>Log perubahan di halaman ini dengan versi & tanggal efektif.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Hubungi Kami</h2>
          <p className={styles.sectionText}>
            Pertanyaan, keluhan, atau pengajuan hak subjek data:
          </p>
          <address className={styles.address}>
            <p>Email: <a href="mailto:privasi@gentanusa.id">privasi@gentanusa.id</a></p>
            <p>Subjek: <strong>PRIVASI / HAK SUBJEK DATA</strong></p>
            <p>GentaNusa — Jakarta, Indonesia</p>
          </address>
        </section>
      </main>
      <Footer />
    </>
  );
}