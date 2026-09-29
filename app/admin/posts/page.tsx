"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../../cms.module.css";

type Row = {
  id: number;
  title: string;
  category: string;
  author: string;
  date: string;
  image?: string | null;
  isDraft?: boolean;
};

export default function ManagePostsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([
        fetch("/api/articles").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/articles?scope=draft").then((r) => (r.ok ? r.json() : [])),
      ]);
      const pub: Row[] = (Array.isArray(a) ? a : []).map((x: Row) => ({ ...x, isDraft: false }));
      const drafts: Row[] = (Array.isArray(d) ? d : []).map((x: Row) => ({ ...x, isDraft: true }));
      setArticles([...drafts, ...pub]);
    } catch {
      // tabel tetap tampil kosong
    } finally {
      setLoading(false);
    }
  }, []);

  // Pemuatan awal didefer agar tidak setState sinkron di body effect.
  useEffect(() => {
    const t = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  async function delArticle(id: number, title: string) {
    if (!confirm(`Hapus permanen "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setMsg("");
    const r = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (r.ok) {
      // Realtime: langsung hilang dari tabel tanpa menunggu refresh
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setMsg("Artikel dihapus permanen 🗑️");
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg("Gagal menghapus: " + (j.error || r.status));
    }
  }

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageHeading}>Kelola Berita ({articles.length})</h2>
          <p className={styles.pageSub}>Ubah atau hapus artikel yang sudah tayang maupun draft.</p>
        </div>
        <Link href="/admin/posts/new" className={styles.primaryBtn}>
          + Tulis Berita Baru
        </Link>
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Judul</th>
                <th>Media</th>
                <th>Kategori</th>
                <th>Penulis</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td className={styles.cellTitle}>{a.title}</td>
                  <td>
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image} alt="" className={styles.thumb} loading="lazy" />
                    ) : (
                      <span className={styles.thumbEmpty} />
                    )}
                  </td>
                  <td>{a.category}</td>
                  <td>{a.author}</td>
                  <td>{a.date}</td>
                  <td>
                    {a.isDraft ? (
                      <span className={`${styles.badge} ${styles.badgeAmber}`}>Draft</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeGreen}`}>Published</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        className={styles.iconBtn}
                        title="Edit"
                        aria-label={`Edit ${a.title}`}
                        onClick={() => router.push(`/admin/posts/new?edit=${a.id}`)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                        </svg>
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Hapus permanen"
                        aria-label={`Hapus ${a.title}`}
                        onClick={() => delArticle(a.id, a.title)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && articles.length === 0 && (
            <p className={styles.emptyNote}>Belum ada berita. Mulai dengan “Tulis Berita Baru”.</p>
          )}
          {loading && <p className={styles.emptyNote}>Memuat…</p>}
        </div>
      </div>
    </div>
  );
}
