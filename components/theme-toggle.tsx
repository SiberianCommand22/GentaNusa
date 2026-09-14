"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import styles from "./theme-toggle.module.css";

const THEME_KEY = "genta-theme";

function getSnapshot(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getInitialClientTheme(): boolean {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
  } catch {
    // localStorage unavailable
  }
  return getSnapshot();
}

export function ThemeToggle() {
  const prefersDark = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(getInitialClientTheme);

  useEffect(() => {
    setMounted(true);
    const initial = getInitialClientTheme();
    setDark(initial);
    document.documentElement.setAttribute("data-theme", initial ? "dark" : "light");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // localStorage unavailable
    }
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
      suppressHydrationWarning
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}