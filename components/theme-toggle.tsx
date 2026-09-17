"use client";

import { useEffect, useState } from "react";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
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
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
    try {
      localStorage.setItem("genta-theme", isDark ? "dark" : "light");
    } catch {}
  }, []);

  return (
    <button
      className={styles.toggle}
      onClick={() => {
        const newDark = !dark;
        setDark(newDark);
        document.documentElement.setAttribute(
          "data-theme",
          newDark ? "dark" : "light"
        );
        try {
          localStorage.setItem("genta-theme", newDark ? "dark" : "light");
        } catch {}
      }}
      aria-label="Ganti ke mode gelap"
      title="Mode gelap"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}