"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "./cms.module.css";

type Article = {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  author_slug?: string;
  status?: string;
};

function isDraftRow(a: Article): boolean {
  if (a.status === "draft") return true;
  if (typeof a.author_slug === "string" && a.author_slug.startsWith("staging-")) return true;
  return false;
}

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all: Article[] = await fetch("/api/articles?scope=all").then((r) =>
        r.ok ? r.json() : []
      );
      const list = Array.isArray(all) ? all : [];
      setDrafts(list.filter(isDraftRow));
      setArticles(list.filter((a) => !isDraftRow(a)));
    } catch {
      // biarkan metrik nol — dashboard tetap tampil
    } finally {
      setLoading(false);
    }
  }, []);

  // Pemuatan awal didefer agar tidak setState sinkron di body effect.
  useEffect(() => {
    const t = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const published = articles.length;
  const draftCount = drafts.length;
  const total = published + draftCount;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageHeading}>Dashboard GentaNusa</h2>
          <p className={styles.pageSub}>Selamat datang di ruang kerja redaksi GentaNusa.</p>
        </div>
        <Link href="/admin/posts/new" className={styles.primaryBtn}>
          + Tulis Berita Baru
        </Link>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Total Berita</p>
          <p className={`${styles.metricValue} ${styles.metricAccent}`}>
            {loading ? "…" : total}
          </p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Draft</p>
          <p className={`${styles.metricValue} ${styles.metricAmber}`}>
            {loading ? "…" : draftCount}
          </p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Published</p>
          <p className={`${styles.metricValue} ${styles.metricGreen}`}>
            {loading ? "…" : published}
          </p>
        </div>
      </div>
    </div>
  );
}
