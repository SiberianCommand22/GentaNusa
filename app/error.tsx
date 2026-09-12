"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GentaNusa error:", error);
  }, [error]);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <span className={styles.badge}>Terjadi Kesalahan</span>
        <h1 className={styles.title}>Halaman tidak dapat dimuat</h1>
        <p className={styles.message}>
          Ada masalah teknis saat memuat halaman ini. Silakan coba lagi.
        </p>
        <div className={styles.actions}>
          <button onClick={() => reset()} className={styles.retry}>
            Coba Lagi
          </button>
          <Link href="/" className={styles.home}>
            Kembali ke Beranda
          </Link>
        </div>
        {error.digest && (
          <p className={styles.digest}>Kode error: {error.digest}</p>
        )}
      </div>
    </main>
  );
}