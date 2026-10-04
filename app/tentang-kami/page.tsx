import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";

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
    name: "Desk Nasional, Pertahanan, Politik, Ekonomi, Dunia, Peduli",
    desc: "Jurnalis lapangan dan kontributor daerah dari Sabang sampai Merauke.",
  },
];

const desks = [
  "Desk Nasional",
  "Desk Pertahanan",
  "Desk Politik",
  "Desk Ekonomi",
  "Desk Dunia",
  "Desk Peduli (Kemanusiaan & Sosial)",
];

const linkCls = "text-blue-300 hover:text-white transition-colors";

export default function TentangKamiPage() {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-white/60"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true"> {" > "} </span>
            <span aria-current="page" className="text-white">
              Tentang Kami
            </span>
          </nav>

          {/* Header */}
          <div className="border-b border-white/10 pb-8 text-center sm:text-left">
            <span className="inline-block px-3 py-1 rounded bg-blue-950/80 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider mb-3">
              Kelembagaan Redaksi
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight mb-4">
              Tentang Kami &amp; Struktur Redaksi
            </h1>
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              GentaNusa — <em>&ldquo;Lonceng Nusantara&rdquo;</em> — hadir
              sebagai lonceng informasi nusantara: memukul tanda bahaya,
              memberikan kepastian berita di tengah keriuhan informasi palsu,
              dan menyuarakan kabar akurat, independen, dan berimbang bagi
              kedaulatan bangsa.
            </p>
          </div>

          {/* Filosofi & Komitmen */}
          <div className="bg-[#0B1727] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Filosofi
              GentaNusa
            </h2>
            <p className="text-neutral-300 leading-relaxed text-sm sm:text-base">
              Mengambil simbol{" "}
              <strong className="text-white">Genta (Lonceng)</strong>, media ini
              berperan memukul tanda bahaya, memberikan kepastian berita di
              tengah keriuhan informasi palsu, dan menjadi penyambung aspirasi
              publik yang berwibawa dari Sabang sampai Merauke.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-300 text-sm sm:text-base leading-relaxed">
              <li>
                <strong className="text-white">
                  Verifikasi dulu, baru tayang.
                </strong>{" "}
                Setiap berita diperiksa faktanya melalui multi-sumber sebelum
                dipublikasikan.
              </li>
              <li>
                <strong className="text-white">Bahasa rakyat.</strong> Ditulis
                sederhana, tanpa jargon berat, agar seluruh lapisan masyarakat
                memahami.
              </li>
              <li>
                <strong className="text-white">Transparan &amp; Berimbang.</strong>{" "}
                Koreksi dicantumkan terbuka; hak jawab dipenuhi sesuai UU Pers
                No. 40 Tahun 1999.
              </li>
              <li>
                <strong className="text-white">Peduli Nusantara.</strong> Kanal{" "}
                <strong className="text-white">Peduli</strong> mendokumentasikan
                aksi sosial, bakti masyarakat, dan kemanusiaan.
              </li>
            </ul>
          </div>

          {/* Visi & Misi Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0B1727] border border-white/10 rounded-2xl p-6">
              <h3 className="text-blue-400 uppercase tracking-wider text-xs font-bold mb-3">
                Visi
              </h3>
              <p className="text-white font-medium text-base sm:text-lg leading-snug">
                Menjadi pilar utama jurnalisme siber nasional yang kredibel,
                berani mengungkap kebenaran, dan mencerdaskan kehidupan
                berbangsa.
              </p>
            </div>
            <div className="bg-[#0B1727] border border-white/10 rounded-2xl p-6">
              <h3 className="text-blue-400 uppercase tracking-wider text-xs font-bold mb-3">
                Misi Utama
              </h3>
              <ul className="text-neutral-300 text-sm space-y-2 list-disc list-inside">
                <li>Menyajikan jurnalisme berbasis verifikasi berlapis sebelum tayang.</li>
                <li>Menolak intervensi kepentingan politik praktis dan konglomerasi.</li>
                <li>Mendokumentasikan aksi kemanusiaan melalui program bakti sosial.</li>
                <li>Terbuka terhadap koreksi, klarifikasi, dan masukan pembaca.</li>
              </ul>
            </div>
          </div>

          {/* Struktur Redaksi Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              Dewan &amp; Pengelola Redaksi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {leaders.map((l) => (
                <div
                  key={l.role}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
                >
                  <span className="text-xs text-neutral-400 uppercase">
                    {l.role}
                  </span>
                  <p className="text-white font-bold text-lg mt-1">{l.name}</p>
                  <p className="text-neutral-400 text-sm leading-relaxed mt-2">
                    {l.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-[#0B1727] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-3">
                Redaktur Desk
              </h3>
              <ol className="list-decimal pl-6 space-y-1.5 text-neutral-300 text-sm sm:text-base leading-relaxed">
                {desks.map((d) => (
                  <li key={d} className="pl-1">
                    {d}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Alamat & Landasan Hukum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0B1727] border border-white/10 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-white">
                Alamat &amp; Kontak Redaksi
              </h2>
              <address className="not-italic text-sm text-neutral-300 space-y-1.5 leading-relaxed">
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
                    href="https://wa.me/6285134977073"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkCls}
                  >
                    +62 851-3497-7073
                  </a>
                </p>
              </address>
            </div>
            <div className="bg-[#0B1727] border border-white/10 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-white">Landasan Hukum</h2>
              <ol className="list-decimal pl-6 space-y-1.5 text-neutral-300 text-sm leading-relaxed">
                <li className="pl-1">UU No. 40 Tahun 1999 tentang Pers</li>
                <li className="pl-1">Kode Etik Jurnalistik (Dewan Pers)</li>
                <li className="pl-1">
                  Pedoman Pemberitaan Media Siber (Dewan Pers)
                </li>
                <li className="pl-1">UU Perlindungan Data Pribadi (UU PDP)</li>
              </ol>
            </div>
          </div>
      </main>
      <Footer />
    </>
  );
}
