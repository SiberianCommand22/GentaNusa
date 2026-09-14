"use client";

import { useState } from "react";
import styles from "./newsletter.module.css";

export function NewsletterBox({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done" | "error" | "sending">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (res.ok) {
        setStatus("done");
        setEmail("");
      } else {
        setStatus("error");
      }
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
          disabled={status === "sending"}
        />
        <button type="submit" className={styles.button} disabled={status === "sending"}>
          {status === "sending" ? "Menyimpan…" : "Berlangganan"}
        </button>
      </form>
      {status === "error" && (
        <p className={styles.error}>Terjadi kesalahan. Coba lagi nanti.</p>
      )}
    </div>
  );
}