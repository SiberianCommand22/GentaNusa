"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../cms.module.css";

type Row = {
  id: number;
  slug?: string;
  title: string;
  category: string;
  author: string;
  author_slug?: string;
  date: string;
  image?: string | null;
  status?: string;
};

type Filter = "all" | "published" | "draft";

type Session = {
  isAdmin: boolean;
  displayName: string | null;
  authorSlug: string | null;
};

const DELETE_FORBIDDEN = "Hanya Administrator Utama yang berhak menghapus berita.";

function isDraftRow(r: Row): boolean {
  if (r.status === "draft") return true;
  // Kompatibilitas baris staging lawas (prefix author_slug staging-).
  if (typeof r.author_slug === "string" && r.author_slug.startsWith("staging-")) return true;
  return false;
}

export default function ManagePostsPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [session, setSession] = useState<Session | null>(null);

  // Peran dihitung dari SESI SERVER (/api/admin/check memverifikasi ulang ke
  // Supabase Auth), bukan dari kondisi UI — tombol Hapus hanya muncul bila
  // isAdmin === true.
  useEffect(() => {
    fetch("/api/admin/check")
      .then(async (r) => {
        if (!r.ok) return null;
        const j = await r.json().catch(() => ({}));
        return {
          isAdmin: Boolean(j.is_admin),
          displayName: typeof j.display_name === "string" ? j.display_name : null,
          authorSlug: typeof j.author_slug === "string" ? j.author_slug : null,
        } satisfies Session;
      })
      .then((s) => {
        if (s) setSession(s);
      })
      .catch(() => {
        // biarkan null — UI akan menjalankan mode paling ketat (tanpa hapus)
      });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // `scope=mine` = Administrator melihat semua baris; penulis biasa hanya
      // baris miliknya (filter kepemilikan ditegakkan di server).
      const rows: Row[] = await fetch("/api/articles?scope=mine").then((r) =>
        r.ok ? r.json() : []
      );
      setArticles(Array.isArray(rows) ? rows : []);
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
      setMsg("Artikel dihapus permanen.");
    } else {
      const j = await r.json().catch(() => ({}));
      const detail = typeof j.error === "string" && j.error ? j.error : `kode ${r.status}`;
      setMsg(r.status === 403 ? DELETE_FORBIDDEN : `Gagal menghapus: ${detail}`);
    }
  }

  const visible = articles.filter((a) => {
    if (filter === "published") return !isDraftRow(a);
    if (filter === "draft") return isDraftRow(a);
    return true;
  });

  const isAdmin = session?.isAdmin === true;
  const isAuthorMode = session !== null && !session.isAdmin;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageHeading}>Kelola Berita ({articles.length})</h2>
          <p className={styles.pageSub}>
            {isAdmin
              ? "Mode Administrator — seluruh berita redaksi terlihat, termasuk hak hapus."
              : "Kelola berita Anda sendiri. Berita penulis lain tidak ditampilkan."}
          </p>
        </div>
        <Link href="/admin/posts/new" className={styles.primaryBtn}>
          + Tulis Berita Baru
        </Link>
      </div>

      {isAuthorMode && (
        <div className={styles.infoBanner} role="status">
          Mode Penulis{session?.displayName ? ` — ${session.displayName}` : ""}. Anda hanya
          melihat dan menyunting berita milik Anda sendiri; tombol hapus tidak tersedia
          untuk peran ini.
        </div>
      )}

      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.filterRow} role="group" aria-label="Filter status berita">
        {(["all", "published", "draft"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Semua" : f === "published" ? "Published" : "Draft"}
          </button>
        ))}
      </div>

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
              {visible.map((a) => {
                const draft = isDraftRow(a);
                return (
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
                    <td className={styles.cellNarrow}>{a.category}</td>
                    <td className={styles.cellAuthor}>{a.author}</td>
                    <td className={styles.cellNarrow}>{a.date}</td>
                    <td className={styles.cellNarrow}>
                      {draft ? (
                        <span className={`${styles.badge} ${styles.badgeAmber}`}>Draft</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeGreen}`}>Published</span>
                      )}
                    </td>
                    <td className={styles.cellCenter}>
                      <div className={styles.rowActions}>
                        {!draft ? (
                          <Link
                            className={styles.iconBtn}
                            title="Lihat artikel publik"
                            aria-label={`Lihat ${a.title}`}
                            href={`/${a.slug || a.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Link>
                        ) : (
                          <button
                            className={styles.iconBtn}
                            title="Pratinjau draf (belum publik) — buka editor"
                            aria-label={`Pratinjau draf ${a.title}`}
                            onClick={() => router.push(`/admin/posts/edit/${a.id}`)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        )}
                        <button
                          className={styles.iconBtn}
                          title="Edit"
                          aria-label={`Edit ${a.title}`}
                          onClick={() => router.push(`/admin/posts/edit/${a.id}`)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                          </svg>
                        </button>
                        {/* Pilar 4 — HAK EKSKLUSIF ADMINISTRATOR.
                            Penulis biasa tidak melihat tombol ini sama sekali;
                            backend juga menolak dengan 403 bila dipaksakan. */}
                        {isAdmin && (
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
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && visible.length === 0 && (
            <p className={styles.emptyNote}>
              {articles.length === 0
                ? "Belum ada berita yang Anda tulis. Klik 'Tulis Berita Baru' untuk memulai."
                : "Tidak ada berita pada filter ini."}
            </p>
          )}
          {loading && <p className={styles.emptyNote}>Memuat...</p>}
        </div>
      </div>
    </div>
  );
}