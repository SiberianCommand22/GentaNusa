import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";
import { OFFICIAL_WA_DISPLAY, OFFICIAL_WA_URL } from "@/lib/social";

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

const leaders = [
  {
    role: "Pemimpin Umum / Penanggung Jawab",
    name: "Dewan Pimpinan GentaNusa",
    desc: "Penanggung jawab penuh atas seluruh penerbitan, kebijakan editorial, dan kepatuhan hukum pers.",
  },
  {
    role: "Pemimpin Redaksi",
    name: "Redaktur Pelaksana Utama",
    desc: "Mengelola operasional harian redaksi, penetapan agenda berita, dan koordinasi seluruh desk.",
  },
  {
    role: "Dewan Redaksi & Kebijakan Siber",
    name: "Tim Editorial & Siber",
    desc: "Menentukan kebijakan editorial, standar etika jurnalistik, dan pengembangan platform digital.",
  },
  {
    role: "Kanal Peliputan Berita",
    name: "Desk Nasional, Politik, Pertahanan, Sosial Budaya, Kesehatan, Olahraga, Keamanan",
    desc: "Jurnalis lapangan dan kontributor daerah dari Sabang sampai Merauke.",
  },
];

const desks = [
  "Desk Nasional",
  "Desk Politik",
  "Desk Pertahanan",
  "Desk Sosial Budaya",
  "Desk Kesehatan",
  "Desk Olahraga",
  "Desk Keamanan",
];

const linkCls = "text-blue-700 hover:text-blue-900 font-medium transition-colors";

export default function TentangKamiPage() {
  return (
    <>
      <div className="bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400"
          >
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true"> {" > "} </span>
            <span aria-current="page" className="text-slate-700">
              Tentang Kami
            </span>
          </nav>

          <header>
            <span className="inline-block px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold uppercase tracking-wider mb-3">
              Kelembagaan Redaksi
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Tentang Kami &amp; Struktur Redaksi
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-2xl">
              GentaNusa — <em>&ldquo;Lonceng Nusantara&rdquo;</em> — hadir
              sebagai lonceng informasi nusantara: memukul tanda bahaya,
              memberikan kepastian berita di tengah keriuhan informasi palsu,
              dan menyuarakan kabar akurat, independen, dan berimbang bagi
              kedaulatan bangsa.
            </p>
          </header>

          <section className="bg-slate-50 border border-slate-200/60 rounded-xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> Filosofi
              GentaNusa
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Mengambil simbol{" "}
              <strong className="text-slate-900">Genta (Lonceng)</strong>, media
              ini berperan memukul tanda bahaya, memberikan kepastian berita di
              tengah keriuhan informasi palsu, dan menjadi penyambung aspirasi
              publik yang berwibawa dari Sabang sampai Merauke.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 text-base leading-relaxed">
              <li>
                <strong className="text-slate-900">
                  Verifikasi dulu, baru tayang.
                </strong>{" "}
                Setiap berita diperiksa faktanya melalui multi-sumber sebelum
                dipublikasikan.
              </li>
              <li>
                <strong className="text-slate-900">Bahasa rakyat.</strong>{" "}
                Ditulis sederhana, tanpa jargon berat, agar seluruh lapisan
                masyarakat memahami.
              </li>
              <li>
                <strong className="text-slate-900">
                  Transparan &amp; Berimbang.
                </strong>{" "}
                Koreksi dicantumkan terbuka; hak jawab dipenuhi sesuai UU Pers
                No. 40 Tahun 1999.
              </li>
                <li>
                  <strong className="text-slate-900">Peduli Nusantara.</strong>{" "}
                  Liputan sosial, bakti masyarakat, dan kemanusiaan dari
                  seluruh penjuru negeri.
                </li>
            </ul>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-6">
              <h3 className="text-blue-700 uppercase tracking-wider text-xs font-bold mb-3">
                Visi
              </h3>
              <p className="text-slate-900 font-medium text-base sm:text-lg leading-snug">
                Menjadi pilar utama jurnalisme siber nasional yang kredibel,
                berani mengungkap kebenaran, dan mencerdaskan kehidupan
                berbangsa.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-6">
              <h3 className="text-blue-700 uppercase tracking-wider text-xs font-bold mb-3">
                Misi Utama
              </h3>
              <ul className="text-slate-600 text-sm space-y-2 list-disc list-inside">
                <li>Menyajikan jurnalisme berbasis verifikasi berlapis sebelum tayang.</li>
                <li>Menolak intervensi kepentingan politik praktis dan konglomerasi.</li>
                <li>Mendokumentasikan aksi kemanusiaan melalui program bakti sosial.</li>
                <li>Terbuka terhadap koreksi, klarifikasi, dan masukan pembaca.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Dewan &amp; Pengelola Redaksi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {leaders.map((l) => (
                <div
                  key={l.role}
                  className="bg-slate-50 border border-slate-200/60 rounded-xl p-5"
                >
                  <span className="text-xs text-slate-500 uppercase font-medium">
                    {l.role}
                  </span>
                  <p className="text-slate-900 font-bold text-lg mt-1">
                    {l.name}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed mt-2">
                    {l.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Redaktur Desk
              </h3>
              <ol className="list-decimal pl-6 space-y-1.5 text-slate-600 text-sm sm:text-base leading-relaxed">
                {desks.map((d) => (
                  <li key={d} className="pl-1">
                    {d}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">
                Alamat &amp; Kontak Redaksi
              </h2>
              <address className="not-italic text-sm text-slate-600 space-y-1.5 leading-relaxed">
                <p>GentaNusa — Jakarta, Indonesia</p>
                <p>
                  Surel Resmi:{" "}
                  <a href="mailto:redaksi@gentanusa.id" className={linkCls}>
                    redaksi@gentanusa.id
                  </a>
                </p>
                <p>
                  Aduan &amp; Hak Jawab:{" "}
                  <a href="mailto:aduan@gentanusa.id" className={linkCls}>
                    aduan@gentanusa.id
                  </a>
                </p>
                <p>
                  Kemitraan:{" "}
                  <a href="mailto:bisnis@gentanusa.id" className={linkCls}>
                    bisnis@gentanusa.id
                  </a>{" "}
                  /{" "}
                  <a
                    href={OFFICIAL_WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkCls}
                  >
                    {OFFICIAL_WA_DISPLAY}
                  </a>
                </p>
              </address>
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">
                Landasan Hukum
              </h2>
              <ol className="list-decimal pl-6 space-y-1.5 text-slate-600 text-sm leading-relaxed">
                <li className="pl-1">UU No. 40 Tahun 1999 tentang Pers</li>
                <li className="pl-1">Kode Etik Jurnalistik (Dewan Pers)</li>
                <li className="pl-1">
                  Pedoman Pemberitaan Media Siber (Dewan Pers)
                </li>
                <li className="pl-1">UU Perlindungan Data Pribadi (UU PDP)</li>
              </ol>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
