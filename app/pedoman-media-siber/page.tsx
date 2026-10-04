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

const pasals = [
  {
    nomor: "Pasal 1",
    judul: "Ruang Lingkup",
    intro:
      "Media Siber adalah media yang menyelenggarakan kegiatan jurnalistik melalui saluran digital internet.",
    points: [
      "Media Siber mencakup website, aplikasi, media sosial, dan saluran digital lainnya.",
      "Karya Jurnalistik mencakup artikel, foto, audio, video, dan grafis yang diolah melalui kaidah kode etik jurnalistik.",
      "Konten Buatan Pengguna (UGC) adalah konten yang dibuat pembaca: komentar, forum, dan unggahan media.",
    ],
  },
  {
    nomor: "Pasal 2",
    judul: "Verifikasi dan Keberimbangan Berita",
    intro:
      "Setiap berita wajib melalui proses uji silang kebenaran data minimal dari dua sumber independen.",
    points: [
      "Akurasi: verifikasi dual-source; data statistik, kutipan, dan klaim dikonfirmasi ke sumber primer.",
      "Keberimbangan: memuat perspektif seimbang; hak jawab disediakan bagi pihak yang dirugikan.",
      "Larangan prasangka: tidak ada spekulasi tanpa bukti atau narasi memihak sebelum verifikasi selesai.",
      "Sumber anonim dibatasi hanya untuk keselamatan sumber; identitas tetap diverifikasi redaktur pelaksana.",
      "Setiap kutipan wajib mencantumkan atribusi sumber secara transparan.",
    ],
  },
  {
    nomor: "Pasal 3",
    judul: "Konten Buatan Pengguna (User Generated Content)",
    intro:
      "GentaNusa berhak menyaring, menyunting, atau mencabut materi publik yang melanggar hukum dan etika.",
    points: [
      "Pengguna bertanggung jawab penuh atas konten yang diunggah; tersedia mekanisme pelaporan pelanggaran.",
      "Moderasi kombinasi otomatis + manual untuk ujaran kebencian, fitnah, disinformasi, pornografi, doxxing.",
      "Konten pelanggaran berat dihapus maksimal 24 jam; pelaku berulang dapat diblokir permanen.",
    ],
  },
  {
    nomor: "Pasal 4",
    judul: "Hak Jawab, Hak Koreksi, dan Ralat",
    intro:
      "Pihak yang dirugikan oleh pemberitaan berhak mengajukan Hak Jawab secara tertulis.",
    points: [
      "Ralat: kesalahan faktual dikoreksi secepatnya dengan label RALAT di awal artikel; URL tidak berubah.",
      "Klarifikasi terpisah diterbitkan bila informasi ambigu, ditautkan dua arah ke artikel asal.",
      "Hak Jawab dipublikasikan maksimal 24 jam setelah diterima lengkap, dengan panjang proporsional.",
    ],
  },
  {
    nomor: "Pasal 5",
    judul: "Pencabutan Berita & Hak Cipta",
    intro:
      "Berita yang sudah dipublikasikan tidak dapat dicabut sembarangan kecuali alasan hukum yang sah.",
    points: [
      "Retraksi hanya untuk hoaks total, pelanggaran hukum berat, atau data palsu yang tak terkoreksi — ditetapkan Pemimpin Redaksi.",
      "Artikel yang ditarik diganti halaman penjelasan; URL dipertahankan untuk jejak audit.",
      "Hak cipta karya (teks, foto, video, infografis) milik GentaNusa; penggunaan ulang butuh izin tertulis dan kredit.",
      "Kutipan wajar diperbolehkan dengan atribusi jelas dan tidak merugikan kepentingan komersial.",
    ],
  },
];

export default function PedomanMediaSiberPage() {
  return (
    <>
      <div className="bg-[#F8FAFC] py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6"
          >
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true"> {" > "} </span>
            <span aria-current="page" className="text-slate-700">
              Pedoman Media Siber
            </span>
          </nav>

          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold uppercase tracking-wider mb-3">
              Standar Dewan Pers
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Pedoman Pemberitaan Media Siber
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Sesuai UU Pers No. 40 Tahun 1999 dan Keputusan Dewan Pers,
              seluruh produk naskah GentaNusa tunduk pada pedoman operasional
              siber berikut.
            </p>
          </div>

          <div>
            {pasals.map((p) => (
              <div
                key={p.nomor}
                className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-6"
              >
                <div className="mb-2">
                  <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider">
                    {p.nomor}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 inline-block ml-3">
                    {p.judul}
                  </h2>
                </div>
                <p className="text-slate-700 text-base leading-relaxed mt-3">
                  {p.intro}
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-1.5 text-slate-600 text-sm leading-relaxed">
                  {p.points.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Penutup</h2>
            <p className="text-slate-700 text-base leading-relaxed mb-3">
              Pedoman ini berlaku efektif sejak diterbitkan dan dapat diperbarui
              sewaktu-waktu oleh Dewan Redaksi GentaNusa. Setiap redaktur dan
              jurnalis wajib memahami dan mengamalkan pedoman ini dalam setiap
              proses pemberitaan.
            </p>
            <p className="text-slate-500 text-sm">
              <em>
                Jakarta, Oktober 2026
                <br />
                Dewan Redaksi GentaNusa
              </em>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
