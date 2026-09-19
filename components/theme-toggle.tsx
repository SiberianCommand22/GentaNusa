"use client";

import { useEffect, useState } from "react";
import styles from "./theme-toggle.module.css";

function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem("genta-theme");
    if (saved !== null) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function ThemeToggle() {
  const [dark, setDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem("genta-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

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