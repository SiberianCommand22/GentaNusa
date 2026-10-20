"use client";

import Link from "next/link";
import { Footer } from "@/components/site";
import styles from "./not-found.module.css";

// Client Component sadar: 404 harus tetap render walau root layout / data
// prefetch gagal (Safari mobile & jaringan lambat) — tanpa ini, kendala
// hydrasi di halaman ini bisa berujung layar kosong.

export default function NotFound() {
  return (
    <>
      <main className={styles.wrap}>
        <span className={styles.badge}>Galat 404</span>
        <h1 className={styles.title}>Halaman Tidak Ditemukan</h1>
        <p className={styles.desc}>
          Tautan yang Anda tuju tidak tersedia, telah dipindahkan, atau mengalami
          perubahan alamat. Silakan periksa kembali tautan Anda atau kembali ke
          halaman utama.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.btnPrimary}>
            Kembali ke Beranda
          </Link>
          <Link href="/kategori/nasional" className={styles.btnSecondary}>
            Lihat Berita Nasional
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
