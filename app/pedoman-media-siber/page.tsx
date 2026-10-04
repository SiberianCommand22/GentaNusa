import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";

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

const card = "bg-neutral-900/40 border border-white/10 rounded-xl p-6 mb-6";
const cardTitle = "text-lg font-bold text-white mb-4";
const olCls =
  "list-decimal pl-6 space-y-3 text-neutral-300 text-sm sm:text-base leading-relaxed";
const liCls = "pl-2";
const p = "text-neutral-300 text-sm sm:text-base leading-relaxed mb-4";

export default function PedomanMediaSiberPage() {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-10">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-semibold text-white/60 mb-6"
        >
          <Link href="/" className="hover:text-white transition-colors">
            Beranda
          </Link>
          <span aria-hidden="true"> {" > "} </span>
          <span aria-current="page" className="text-white">
            Pedoman Media Siber
          </span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
            Pedoman Pemberitaan Media Siber
          </h1>
          <p className={p}>
            Pedoman ini mengacu pada{" "}
            <strong className="text-white">UU Pers No. 40 Tahun 1999</strong>,{" "}
            <strong className="text-white">Kode Etik Jurnalistik</strong>, dan{" "}
            <strong className="text-white">
              Pedoman Pemberitaan Media Siber Dewan Pers
            </strong>{" "}
            sebagai landasan operasional redaksi GentaNusa dalam
            menyelenggarakan pemberitaan berbasis platform digital.
          </p>
        </header>

        <section className={card}>
          <h2 className={cardTitle}>Pasal 1 — Ruang Lingkup</h2>
          <ol className={olCls}>
            <li className={liCls}>
              <strong className="text-white">Media Siber</strong> adalah media
              yang menyelenggarakan pemberitaan melalui platform digital
              (website, aplikasi, media sosial, dan saluran digital lainnya).
            </li>
            <li className={liCls}>
              <strong className="text-white">Karya Jurnalistik</strong> adalah
              karya berupa artikel, video, audio, infografis, atau bentuk
              konten jurnalistik lainnya yang diproduksi atau dikurasi redaksi.
            </li>
            <li className={liCls}>
              <strong className="text-white">Pembaca/Pengguna</strong> adalah
              pihak yang mengakses, membaca, menonton, atau mendengarkan karya
              jurnalistik melalui platform media siber GentaNusa.
            </li>
            <li className={liCls}>
              <strong className="text-white">
                Konten Buatan Pengguna (UGC)
              </strong>{" "}
              adalah konten yang dibuat, diunggah, atau dibagikan oleh
              pembaca/pengguna di platform GentaNusa (komentar, forum, unggahan
              media, dll.).
            </li>
          </ol>
        </section>

        <section className={card}>
          <h2 className={cardTitle}>
            Pasal 2 — Verifikasi &amp; Keberimbangan Berita
          </h2>
          <ol className={olCls}>
            <li className={liCls}>
              <strong className="text-white">Akurasi:</strong> Setiap berita
              harus diverifikasi kebenarannya melalui minimal dua sumber
              independen (dual-source verification) sebelum dipublikasikan.
              Data statistik, kutipan, dan klaim dikonfirmasi ke sumber primer.
            </li>
            <li className={liCls}>
              <strong className="text-white">Keberimbangan:</strong>{" "}
              Pemberitaan harus memuat perspektif seimbang dari semua pihak
              yang berkepentingan. Hak jawab disediakan bagi pihak yang
              dirugikan.
            </li>
            <li className={liCls}>
              <strong className="text-white">Larangan Prasangka:</strong>{" "}
              Redaksi tidak boleh mempublikasikan berita berdasarkan prasangka,
              spekulasi tanpa bukti, atau narasi yang memihak sebelum
              verifikasi selesai.
            </li>
            <li className={liCls}>
              <strong className="text-white">Sumber Tertutup:</strong>{" "}
              Penggunaan sumber anonim dibatasi hanya untuk kasus yang
              melibatkan keselamatan sumber. Identitas sumber tetap
              diverifikasi oleh redaktur pelaksana.
            </li>
            <li className={liCls}>
              <strong className="text-white">Kutipan &amp; Atribusi:</strong>{" "}
              Setiap kutipan, data, atau informasi dari pihak lain wajib
              dicantumkan sumbernya dengan jelas (atribusi transparan).
            </li>
          </ol>
        </section>

        <section className={card}>
          <h2 className={cardTitle}>
            Pasal 3 — Konten Buatan Pengguna (UGC) &amp; Moderasi
          </h2>
          <ol className={olCls}>
            <li className={liCls}>
              <strong className="text-white">
                Tanggung Jawab Pengguna:
              </strong>{" "}
              Pengguna bertanggung jawab penuh atas konten yang diunggah.
              GentaNusa menyediakan mekanisme pelaporan untuk konten yang
              melanggar hukum/etika.
            </li>
            <li className={liCls}>
              <strong className="text-white">Moderasi Proaktif:</strong>{" "}
              Redaksi menerapkan moderasi kombinasi (otomatis + manual) untuk
              mendeteksi: ujaran kebencian, penyebaran hoaks/desinformasi,
              pornografi, pelecehan, doxxing, dan konten ilegal lainnya.
            </li>
            <li className={liCls}>
              <strong className="text-white">Penghapusan &amp; Sanksi:</strong>{" "}
              Konten pelanggaran dihapus dalam waktu wajar (maksimal 24 jam
              untuk pelanggaran berat). Pelaku berulang dapat diblokir aksesnya
              secara permanen.
            </li>
            <li className={liCls}>
              <strong className="text-white">Transparansi Moderasi:</strong>{" "}
              Keputusan penghapusan konten UGC yang signifikan dicatat dan
              dapat diakses melalui halaman transparansi moderasi (jika
              tersedia).
            </li>
          </ol>
        </section>

        <section className={card}>
          <h2 className={cardTitle}>
            Pasal 4 — Ralat, Koreksi, dan Hak Jawab
          </h2>
          <ol className={olCls}>
            <li className={liCls}>
              <strong className="text-white">Ralat (Correction):</strong>{" "}
              Kesalahan faktual (data, nama, angka, tanggal, dll.) dikoreksi
              secepatnya. Ralat ditempatkan di awal artikel dengan label{" "}
              <strong className="text-white">&ldquo;RALAT&rdquo;</strong> dan
              penjelasan singkat kesalahan serta perbaikannya. URL artikel
              tidak berubah.
            </li>
            <li className={liCls}>
              <strong className="text-white">Klarifikasi:</strong> Bila
              informasi ambigu atau menimbulkan penafsiran ganda, redaksi
              menerbitkan klarifikasi terpisah yang ditautkan ke artikel asal.
            </li>
            <li className={liCls}>
              <strong className="text-white">
                Hak Jawab (Right of Reply):
              </strong>{" "}
              Pihak yang merasa dirugikan oleh pemberitaan berhak mengajukan
              hak jawab. Redaksi wajib mempublikasikan hak jawab dalam waktu{" "}
              <strong className="text-white">24 jam</strong> setelah diterima
              lengkap, dengan panjang setara proporsional.
            </li>
            <li className={liCls}>
              <strong className="text-white">Penautan Ralat:</strong> Setiap
              ralat wajib menautkan versi terkoreksi ke artikel asli dan
              sebaliknya (two-way linking).
            </li>
          </ol>
        </section>

        <section className={card}>
          <h2 className={cardTitle}>
            Pasal 5 — Pencabutan Berita dan Hak Cipta Liputan
          </h2>
          <ol className={olCls}>
            <li className={liCls}>
              <strong className="text-white">
                Pencabutan (Retraction):
              </strong>{" "}
              Berita ditarik (retracted) hanya dalam kasus ekstrem: terbukti
              hoaks total, melanggar hukum berat (pencemaran nama baik sengaja,
              SARA), atau memuat data palsu yang tidak dapat dikoreksi.
              Pencabutan ditetapkan oleh Pemimpin Redaksi dengan rekomendasi
              Dewan Redaksi.
            </li>
            <li className={liCls}>
              <strong className="text-white">Catatan Pencabutan:</strong>{" "}
              Artikel yang ditarik diganti halaman penjelasan pencabutan dengan
              alasan hukum/etika. URL dipertahankan untuk jejak audit (tidak
              404).
            </li>
            <li className={liCls}>
              <strong className="text-white">Hak Cipta Liputan:</strong> Hak
              cipta karya jurnalistik GentaNusa (teks, foto, video, infografis)
              milik GentaNusa dan/atau jurnalis pembuatnya. Penggunaan ulang
              (reprint, sindikasi, kutipan substansial) memerlukan izin
              tertulis dan penautan kredit.
            </li>
            <li className={liCls}>
              <strong className="text-white">
                Kutipan Wajar (Fair Use):
              </strong>{" "}
              Kutipan singkat untuk keperluan berita, kritik, kajian, atau
              pendidikan diperbolehkan dengan syarat: (a) menyertakan atribusi
              jelas, (b) tidak merugikan kepentingan komersial GentaNusa, (c)
              tidak memuat keseluruhan isi karya.
            </li>
          </ol>
        </section>

        <section className={card}>
          <h2 className={cardTitle}>Penutup</h2>
          <p className={p}>
            Pedoman ini berlaku efektif sejak diterbitkan dan dapat diperbarui
            sewaktu-waktu oleh Dewan Redaksi GentaNusa. Perubahan signifikan
            diumumkan di halaman ini. Setiap redaktur dan jurnalis GentaNusa
            wajib memahami dan mengamalkan pedoman ini dalam setiap proses
            pemberitaan.
          </p>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            <em>
              Jakarta, Oktober 2026
              <br />
              Dewan Redaksi GentaNusa
            </em>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
