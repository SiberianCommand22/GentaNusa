"use client";

import { useState } from "react";
import { Footer } from "@/components/site";
import styles from "./kontak.module.css";

const SUBJECTS = [
  { value: "redaksi", label: "Redaksi & Pengiriman Naskah Opini" },
  { value: "iklan", label: "Iklan, Kemitraan & Media Partner" },
  { value: "aduan", label: "Aduan Jurnalistik & Hak Jawab" },
  { value: "privasi", label: "Privasi & Perlindungan Data Pribadi" },
  { value: "lainnya", label: "Lainnya" },
];

export default function KontakPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "redaksi",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <a href="/">Beranda</a>
          <span aria-hidden="true"> {" > "} </span>
          <span aria-current="page">Kontak</span>
        </nav>

        <header className={styles.header}>
          <h1 className={styles.title}>Kontak & Hubungi Kami</h1>
          <p className={styles.lead}>
            Kami terbuka untuk masukan, pertanyaan, aduan jurnalistik, dan kerja sama.
            Pilih kategori yang paling sesuai agar kami dapat merespons dengan cepat.
          </p>
        </header>

        <div className={styles.grid}>
          <section className={styles.infoCard} aria-labelledby="info-heading">
            <h2 id="info-heading" className={styles.infoTitle}>Saluran Resmi</h2>
            <ul className={styles.infoList}>
              <li>
                <strong>Redaksi & Naskah Opini:</strong>
                <a href="mailto:redaksi@gentanusa.id">redaksi@gentanusa.id</a>
              </li>
              <li>
                <strong>Iklan, Kemitraan & Media Partner:</strong>
                <a href="mailto:bisnis@gentanusa.id">bisnis@gentanusa.id</a>
              </li>
              <li>
                <strong>Aduan Jurnalistik & Hak Jawab:</strong>
                <a href="mailto:aduan@gentanusa.id">aduan@gentanusa.id</a>
              </li>
              <li>
                <strong>Privasi & Perlindungan Data:</strong>
                <a href="mailto:privasi@gentanusa.id">privasi@gentanusa.id</a>
              </li>
            </ul>

            <div className={styles.divider} />

            <h3 className={styles.infoSubtitle}>Alamat Kantor</h3>
            <address className={styles.address}>
              GentaNusa — Jakarta, Indonesia
            </address>

            <div className={styles.divider} />

            <h3 className={styles.infoSubtitle}>Landasan Hukum Aduan</h3>
            <p className={styles.infoText}>
              Aduan jurnalistik diproses sesuai <strong>UU Pers No. 40 Tahun 1999</strong>,
              <strong>Kode Etik Jurnalistik</strong>, dan <strong>Pedoman Media Siber Dewan Pers</strong>.
              Hak jawab dipenuhi dalam 1×24 jam setelah pengajuan lengkap diterima.
            </p>
          </section>

          <section className={styles.formCard} aria-labelledby="form-heading">
            <h2 id="form-heading" className={styles.formTitle}>Kirim Pesan ke Redaksi</h2>

            {status === "success" && (
              <div className={styles.alertSuccess} role="status">
                ✅ Pesan Anda telah terkirim. Tim redaksi akan merespons dalam 1–2 hari kerja.
              </div>
            )}

            {status === "error" && (
              <div className={styles.alertError} role="alert">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>
                  Nama Lengkap <span aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nama lengkap Anda"
                  className={styles.input}
                  required
                  autoComplete="name"
                  disabled={status === "submitting"}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>
                  Alamat Surel <span aria-hidden="true">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nama@domain.com"
                  className={styles.input}
                  required
                  autoComplete="email"
                  disabled={status === "submitting"}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="subject" className={styles.label}>
                  Kategori <span aria-hidden="true">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={styles.select}
                  required
                  disabled={status === "submitting"}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="message" className={styles.label}>
                  Isi Pesan <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tulis pesan Anda di sini... (minimal 20 karakter)"
                  className={styles.textarea}
                  rows={6}
                  required
                  minLength={20}
                  disabled={status === "submitting"}
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                      </path>
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  "Kirim Pesan"
                )}
              </button>
            </form>

            <p className={styles.formNote}>
              Dengan mengirim formulir ini, Anda menyetujui pengolahan data sesuai
              <a href="/kebijakan-privasi">Kebijakan Privasi GentaNusa</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}