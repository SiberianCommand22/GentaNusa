import type { Metadata } from "next";
import { Footer } from "@/components/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Ketentuan penggunaan portal, hak kekayaan intelektual, dan batasan tanggung jawab.",
  alternates: { canonical: `${SITE_URL}/syarat-ketentuan` },
};

const POINTS: Array<{ title: string; body: string }> = [
  {
    title: "1. Penerimaan Ketentuan",
    body: "Dengan mengakses situs GentaNusa, Anda menyetujui syarat dan ketentuan ini. Jika tidak setuju, mohon tidak menggunakan situs ini.",
  },
  {
    title: "2. Konten & Hak Kekayaan Intelektual",
    body: "Seluruh konten — termasuk berita, gambar, dan desain — dilindungi hak cipta GentaNusa. Pengutipan diperbolehkan dengan menyebutkan sumber dan tautan ke artikel asli.",
  },
  {
    title: "3. Ketepatan Informasi",
    body: "Kami berupaya menyajikan informasi akurat dan terverifikasi. Namun, kami tidak menjamin keakuratan, kelengkapan, atau ketepatan waktu seluruh konten. Kesalahan akan dikoreksi segera setelah diketahui.",
  },
  {
    title: "4. Penggunaan Wajar",
    body: "Dilarang menggunakan situs ini untuk: menyebarkan konten ilegal, melakukan scraping massal tanpa izin, atau mengganggu operasional situs.",
  },
  {
    title: "5. Batasan Tanggung Jawab",
    body: "GentaNusa tidak bertanggung jawab atas kerugian yang timbul dari penggunaan informasi di situs ini. Keputusan berdasarkan konten menjadi tanggung jawab pembaca.",
  },
  {
    title: "6. Kontak",
    body: "Pertanyaan terkait ketentuan ini dapat diajukan ke redaksi@gentanusa.id.",
  },
];

export default function SyaratKetentuanPage() {
  return (
    <>
      <main className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <header>
            <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider">
              Legalitas Pengguna
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-2">
              Syarat & Ketentuan Layanan
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Ketentuan penggunaan portal, hak kekayaan intelektual, dan batasan
              tanggung jawab.
            </p>
            <p className="text-slate-400 text-xs">
              Terakhir diperbarui: September 2026
            </p>
          </header>

          {POINTS.map((p) => (
            <div
              key={p.title}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-2"
            >
              <h2 className="text-lg font-bold text-slate-900">{p.title}</h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
