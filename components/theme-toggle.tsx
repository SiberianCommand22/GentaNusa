"use client";

import { useEffect, useState } from "react";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Baca setelah mount (hindari SSR/localStorage mismatch)
    let isDark = false;
    try {
      const saved = localStorage.getItem("genta-theme");
      if (saved !== null) {
        isDark = saved === "dark";
      } else {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
    } catch {}

    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    try {
      localStorage.setItem("genta-theme", isDark ? "dark" : "light");
    } catch {}
  }, []);

  return (
    <button
      className={styles.toggle}
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
        try {
          localStorage.setItem("genta-theme", next ? "dark" : "light");
        } catch {}
      }}
      aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
      suppressHydrationWarning
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}