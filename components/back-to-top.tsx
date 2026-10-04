"use client";

import { useState, useEffect } from "react";
import styles from "./back-to-top.module.css";

// Tombol mengambang: fixed bottom-6 right-6, z-40 (di bawah header sticky z-50
// dan overlay drawer z-100) dengan ukuran proporsional w-10 h-10 → sm:w-11
// sm:h-11. Baris bawah footer diberi padding kanan (pr-16 / sm:pr-20) sehingga
// teks di belakangnya tidak pernah tertabrak.
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Kembali ke atas"
      className={`fixed bottom-6 right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-lg transition-colors ${styles.button}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className={styles.icon}
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </button>
  );
}

export default BackToTop;