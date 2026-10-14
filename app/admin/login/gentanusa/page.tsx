"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { BrandLogo } from "@/components/BrandLogo";
import styles from "../login.module.css";

/** Tolak open redirect: hanya path absolut internal yang diizinkan. */
function getSafeNext(raw: string | null): string {
  const rawNext = raw || "/admin";
  return rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
    ? rawNext
    : "/admin";
}

/**
 * Form login redaksi — RUTE PRIVAT.
 *
 * Hanya pihak yang mengetahui URL persisnya
 * (https://www.gentanusa.id/admin/login/gentanusa) yang bisa menemukan
 * halaman ini: tidak ada tautan login di navbar maupun drawer menu publik,
 * dan rute lama /admin/login sengaja disegel (notFound).
 */
function PrivateAdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Sinkronkan sesi Supabase di browser agar guard client-side di
        // /admin (bila ada) juga melihat sesi aktif — kegagalan di sini
        // tidak boleh menggagalkan login (cookie httpOnly tetap sumber utama).
        try {
          const sess = data.supabaseSession as
            | { access_token?: string; refresh_token?: string }
            | undefined;
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (sess?.access_token && sess?.refresh_token && url && anonKey) {
            const browser = createBrowserClient(url, anonKey);
            await browser.auth.setSession({
              access_token: sess.access_token,
              refresh_token: sess.refresh_token,
            });
          }
        } catch {
          // abaikan — navigasi penuh di bawah membaca cookie httpOnly
        }
        // Full reload (bukan router.push): memastikan Server Component tujuan
        // menerima cookie httpOnly yang baru ditulis pada request bersih.
        const safeNext = getSafeNext(searchParams.get("next"));
        window.location.href = safeNext;
        return;
      }
      // Tampilkan SELALU pesan error server — jangan pernah gagal diam-diam.
      setError(
        typeof data.error === "string" && data.error
          ? data.error
          : typeof data.message === "string" && data.message
            ? data.message
            : `Login gagal (kode ${res.status}).`
      );
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <BrandLogo theme="light" size="lg" href="/" />
        </div>
        <p className={styles.tagline}>CEPAT • AKURAT • TERPERCAYA</p>
        <h1 className={styles.title}>Login Redaksi</h1>
        <p className={styles.subtitle}>Ruang kerja khusus redaksi GentaNusa</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              placeholder="nama@gentanusa.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              autoComplete="username"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <Link href="/" className={styles.backLink}>
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default function PrivateAdminLoginPage() {
  return (
    <Suspense>
      <PrivateAdminLoginForm />
    </Suspense>
  );
}
