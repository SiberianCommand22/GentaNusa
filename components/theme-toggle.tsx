"use client";

import { useEffect, useState } from "react";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    if (dark !== null) return;
    // baca preferensi tersimpan, atau ikut sistem — sekali di awal
    const saved = localStorage.getItem("genta-theme");
    setDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, [dark]);

  useEffect(() => {
    if (dark === null) return;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("genta-theme", dark ? "dark" : "light");
  }, [dark]);

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