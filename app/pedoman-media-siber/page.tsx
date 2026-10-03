import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";
import styles from "@/app/tentang/about.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export const metadata: Metadata = {
  title: { absolute: "Pedoman Pemberitaan Media Siber | GentaNusa" },
  description:
    "Pedoman pemberitaan media siber GentaNusa berdasarkan standar Dewan Pers: verifikasi, keberimbangan, UGC, ralat, hak jawab, dan pencabutan berita.",
  alternates: { canonical: `${SITE_URL}/pedoman-media-siber` },
  openGraph: {
    url: `${SITE_URL}/pedoman-media-siber`,
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    title: "Pedoman Pemberitaan Media Siber | GentaNusa",
    description:
      "Pedoman pemberitaan media siber GentaNusa berdasarkan standar Dewan Pers.",
    images: [
      {
        url: `${SITE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "Pedoman Media Siber GentaNusa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pedoman Pemberitaan Media Siber | GentaNusa",
    description:
      "Pedoman pemberitaan media siber GentaNusa berdasarkan standar Dewan Pers.",
    images: [`${SITE_URL}/og-default.jpg`],
  },
};

export default function PedomanMediaSiberPage() {
  return (
    <>
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span aria-hidden="true"> {" > "} </span>
          <span aria-current="page">Pedoman Media Siber</span>
        </nav>

        <header className={styles.header}>
          <h1 className={styles.title}>Pedoman Pemberitaan Media Siber</h1>
          <p className={styles.lead}>
            Pedoman ini mengacu pada <strong>UU Pers No. 40 Tahun 1999</strong>,
            <strong>Kode Etik Jurnalistik</strong>, dan
            <strong>Pedoman Pemberitaan Media Siber Dewan Pers</strong> sebagai
            landasan operasional redaksi GentaNusa dalam menyelenggarakan
            pemberitaan berbasis platform digital.
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pasal 1 — Ruang Lingkup</h2>
          <ul className={styles.list}>
            <li>
              <strong>Media Siber</strong> adalah media yang menyelenggarakan
              pemberitaan melalui platform digital (website, aplikasi, media
              sosial, dan saluran digital lainnya).
            </li>
            <li>
              <strong>Karya Jurnalistik</strong> adalah karya berupa artikel,
              video, audio, infografis, atau bentuk konten jurnalistik lainnya
              yang diproduksi atau dikurasi redaksi.
            </li>
            <li>
              <strong>Pembaca/Pengguna</strong> adalah pihak yang mengakses,
              membaca, menonton, atau mendengarkan karya jurnalistik melalui
              platform media siber GentaNusa.
            </li>
            <li>
              <strong>Konten Buatan Pengguna (UGC)</strong> adalah konten yang
              dibuat, diunggah, atau dibagikan oleh pembaca/pengguna di platform
              GentaNusa (komentar, forum, unggahan media, dll.).
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pasal 2 — Verifikasi & Keberimbangan Berita</h2>
          <ol className={styles.orderedList}>
            <li>
              <strong>Akurasi:</strong> Setiap berita harus diverifikasi kebenarannya
              melalui minimal dua sumber independen (dual-source verification)
              sebelum dipublikasikan. Data statistik, kutipan, dan klaim
              dikonfirmasi ke sumber primer.
            </li>
            <li>
              <strong>Keberimbangan:</strong> Pemberitaan harus memuat perspektif
              seimbang dari semua pihak yang berkepentingan. Hak jawab disediakan
              bagi pihak yang dirugikan.
            </li>
            <li>
              <strong>Larangan Prasangka:</strong> Redaksi tidak boleh
              mempublikasikan berita berdasarkan prasangka, spekulasi tanpa bukti,
              atau narasi yang memihak sebelum verifikasi selesai.
            </li>
            <li>
              <strong>Sumber Tertutup:</strong> Penggunaan sumber anonim dibatasi
              hanya untuk kasus yang melibatkan keselamatan sumber. Identitas
              sumber tetap diverifikasi oleh redaktur pelaksana.
            </li>
            <li>
              <strong>Kutipan & Atribusi:</strong> Setiap kutipan, data, atau
              informasi dari pihak lain wajib dicantumkan sumbernya dengan jelas
              (atribusi transparan).
            </li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pasal 3 — Konten Buatan Pengguna (UGC) & Moderasi</h2>
          <ol className={styles.orderedList}>
            <li>
              <strong>Tanggung Jawab Pengguna:</strong> Pengguna bertanggung jawab
              penuh atas konten yang diunggah. GentaNusa menyediakan mekanisme
              pelaporan untuk konten yang melanggar hukum/etika.
            </li>
            <li>
              <strong>Moderasi Proaktif:</strong> Redaksi menerapkan moderasi
              kombinasi (otomatis + manual) untuk mendeteksi: ujaran kebencian,
              penyebaran hoaks/desinformasi, pornografi, pelecehan, doxxing, dan
              konten ilegal lainnya.
            </li>
            <li>
              <strong>Penghapusan & Sanksi:</strong> Konten pelanggaran dihapus
              dalam waktu wajar (maksimal 24 jam untuk pelanggaran berat).
              Pelaku berulang dapat diblokir aksesnya secara permanen.
            </li>
            <li>
              <strong>Transparansi Moderasi:</strong> Keputusan penghapusan
              konten UGC yang signifikan dicatat dan dapat diakses melalui
              halaman transparansi moderasi (jika tersedia).
            </li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pasal 4 — Ralat, Koreksi, dan Hak Jawab</h2>
          <ol className={styles.orderedList}>
            <li>
              <strong>Ralat (Correction):</strong> Kesalahan faktual (data, nama,
              angka, tanggal, dll.) dikoreksi secepatnya. Ralat ditempatkan di
              awal artikel dengan label <strong>"RALAT"</strong> dan penjelasan
              singkat kesalahan serta perbaikannya. URL artikel tidak berubah.
            </li>
            <li>
              <strong>Klarifikasi:</strong> Bila informasi ambigu atau menimbulkan
              penafsiran ganda, redaksi menerbitkan klarifikasi terpisah yang
              ditautkan ke artikel asal.
            </li>
            <li>
              <strong>Hak Jawab (Right of Reply):</strong> Pihak yang merasa
              dirugikan oleh pemberitaan berhak mengajukan hak jawab. Redaksi
              wajib mempublikasikan hak jawab dalam waktu <strong>24 jam</strong>
              setelah diterima lengkap, dengan panjang setara proporsional.
            </li>
            <li>
              <strong>Penautan Ralat:</strong> Setiap ralat wajib menautkan
              versi terkoreksi ke artikel asli dan sebaliknya (two-way linking).
            </li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pasal 5 — Pencabutan Berita dan Hak Cipta Liputan</h2>
          <ol className={styles.orderedList}>
            <li>
              <strong>Pencabutan (Retraction):</strong> Berita ditarik (retracted)
              hanya dalam kasus ekstrem: terbukti hoaks total, melanggar hukum
              berat (pencemaran nama baik sengaja, SARA), atau memuat data
              palsu yang tidak dapat dikoreksi. Pencabutan ditetapkan oleh
              Pemimpin Redaksi dengan rekomendasi Dewan Redaksi.
            </li>
            <li>
              <strong>Catatan Pencabutan:</strong> Artikel yang ditarik diganti
              halaman penjelasan pencabutan dengan alasan hukum/etika. URL
              dipertahankan untuk jejak audit (tidak 404).
            </li>
            <li>
              <strong>Hak Cipta Liputan:</strong> Hak cipta karya jurnalistik
              GentaNusa (teks, foto, video, infografis) milik GentaNusa dan/atau
              jurnalis pembuatnya. Penggunaan ulang (reprint, sindikasi, kutipan
              substansial) memerlukan izin tertulis dan penautan kredit.
            </li>
            <li>
              <strong>Kutipan Wajar (Fair Use):</strong> Kutipan singkat untuk
              keperluan berita, kritik, kajian, atau pendidikan diperbolehkan
              dengan syarat: (a) menyertakan atribusi jelas, (b) tidak merugikan
              kepentingan komersial GentaNusa, (c) tidak memuat keseluruhan
              isi karya.
            </li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Penutup</h2>
          <p className={styles.sectionText}>
            Pedoman ini berlaku efektif sejak diterbitkan dan dapat diperbarui
            sewaktu-waktu oleh Dewan Redaksi GentaNusa. Perubahan signifikan
            diumumkan di halaman ini. Setiap redaktur dan jurnalis GentaNusa
            wajib memahami dan mengamalkan pedoman ini dalam setiap proses
            pemberitaan.
          </p>
          <p className={styles.sectionText}>
            <em>Jakarta, Oktober 2026<br />Dewan Redaksi GentaNusa</em>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}