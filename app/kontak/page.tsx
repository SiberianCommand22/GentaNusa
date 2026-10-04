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
  "text-xs uppercase tracking-wider text-neutral-300 font-semibold mb-2 block";
const inputCls =
  "w-full bg-[#070e1b] border border-white/20 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500";

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
      <main className="max-w-5xl mx-auto px-4 py-10">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-semibold text-white/60 mb-6"
        >
          <Link href="/" className="hover:text-white transition-colors">
            Beranda
          </Link>
          <span aria-hidden="true"> {" > "} </span>
          <span aria-current="page" className="text-white">
            Kontak
          </span>
        </nav>

        <div className="bg-[#0B1727] text-white border border-white/10 rounded-2xl p-6 sm:p-10 shadow-xl">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
            Kontak &amp; Hubungi Kami
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-8">
            Kami terbuka untuk masukan, pertanyaan, aduan jurnalistik, dan
            kerja sama kemitraan. Pilih kategori yang paling sesuai agar kami
            dapat merespons dengan cepat — maksimal 1–2 hari kerja.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
            {/* Detail kontak resmi */}
            <section
              aria-labelledby="info-heading"
              className="border border-white/10 rounded-xl p-6 bg-white/[0.02]"
            >
              <h2
                id="info-heading"
                className="text-lg font-bold text-white mb-5"
              >
                Saluran Resmi
              </h2>
              <ul className="flex flex-col gap-4 text-sm leading-relaxed">
                <li>
                  <span className={labelCls}>WhatsApp Kemitraan</span>
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-white transition-colors font-semibold"
                  >
                    WhatsApp: +62 851-3497-7073
                  </a>
                </li>
                <li>
                  <span className={labelCls}>Surel Redaksi</span>
                  <a
                    href="mailto:redaksi@gentanusa.id"
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    redaksi@gentanusa.id
                  </a>
                </li>
                <li>
                  <span className={labelCls}>Bisnis / Iklan</span>
                  <a
                    href="mailto:bisnis@gentanusa.id"
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    bisnis@gentanusa.id
                  </a>
                </li>
                <li>
                  <span className={labelCls}>Alamat</span>
                  <span className="text-neutral-200 not-italic">
                    Jakarta, Indonesia
                  </span>
                </li>
              </ul>

              <div className="h-px bg-white/10 my-6" />

              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-3">
                Media Sosial Resmi
              </h3>
              <ul className="flex flex-col gap-2 text-sm">
                <li>
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-white transition-colors"
                  >
                    WhatsApp (+62 851-3497-7073)
                  </a>
                </li>
                <li>
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-white transition-colors"
                  >
                    @gentanusa_id
                  </a>
                </li>
              </ul>

              <div className="h-px bg-white/10 my-6" />

              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-3">
                Landasan Hukum Aduan
              </h3>
              <p className="text-[13px] leading-relaxed text-neutral-300">
                Aduan jurnalistik diproses sesuai{" "}
                <strong className="text-white">
                  UU Pers No. 40 Tahun 1999
                </strong>
                , <strong className="text-white">Kode Etik Jurnalistik</strong>,
                dan{" "}
                <strong className="text-white">
                  Pedoman Media Siber Dewan Pers
                </strong>
                . Hak jawab dipenuhi dalam 1×24 jam setelah pengajuan lengkap
                diterima.
              </p>
            </section>

            {/* Formulir */}
            <section aria-labelledby="form-heading">
              <h2
                id="form-heading"
                className="text-xl font-bold text-white mb-5"
              >
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

              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                <div>
                  <label htmlFor="name" className={labelCls}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nama lengkap Anda"
                    className={inputCls}
                    required
                    autoComplete="name"
                    disabled={status === "submitting"}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelCls}>
                    Alamat Surel *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nama@domain.com"
                    className={inputCls}
                    required
                    autoComplete="email"
                    disabled={status === "submitting"}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className={labelCls}>
                    Kategori *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className={`${inputCls} cursor-pointer`}
                    required
                    disabled={status === "submitting"}
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
                    Isi Pesan *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tulis pesan Anda di sini... (minimal 20 karakter)"
                    className={`${inputCls} resize-y min-h-[140px] leading-relaxed`}
                    rows={6}
                    required
                    minLength={20}
                    disabled={status === "submitting"}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Mengirim..." : "Kirim Pesan"}
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
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
