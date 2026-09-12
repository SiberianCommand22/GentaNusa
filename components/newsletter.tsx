"use client";

import { useState } from "react";
import styles from "./newsletter.module.css";

export function NewsletterBox({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setStatus("error");
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem("gn-newsletter") ?? "[]");
      existing.push({ email: value, at: new Date().toISOString() });
      localStorage.setItem("gn-newsletter", JSON.stringify(existing));
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className={`${styles.box} ${compact ? styles.compact : ""}`}>
        <p className={styles.done}>🎉 Terima kasih! Anda terdaftar di buletin GentaNusa.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.box} ${compact ? styles.compact : ""}`}>
      <h3 className={styles.title}>📬 Berlangganan Buletin GentaNusa</h3>
      <p className={styles.desc}>
        Dapatkan ringkasan berita penting setiap hari di email Anda. Gratis.
      </p>
      <form onSubmit={submit} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@contoh.com"
          className={styles.input}
          aria-label="Alamat email"
        />
        <button type="submit" className={styles.button}>
          Berlangganan
        </button>
      </form>
      {status === "error" && (
        <p className={styles.error}>Masukkan alamat email yang valid.</p>
      )}
    </div>
  );
}