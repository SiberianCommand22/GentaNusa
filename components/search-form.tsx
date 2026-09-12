"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./search-form.module.css";

export function SearchForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/cari?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari judul, kategori, topik..."
        className={styles.input}
        aria-label="Cari berita"
      />
      <button type="submit" className={styles.button}>
        Cari
      </button>
    </form>
  );
}