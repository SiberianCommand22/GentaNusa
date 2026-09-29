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
};

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([
        fetch("/api/articles").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/articles?scope=draft").then((r) => (r.ok ? r.json() : [])),
      ]);
      setArticles(Array.isArray(a) ? a : []);
      setDrafts(Array.isArray(d) ? d : []);
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
