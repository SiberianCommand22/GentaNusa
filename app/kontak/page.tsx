"use client";

import { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/site";

const SUBJECTS = [
  { value: "redaksi", label: "Redaksi & Pengiriman Naskah Opini" },
  { value: "iklan", label: "Iklan, Kemitraan & Media Partner" },
  { value: "aduan", label: "Aduan Jurnalistik & Hak Jawab" },
  { value: "privasi", label: "Privasi & Perlindungan Data Pribadi" },
  { value: "lainnya", label: "Lainnya" },
];

const WA_URL = "https://wa.me/6285134977073";
const IG_URL =
  "https://www.instagram.com/gentanusa_id?stkn=MXEzZXVlYWZyZnE4Zw==";

const labelCls =
  "block text-xs uppercase tracking-wider text-neutral-300 font-semibold mb-2";
const inputCls =
  "w-full bg-[#060b14] border border-white/15 rounded-lg px-4 py-3 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";

export default function KontakPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "redaksi",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("submitting");

    try {
      const res = await fetch("/api/kontak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "redaksi", message: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(data.error || "Gagal mengirim pesan. Coba lagi nanti.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Terjadi kesalahan jaringan. Periksa koneksi dan coba lagi.");
    }
  }

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-white/60"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true"> {" > "} </span>
            <span aria-current="page" className="text-white">
              Kontak
            </span>
          </nav>

          <div className="text-center sm:text-left">
            <span className="px-3 py-1 rounded bg-blue-950/80 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider">
              Komunikasi Resmi
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-3 mb-2">
              Kontak &amp; Hubungi Redaksi
            </h1>
            <p className="text-neutral-400 text-sm max-w-2xl mb-10">
              Hubungi redaksi untuk hak jawab, pengiriman naskah opini,
              kemitraan media, maupun periklanan. Respons maksimal 1–2 hari
              kerja.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Kolom Kiri: Saluran Resmi */}
            <div className="lg:col-span-5 bg-[#0B1727] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white">Saluran Langsung</h2>

              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-xs text-neutral-400 font-medium">
                    WhatsApp Kemitraan &amp; Redaksi:
                  </span>
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-green-400 font-bold hover:underline text-base font-mono"
                  >
                    +62 851-3497-7073
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-xs text-neutral-400 font-medium">
                    Instagram Resmi:
                  </span>
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-pink-400 font-bold hover:underline text-base font-mono"
                  >
                    @gentanusa_id
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-xs text-neutral-400 font-medium">
                    Surel Redaksi &amp; Aduan:
                  </span>
                  <a
                    href="mailto:redaksi@gentanusa.id"
                    className="text-white font-mono font-semibold hover:underline block"
                  >
                    redaksi@gentanusa.id
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-xs text-neutral-400 font-medium">
                    Surel Kemitraan &amp; Iklan:
                  </span>
                  <a
                    href="mailto:bisnis@gentanusa.id"
                    className="text-white font-mono font-semibold hover:underline block"
                  >
                    bisnis@gentanusa.id
                  </a>
                </div>

                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl space-y-1">
                  <span className="text-xs text-neutral-400 font-medium">
                    Alamat Kantor:
                  </span>
                  <p className="text-white font-semibold">
                    Jakarta, Indonesia
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 text-xs text-neutral-400 leading-relaxed">
                  Aduan jurnalistik diproses sesuai{" "}
                  <strong className="text-white">
                    UU Pers No. 40 Tahun 1999
                  </strong>
                  , Kode Etik Jurnalistik, dan Pedoman Media Siber Dewan Pers.
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Form Pesan */}
            <div className="lg:col-span-7 bg-[#0B1727] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">
                Kirim Pesan ke Redaksi
              </h2>

              {status === "success" && (
                <div
                  className="bg-green-500/15 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm font-medium mb-6"
                  role="status"
                >
                  Pesan Anda telah terkirim. Tim redaksi akan merespons dalam
                  1–2 hari kerja.
                </div>
              )}

              {status === "error" && (
                <div
                  className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm font-medium mb-6"
                  role="alert"
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="name" className={labelCls}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Nama Anda..."
                    autoComplete="name"
                    disabled={status === "submitting"}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelCls}>
                    Alamat Surel (Email)
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="alamat@email.com"
                    autoComplete="email"
                    disabled={status === "submitting"}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className={labelCls}>
                    Kategori Kepentingan
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    disabled={status === "submitting"}
                    className={`${inputCls} cursor-pointer`}
                  >
                    {SUBJECTS.map((s) => (
                      <option
                        key={s.value}
                        value={s.value}
                        className="bg-[#0B1727] text-white"
                      >
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className={labelCls}>
                    Pesan Anda
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    required
                    minLength={20}
                    placeholder="Tuliskan pesan atau klarifikasi secara detail... (minimal 20 karakter)"
                    disabled={status === "submitting"}
                    className={`${inputCls} resize-y min-h-[140px] leading-relaxed`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "submitting"
                    ? "Mengirim..."
                    : "Kirim Pesan Sekarang"}
                </button>
              </form>

              <p className="mt-5 text-xs leading-relaxed text-neutral-400 text-center">
                Dengan mengirim formulir ini, Anda menyetujui pengolahan data
                sesuai{" "}
                <Link
                  href="/kebijakan-privasi"
                  className="text-blue-300 hover:text-white transition-colors"
                >
                  Kebijakan Privasi GentaNusa
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
