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

const h2 =
  "text-xl font-bold text-white mt-8 mb-3 border-b border-white/10 pb-2";
const p = "text-neutral-300 text-sm sm:text-base leading-relaxed mb-4";
const linkCls = "text-blue-300 hover:text-white transition-colors";

const leaders = [
  {
    role: "Pemimpin Umum",
    desc: "Penanggung jawab penuh atas seluruh penerbitan, kebijakan editorial, dan kepatuhan hukum pers.",
  },
  {
    role: "Pemimpin Redaksi",
    desc: "Mengelola operasional harian redaksi, penetapan agenda berita, dan koordinasi seluruh desk.",
  },
  {
    role: "Dewan Redaksi",
    desc: "Menentukan kebijakan editorial, standar etika jurnalistik, dan pengembangan platform digital.",
  },
  {
    role: "Tim Liputan",
    desc: "Jurnalis lapangan dan kontributor daerah yang meliput peristiwa nasional, pertahanan, politik, ekonomi, dunia, dan kemanusiaan.",
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

export default function TentangKamiPage() {
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
            Tentang Kami
          </span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
            Tentang Kami &amp; Struktur Redaksi
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-4">
            <strong className="text-white">GentaNusa</strong> —{" "}
            <em>&ldquo;Lonceng Nusantara&rdquo;</em> — hadir sebagai penanda
            kabar penting bagi bangsa. Lonceng membunyikan peringatan,
            panggilan, dan tanda. Seperti itulah GentaNusa: menyuarakan kabar
            yang perlu diketahui seluruh negeri.
          </p>
        </header>

        <section>
          <h2 className={h2}>Visi</h2>
          <p className={p}>
            Menjadi portal berita nasional terpercaya yang menyajikan informasi
            politik, ekonomi, pertahanan, dan kemanusiaan secara akurat, cepat,
            dan mudah dipahami rakyat Indonesia.
          </p>
        </section>

        <section>
          <h2 className={h2}>Misi</h2>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300 text-sm sm:text-base leading-relaxed mb-4">
            <li>Menyajikan berita yang terverifikasi sebelum tayang.</li>
            <li>Menggunakan bahasa yang jelas, ringkas, dan mudah dipahami.</li>
            <li>
              Menjaga independensi dan integritas jurnalistik tanpa kompromi.
            </li>
            <li>
              Terbuka terhadap koreksi, klarifikasi, dan masukan pembaca.
            </li>
            <li>
              Mendokumentasikan aksi sosial, bakti, dan kemanusiaan di
              Nusantara.
            </li>
          </ul>
        </section>

        <section>
          <h2 className={h2}>Komitmen Jurnalistik</h2>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300 text-sm sm:text-base leading-relaxed mb-4">
            <li>
              <strong className="text-white">
                Verifikasi dulu, baru tayang.
              </strong>{" "}
              Setiap berita diperiksa faktanya melalui multi-sumber sebelum
              dipublikasikan.
            </li>
            <li>
              <strong className="text-white">Bahasa rakyat.</strong> Berita
              ditulis sederhana, tanpa jargon berat, agar seluruh lapisan
              masyarakat memahami.
            </li>
            <li>
              <strong className="text-white">Transparan &amp; Berimbang.</strong>{" "}
              Koreksi dicantumkan secara terbuka; hak jawab dipenuhi sesuai UU
              Pers No. 40 Tahun 1999.
            </li>
            <li>
              <strong className="text-white">Peduli Nusantara.</strong> Kanal{" "}
              <strong className="text-white">Peduli</strong> mendokumentasikan
              aksi sosial, bakti masyarakat, dan kemanusiaan.
            </li>
          </ul>
        </section>

        <section>
          <h2 className={h2}>Struktur Manajemen Redaksi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {leaders.map((l) => (
              <article
                key={l.role}
                className="bg-neutral-900/40 border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-base font-bold text-white mb-2">
                  {l.role}
                </h3>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  {l.desc}
                </p>
              </article>
            ))}
          </div>
          <div className="bg-neutral-900/40 border border-white/10 rounded-xl p-6">
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
        </section>

        <section>
          <h2 className={h2}>Alamat &amp; Kontak Redaksi</h2>
          <address className="not-italic rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className={p}>GentaNusa — Jakarta, Indonesia</p>
            <p className={p}>
              Surel Resmi:{" "}
              <a href="mailto:redaksi@gentanusa.id" className={linkCls}>
                redaksi@gentanusa.id
              </a>
            </p>
            <p className={p}>
              Aduan Jurnalistik &amp; Hak Jawab:{" "}
              <a href="mailto:aduan@gentanusa.id" className={linkCls}>
                aduan@gentanusa.id
              </a>
            </p>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Kemitraan &amp; Iklan:{" "}
              <a href="mailto:bisnis@gentanusa.id" className={linkCls}>
                bisnis@gentanusa.id
              </a>{" "}
              / WhatsApp:{" "}
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
        </section>

        <section>
          <h2 className={h2}>Landasan Hukum</h2>
          <ol className="list-decimal pl-6 space-y-1.5 text-neutral-300 text-sm sm:text-base leading-relaxed mb-4">
            <li className="pl-1">UU No. 40 Tahun 1999 tentang Pers</li>
            <li className="pl-1">Kode Etik Jurnalistik (Dewan Pers)</li>
            <li className="pl-1">Pedoman Pemberitaan Media Siber (Dewan Pers)</li>
            <li className="pl-1">UU Perlindungan Data Pribadi (UU PDP)</li>
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
