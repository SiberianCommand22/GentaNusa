"use client";

import { useEffect, useState } from "react";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Terapkan tema: sinkronisasi eksternal (DOM + penyimpanan), bukan setState
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("genta-theme", dark ? "dark" : "light");
  }, [dark]);

  // Baca preferensi awal sekali (async — anti flicker script sudah
  // men-set data-theme sebelum render, kita tinggal samakan ikonnya)
  useEffect(() => {
    const saved = localStorage.getItem("genta-theme");
    const initial = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    requestAnimationFrame(() => setDark(initial));
  }, []);

  return (
    <button
      className={styles.toggle}
      onClick={() => setDark(!dark)}
      aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}