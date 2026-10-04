import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";
import { OFFICIAL_WA_DISPLAY, OFFICIAL_WA_URL } from "@/lib/social";

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

const linkCls = "text-blue-700 hover:text-blue-900 font-medium transition-colors";
const card = "bg-slate-50 border border-slate-200/60 rounded-xl p-6 space-y-3";
const h2 = "text-lg font-bold text-slate-900";
const p = "text-slate-600 text-sm leading-relaxed";
const listCls =
  "list-disc pl-6 space-y-1.5 text-slate-600 text-sm leading-relaxed";
const thCls =
  "text-left text-xs uppercase tracking-wider font-bold text-slate-900 p-3 border border-slate-200 bg-slate-100";
const tdCls =
  "text-slate-600 p-3 border border-slate-200 text-sm leading-relaxed align-top";

export default function KebijakanPrivasiPage() {
  return (
    <>
      <div className="bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-6 my-10">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400"
          >
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true"> {" > "} </span>
            <span aria-current="page" className="text-slate-700">
              Kebijakan Privasi
            </span>
          </nav>

          <div>
            <span className="inline-block px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold uppercase tracking-wider mb-3">
              Kepatuhan UU PDP
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Kebijakan Privasi
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Perlindungan data pribadi pembaca sesuai UU No. 27 Tahun 2022
              tentang Perlindungan Data Pribadi (UU PDP). Terakhir diperbarui:
              Oktober 2026.
            </p>
          </div>

          <div className="space-y-6">
            <div className={card}>
              <h2 className={h2}>1. Pengendali Data &amp; Kontak Resmi</h2>
              <p className={p}>
                Pengendali data situs ini adalah Redaksi GentaNusa,
                berkedudukan di Jakarta, Indonesia.
              </p>
              <div className="text-sm text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                <p>
                  • Surel Redaksi:{" "}
                  <a href="mailto:redaksi@gentanusa.id" className={linkCls}>
                    <span className="font-mono">redaksi@gentanusa.id</span>
                  </a>
                </p>
                <p>
                  • Privasi &amp; Hak Subjek Data:{" "}
                  <a href="mailto:privasi@gentanusa.id" className={linkCls}>
                    <span className="font-mono">privasi@gentanusa.id</span>
                  </a>
                </p>
                <p>
                  • WhatsApp Kemitraan:{" "}
                  <a
                    href={OFFICIAL_WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkCls}
                  >
                    <span className="font-mono">{OFFICIAL_WA_DISPLAY}</span>
                  </a>
                </p>
              </div>
            </div>

            <div className={card}>
              <h2 className={h2}>2. Data yang Dikumpulkan</h2>
              <p className={p}>
                Kami hanya mengumpulkan data teknis anonim peramban (alamat IP
                yang disamarkan, jenis perangkat, waktu akses) untuk menjamin
                kestabilan jaringan CDN dan pencegahan serangan siber. Kami
                TIDAK menjual data pribadi kepada pihak mana pun.
              </p>
              <ul className={listCls}>
                <li>
                  <strong className="text-slate-900">Formulir Kontak:</strong>{" "}
                  nama, surel, subjek, dan isi pesan.
                </li>
                <li>
                  <strong className="text-slate-900">Buletin:</strong> alamat
                  surel dengan persetujuan eksplisit (double opt-in).
                </li>
                <li>
                  <strong className="text-slate-900">Data Otomatis:</strong> IP
                  dianonimkan, tipe peramban, halaman dikunjungi, referrer.
                </li>
                <li>
                  <strong className="text-slate-900">Cookie:</strong> fungsional
                  (bahasa, tema) dan analitik anonim — tanpa cross-site
                  tracking.
                </li>
              </ul>
            </div>

            <div className={card}>
              <h2 className={h2}>3. Tujuan &amp; Dasar Hukum Penggunaan</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full border-collapse min-w-[640px]">
                  <thead>
                    <tr>
                      <th className={thCls}>Kategori Data</th>
                      <th className={thCls}>Tujuan</th>
                      <th className={thCls}>Dasar Hukum (UU PDP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={tdCls}>Formulir Kontak / Aduan</td>
                      <td className={tdCls}>
                        Merespons pertanyaan, memproses aduan &amp; hak jawab
                      </td>
                      <td className={tdCls}>
                        Pasal 20 ayat (1) huruf b &amp; e
                      </td>
                    </tr>
                    <tr>
                      <td className={tdCls}>Buletin</td>
                      <td className={tdCls}>Mengirim kurasi berita terpilih</td>
                      <td className={tdCls}>Pasal 20 ayat (1) huruf a</td>
                    </tr>
                    <tr>
                      <td className={tdCls}>Data Akses Anonim</td>
                      <td className={tdCls}>
                        Optimasi performa, keamanan, analitik agregat
                      </td>
                      <td className={tdCls}>Pasal 20 ayat (1) huruf f</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className={card}>
              <h2 className={h2}>4. Retensi &amp; Keamanan Data</h2>
              <ul className={listCls}>
                <li>
                  Data kontak/aduan:{" "}
                  <strong className="text-slate-900">24 bulan</strong> setelah
                  kasus selesai.
                </li>
                <li>
                  Data buletin: selama langganan aktif +{" "}
                  <strong className="text-slate-900">30 hari</strong>.
                </li>
                <li>
                  Log akses anonim:{" "}
                  <strong className="text-slate-900">90 hari</strong>.
                </li>
                <li>Enkripsi TLS 1.3, pembatasan akses internal, audit berkala.</li>
              </ul>
            </div>

            <div className={card}>
              <h2 className={h2}>5. Hak Subjek Data</h2>
              <p className={p}>
                Pembaca berhak mengajukan permintaan klarifikasi, penyesuaian,
                atau penghapusan catatan komunikasi (Pasal 5–14 UU PDP):
                akses, koreksi, penghapusan, pembatasan, keberatan,
                portabilitas, dan penarikan persetujuan.
              </p>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-slate-700 text-sm leading-relaxed">
                  <strong className="text-slate-900">Cara Mengajukan:</strong>{" "}
                  kirim surel ke{" "}
                  <a href="mailto:privasi@gentanusa.id" className={linkCls}>
                    privasi@gentanusa.id
                  </a>{" "}
                  dengan subjek &ldquo;HAK SUBJEK DATA — [Nama Lengkap]&rdquo;.
                  Direspons dalam{" "}
                  <strong className="text-slate-900">14 hari kerja</strong>.
                </p>
              </div>
            </div>

            <div className={card}>
              <h2 className={h2}>6. Pihak Ketiga, Anak &amp; Perubahan</h2>
              <p className={p}>
                GentaNusa <strong className="text-slate-900">TIDAK PERNAH</strong>{" "}
                menjual data. Berbagi terbatas pada pemroses terpercaya
                (hosting/CDN, analitik anonim, email transaksional) dengan DPA
                yang sah. Tidak ada pengumpulan sengaja dari anak di bawah 13
                tahun. Perubahan substantif diumumkan via banner situs minimal
                14 hari sebelumnya.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
