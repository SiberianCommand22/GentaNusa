import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/site";

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

const h2 =
  "text-xl font-bold text-white mt-8 mb-3 border-b border-white/10 pb-2";
const p = "text-neutral-300 text-sm sm:text-base leading-relaxed mb-4";
const h3 = "text-base font-bold text-white mt-6 mb-2";
const listCls =
  "list-disc pl-6 space-y-2 text-neutral-300 text-sm sm:text-base leading-relaxed mb-4";
const linkCls = "text-blue-300 hover:text-white transition-colors";
const thCls =
  "text-left text-xs uppercase tracking-wider text-neutral-200 font-bold text-neutral-300 p-3 border border-white/10 bg-white/5";
const tdCls = "text-neutral-300 p-3 border border-white/10 text-sm leading-relaxed align-top";

export default function KebijakanPrivasiPage() {
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
            Kebijakan Privasi
          </span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
            Kebijakan Privasi
          </h1>
          <p className="text-xs text-neutral-400 mb-4">
            Terakhir diperbarui: Oktober 2026
          </p>
          <p className={p}>
            GentaNusa menghargai privasi Anda. Kebijakan ini menjelaskan data
            apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak
            apa yang Anda miliki atas data tersebut — sesuai{" "}
            <strong className="text-white">
              UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)
            </strong>
            .
          </p>
        </header>

        <section>
          <h2 className={h2}>1. Pengendali Data</h2>
          <p className={p}>
            <strong className="text-white">GentaNusa</strong> (Portal Berita
            Nasional), Jakarta, Indonesia.
            <br />
            Surel:{" "}
            <a href="mailto:redaksi@gentanusa.id" className={linkCls}>
              redaksi@gentanusa.id
            </a>{" "}
            | WhatsApp Kemitraan:{" "}
            <a
              href="https://wa.me/6285134977073"
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls}
            >
              +62 851-3497-7073
            </a>
          </p>
        </section>

        <section>
          <h2 className={h2}>2. Informasi yang Kami Kumpulkan</h2>
          <h3 className={h3}>2.1 Data yang Anda Berikan Secara Sukarela</h3>
          <ul className={listCls}>
            <li>
              <strong className="text-white">Formulir Kontak:</strong> Nama
              lengkap, alamat surel, subjek, dan isi pesan.
            </li>
            <li>
              <strong className="text-white">Buletin/Surel Langsung:</strong>{" "}
              Alamat surel (dengan persetujuan eksplisit via double opt-in).
            </li>
            <li>
              <strong className="text-white">Aduan Jurnalistik/Hak Jawab:</strong>{" "}
              Identitas pengaju, dokumen pendukung, dan korespondensi.
            </li>
          </ul>
          <h3 className={h3}>2.2 Data Otomatis (Akses &amp; Performa)</h3>
          <ul className={listCls}>
            <li>
              Alamat IP (dianonimkan: 3 oktet terakhir di-hash), tipe
              peramban, sistem operasi, perangkat.
            </li>
            <li>
              Halaman yang dikunjungi, durasi kunjungan, tautan rujukan
              (referrer), waktu akses.
            </li>
            <li>
              Data analitik agregat (Google Analytics 4 / Plausible) —{" "}
              <strong className="text-white">tanpa identitas pribadi</strong>.
            </li>
          </ul>
          <h3 className={h3}>2.3 Cookie &amp; Teknologi Serupa</h3>
          <ul className={listCls}>
            <li>
              <strong className="text-white">Cookie Fungsional:</strong>{" "}
              Preferensi bahasa, mode gelap/terang, status cookie banner.
            </li>
            <li>
              <strong className="text-white">Cookie Analitik:</strong>{" "}
              Pengukuran trafik anonim (dapat ditolak via banner cookie).
            </li>
            <li>
              Kami <strong className="text-white">tidak</strong> menggunakan
              cookie pencarian silang (cross-site tracking) atau fingerprinting
              invasif.
            </li>
          </ul>
        </section>

        <section>
          <h2 className={h2}>3. Tujuan Penggunaan Data</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 mb-4">
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
                    Merespons pertanyaan, memproses aduan jurnalistik, hak
                    jawab
                  </td>
                  <td className={tdCls}>
                    Pasal 20 ayat (1) huruf b (Kontrak) &amp; Pasal 20 ayat (1)
                    huruf e (Kepentingan Hukum)
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Buletin/Surel Langsung</td>
                  <td className={tdCls}>Mengirim kurasi berita terpilih</td>
                  <td className={tdCls}>
                    Pasal 20 ayat (1) huruf a (Persetujuan)
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Data Akses Anonim</td>
                  <td className={tdCls}>
                    Optimasi performa situs, keamanan (DDoS protection),
                    analitik agregat
                  </td>
                  <td className={tdCls}>
                    Pasal 20 ayat (1) huruf f (Kepentingan Sah Pengendali)
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Cookie Fungsional</td>
                  <td className={tdCls}>
                    Menyimpan preferensi pengguna (bahasa, tema, consent)
                  </td>
                  <td className={tdCls}>
                    Pasal 20 ayat (1) huruf f (Kepentingan Sah Pengendali)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className={h2}>4. Penyimpanan &amp; Retensi Data</h2>
          <ul className={listCls}>
            <li>
              <strong className="text-white">Data Kontak/Aduan:</strong>{" "}
              Disimpan selama <strong className="text-white">24 bulan</strong>{" "}
              setelah kasus selesai, lalu dihapus aman.
            </li>
            <li>
              <strong className="text-white">Data Buletin:</strong> Disimpan
              selama langganan aktif +{" "}
              <strong className="text-white">30 hari</strong> setelah berhenti
              berlangganan.
            </li>
            <li>
              <strong className="text-white">
                Log Akses Anonim (IP ter-hash):
              </strong>{" "}
              <strong className="text-white">90 hari</strong> untuk keamanan
              &amp; analitik, lalu dihapus.
            </li>
            <li>
              <strong className="text-white">Cookie Fungsional:</strong>{" "}
              Maksimal <strong className="text-white">12 bulan</strong> atau
              hingga dibersihkan pengguna.
            </li>
          </ul>
          <p className={p}>
            Data tidak disimpan lebih lama dari yang diperlukan untuk tujuan
            pengumpulan, kecuali diwajibkan undang-undang.
          </p>
        </section>

        <section>
          <h2 className={h2}>5. Keamanan Data</h2>
          <ul className={listCls}>
            <li>
              Enkripsi TLS 1.3 untuk semua transmisi data (HTTPS wajib, HSTS,
              certificate pinning).
            </li>
            <li>
              Pembatasan akses internal: hanya personel berwenang (DPO, tim
              teknis) yang mengakses data pribadi.
            </li>
            <li>
              Penerapan{" "}
              <strong className="text-white">Privacy by Design</strong>:
              minimisasi data, anonimisasi IP, pembatasan tujuan.
            </li>
            <li>
              Audit keamanan berkala &amp; penetration testing tahunan oleh
              pihak ketiga independen.
            </li>
            <li>
              Rencana respons insiden kebocoran data (Data Breach Response
              Plan) siap aktif dalam 72 jam.
            </li>
          </ul>
        </section>

        <section>
          <h2 className={h2}>6. Pihak Ketiga &amp; Transfer Data</h2>
          <p className={p}>
            GentaNusa <strong className="text-white">TIDAK PERNAH</strong>{" "}
            menjual, menyewakan, atau memperdagangkan data pribadi pengguna
            kepada pihak ketiga mana pun.
          </p>
          <p className={p}>
            Data hanya dibagikan kepada pemroses data (data processor)
            terpercaya untuk keperluan operasional:
          </p>
          <ul className={listCls}>
            <li>
              <strong className="text-white">
                Penyedia Hosting/CDN (Vercel, Supabase):
              </strong>{" "}
              Infrastruktur situs &amp; database — DPA (Data Processing
              Agreement) ditandatangani.
            </li>
            <li>
              <strong className="text-white">
                Analitik (Google Analytics 4 / Plausible):
              </strong>{" "}
              Data anonim, IP anonimisasi aktif, tidak dibagikan untuk iklan.
            </li>
            <li>
              <strong className="text-white">
                Email Transaksional (Resend / SendGrid):
              </strong>{" "}
              Hanya untuk pengiriman buletin/otomatisasi kontak — tidak untuk
              pemasaran.
            </li>
          </ul>
          <p className={p}>
            Tidak ada transfer data lintas batas (cross-border) ke negara tanpa
            keputusan keadekauan Kominfo, kecuali dengan SCC (Standard
            Contractual Clauses) yang sah.
          </p>
        </section>

        <section>
          <h2 className={h2}>7. Hak Subjek Data (Hak Anda)</h2>
          <p className={p}>
            Sebagai subjek data, Anda berhak (Pasal 5-14 UU PDP):
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10 mb-4">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className={thCls}>Hak</th>
                  <th className={thCls}>Penjelasan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tdCls}>Hak Akses</td>
                  <td className={tdCls}>
                    Meminta salinan data pribadi yang kami proses.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Hak Koreksi</td>
                  <td className={tdCls}>
                    Meminta perbaikan data yang tidak akurat/lengkap.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Hak Penghapusan</td>
                  <td className={tdCls}>
                    Meminta penghapusan data jika tidak lagi diperlukan,
                    persetujuan ditarik, atau pemrosesan melanggar hukum.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Hak Pembatasan</td>
                  <td className={tdCls}>
                    Membatasi penggunaan data dalam kondisi tertentu (mis.
                    saat pengaduan diverifikasi).
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Hak Keberatan</td>
                  <td className={tdCls}>
                    Menolak pemrosesan untuk pemasaran langsung/profiling.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Hak Portabilitas</td>
                  <td className={tdCls}>
                    Menerima data dalam format terstruktur, umum, dan
                    mesin-baca.
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Hak Tarik Persetujuan</td>
                  <td className={tdCls}>
                    Menarik persetujuan kapan saja (tidak mempengaruhi
                    legalitas pemrosesan sebelum penarikan).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 mb-4">
            <p className="text-neutral-200 text-sm sm:text-base leading-relaxed">
              <strong className="text-white">Cara Mengajukan Hak:</strong>{" "}
              Kirim surel ke{" "}
              <a href="mailto:privasi@gentanusa.id" className={linkCls}>
                privasi@gentanusa.id
              </a>{" "}
              dengan subjek &ldquo;HAK SUBJEK DATA — [Nama Lengkap]&rdquo;. Kami
              akan merespons dalam{" "}
              <strong className="text-white">14 hari kerja</strong> sesuai Pasal
              14 UU PDP.
            </p>
          </div>
        </section>

        <section>
          <h2 className={h2}>8. Cookie &amp; Teknologi Pelacakan</h2>
          <p className={p}>Situs ini menggunakan cookie kategori:</p>
          <ul className={listCls}>
            <li>
              <strong className="text-white">
                Wajib (Strictly Necessary):
              </strong>{" "}
              Sesi, keamanan, preferensi consent —{" "}
              <em>tidak bisa dinonaktifkan</em>.
            </li>
            <li>
              <strong className="text-white">Fungsional:</strong> Preferensi
              bahasa, tema — <em>opsional</em>.
            </li>
            <li>
              <strong className="text-white">Analitik:</strong> Pengukuran
              trafik anonim — <em>opsional, butuh consent</em>.
            </li>
          </ul>
          <p className={p}>
            Anda dapat mengelola preferensi cookie kapan saja via tombol{" "}
            <strong className="text-white">
              &ldquo;Preferensi Cookie&rdquo;
            </strong>{" "}
            di footer atau mengatur peramban untuk menolak/menghapus cookie.
          </p>
        </section>

        <section>
          <h2 className={h2}>9. Privasi Anak</h2>
          <p className={p}>
            GentaNusa tidak sengaja mengumpulkan data pribadi dari anak di bawah
            13 tahun (atau usia minimum consent per jurisdiksi). Jika orang
            tua/wali menyadari anak memberikan data tanpa izin, hubungi kami
            untuk penghapusan segera.
          </p>
        </section>

        <section>
          <h2 className={h2}>10. Perubahan Kebijakan</h2>
          <p className={p}>
            Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan substantif
            (mis. perubahan dasar hukum, penerima data baru, atau hak pengguna)
            akan diumumkan melalui:
          </p>
          <ul className={listCls}>
            <li>Notifikasi banner di situs (minimal 14 hari sebelum berlaku).</li>
            <li>Surel ke pelanggan buletin (jika relevan).</li>
            <li>Log perubahan di halaman ini dengan versi &amp; tanggal efektif.</li>
          </ul>
        </section>

        <section>
          <h2 className={h2}>11. Hubungi Kami</h2>
          <p className={p}>
            Pertanyaan, keluhan, atau pengajuan hak subjek data:
          </p>
          <address className="not-italic rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className={p}>
              Email:{" "}
              <a href="mailto:privasi@gentanusa.id" className={linkCls}>
                privasi@gentanusa.id
              </a>{" "}
              /{" "}
              <a href="mailto:redaksi@gentanusa.id" className={linkCls}>
                redaksi@gentanusa.id
              </a>
            </p>
            <p className={p}>
              WhatsApp Kemitraan:{" "}
              <a
                href="https://wa.me/6285134977073"
                target="_blank"
                rel="noopener noreferrer"
                className={linkCls}
              >
                +62 851-3497-7073
              </a>
            </p>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Subjek: <strong className="text-white">PRIVASI / HAK SUBJEK DATA</strong>
              <br />
              GentaNusa — Jakarta, Indonesia
            </p>
          </address>
        </section>
      </main>
      <Footer />
    </>
  );
}
