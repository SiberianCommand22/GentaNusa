"use client";

import { useEffect, useState } from "react";
import styles from "./theme-toggle.module.css";

function getInitialTheme(): boolean {
  // Baca pilihan tersimpan SEKALI di awal render (tahan navigasi antar halaman)
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem("genta-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function ThemeToggle() {
  const [dark, setDark] = useState(getInitialTheme);

  // Sinkronkan tema ke DOM + simpan pilihan
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("genta-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      className={styles.toggle}
      onClick={() => setDark(!dark)}
      aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
      suppressHydrationWarning
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}