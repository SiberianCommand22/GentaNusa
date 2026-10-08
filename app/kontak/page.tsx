"use client";

import { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/site";
import { WhatsappIcon } from "@/components/WhatsappIcon";
import {
  OFFICIAL_EMAIL_BISNIS,
  OFFICIAL_EMAIL_REDAKSI,
  OFFICIAL_IG_URL,
  OFFICIAL_WA_URL,
} from "@/lib/social";

const SUBJECTS = [
  { value: "redaksi", label: "Redaksi & Pengiriman Naskah Opini" },
  { value: "iklan", label: "Iklan, Kemitraan & Media Partner" },
  { value: "aduan", label: "Aduan Jurnalistik & Hak Jawab" },
  { value: "privasi", label: "Privasi & Perlindungan Data Pribadi" },
  { value: "lainnya", label: "Lainnya" },
];

const labelCls =
  "block text-xs uppercase tracking-wider text-slate-700 font-bold mb-1.5";

// Reset total kontrol formulir: tidak boleh ada gaya bawaan browser/Windows.
const fieldBase =
  "w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const inputCls = `${fieldBase} mb-4`;
const selectCls = `${fieldBase} mb-4 appearance-none pr-11 cursor-pointer`;
const textareaCls = `${fieldBase} mb-4 min-h-[140px] resize-y leading-relaxed`;
const submitCls =
  "w-full py-4 bg-[#041d56] hover:bg-[#021236] text-white font-bold rounded-xl transition-all shadow-md text-sm uppercase tracking-wider cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

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
      <div className="bg-[#F8FAFC] min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6"
          >
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true"> {" > "} </span>
            <span aria-current="page" className="text-slate-700">
              Kontak
            </span>
          </nav>

          <div className="mb-8">
            <span className="inline-block px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold uppercase tracking-wider mb-3">
              Komunikasi Resmi
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Kontak &amp; Hubungi Redaksi
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-2xl">
              Hubungi redaksi untuk hak jawab, pengiriman naskah opini,
              kemitraan media, maupun periklanan. Respons maksimal 1–2 hari
              kerja.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Kolom Kiri: Saluran Resmi */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
                Saluran Langsung
              </h2>

              <div className="space-y-4 text-sm">
                <a
                  href={OFFICIAL_WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all text-sm"
                >
                  <WhatsappIcon className="w-5 h-5 fill-current shrink-0" />
                  <span>Chat WhatsApp Redaksi</span>
                </a>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-1">
                  <span className="text-xs text-slate-500 font-medium">
                    WhatsApp Redaksi:
                  </span>
                  <a
                    href={OFFICIAL_WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-700 font-bold hover:text-emerald-800 hover:underline text-base"
                  >
                    <WhatsappIcon className="w-4 h-4 fill-current shrink-0" />
                    WhatsApp
                  </a>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-1">
                  <span className="text-xs text-slate-500 font-medium">
                    Instagram Resmi:
                  </span>
                  <a
                    href={OFFICIAL_IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-pink-600 font-bold hover:underline text-base"
                  >
                    Instagram
                  </a>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-1">
                  <span className="text-xs text-slate-500 font-medium">
                    Surel Redaksi &amp; Aduan:
                  </span>
                  <a
                    href={`mailto:${OFFICIAL_EMAIL_REDAKSI}`}
                    className="block text-slate-900 font-mono font-semibold hover:underline"
                  >
                    {OFFICIAL_EMAIL_REDAKSI}
                  </a>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-1">
                  <span className="text-xs text-slate-500 font-medium">
                    Surel Kemitraan &amp; Iklan:
                  </span>
                  <a
                    href={`mailto:${OFFICIAL_EMAIL_BISNIS}`}
                    className="block text-slate-900 font-mono font-semibold hover:underline"
                  >
                    {OFFICIAL_EMAIL_BISNIS}
                  </a>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-1">
                  <span className="text-xs text-slate-500 font-medium">
                    Alamat Kantor:
                  </span>
                  <p className="text-slate-900 font-semibold">
                    Jakarta, Indonesia
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
                  Aduan jurnalistik diproses sesuai{" "}
                  <strong className="text-slate-900">
                    UU Pers No. 40 Tahun 1999
                  </strong>
                  , Kode Etik Jurnalistik, dan Pedoman Media Siber Dewan Pers.
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Formulir Pesan Redaksi */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Kirim Pesan ke Redaksi
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Respons maksimal 1–2 hari kerja untuk kemitraan, hak jawab, dan
                kerja sama.
              </p>

              {status === "success" && (
                <div
                  className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium mb-6"
                  role="status"
                >
                  Pesan Anda telah terkirim. Tim redaksi akan merespons dalam
                  1–2 hari kerja.
                </div>
              )}

              {status === "error" && (
                <div
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium mb-6"
                  role="alert"
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full" noValidate>
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

                <label htmlFor="subject" className={labelCls}>
                  Kategori Kepentingan
                </label>
                <div className="relative mb-4">
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    disabled={status === "submitting"}
                    className={selectCls}
                  >
                    {SUBJECTS.map((s) => (
                      <option
                        key={s.value}
                        value={s.value}
                        className="bg-white text-slate-900"
                      >
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                <label htmlFor="message" className={labelCls}>
                  Pesan Anda
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  required
                  minLength={20}
                  placeholder="Tuliskan pesan atau klarifikasi secara detail... (minimal 20 karakter)"
                  disabled={status === "submitting"}
                  className={textareaCls}
                />

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className={submitCls}
                >
                  {status === "submitting"
                    ? "Mengirim..."
                    : "Kirim Pesan Sekarang"}
                </button>
              </form>

              <p className="mt-5 text-xs leading-relaxed text-slate-500 text-center">
                Dengan mengirim formulir ini, Anda menyetujui pengolahan data
                sesuai{" "}
                <Link
                  href="/kebijakan-privasi"
                  className="text-blue-700 hover:text-blue-900 font-medium transition-colors"
                >
                  Kebijakan Privasi GentaNusa
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
