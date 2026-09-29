"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import styles from "./admin.module.css";

type Article = {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  content: string[] | string;
  image: string | null;
  tags: string[] | string;
  author: string;
  author_slug: string | null;
  author_role: string | null;
  date: string;
};

type Category = { slug: string; name: string; color: string };
type Source = { id: string; name: string; url: string; category: string | null; color: string | null; notice: string | null };
type AnalyticsReport = {
  totalSiteViews: number;
  totalArticleViews: number;
  truncated: boolean;
  updatedAt: string;
  articles: Array<{ id: number; title: string; date: string; reads: number }>;
};

const emptyForm = {
  title: "",
  category: "Nasional",
  excerpt: "",
  content: "",
  image: "",
  tags: "",
  author: "Redaksi",
  date: "",
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"artikel" | "kategori" | "sumber" | "statistik">("artikel");
  const [newCat, setNewCat] = useState({ slug: "", name: "", color: "#c8102e" });
  const [newSrc, setNewSrc] = useState({ id: "", name: "", url: "", category: "", color: "#666666" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [analyticsReport, setAnalyticsReport] = useState<AnalyticsReport | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const load = useCallback(async () => {
    const [a, c, s] = await Promise.all([
      fetch("/api/articles").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/sources").then((r) => r.json()),
    ]);
    setArticles(Array.isArray(a) ? a : []);
    setCategories(Array.isArray(c) ? c : []);
    setSources(Array.isArray(s) ? s : []);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    fetch("/api/admin/check").then((r) => {
      if (r.ok) {
        setAuthed(true);
        load();
      } else {
        window.location.href = "/admin/login";
      }
    });
  }, [load]);

  async function saveArticle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setImageError("");

    let imagePath = form.image;
    if (imageFile) {
      setImageUploading(true);
      const formData = new FormData();
      formData.append("image", imageFile);
      const upload = await fetch("/api/articles/upload", {
        method: "POST",
        body: formData,
      });
      const uploadBody = await upload.json().catch(() => ({}));
      setImageUploading(false);
      if (!upload.ok || !uploadBody.path) {
        setImageError(uploadBody.error || "Gagal menyimpan foto");
        setBusy(false);
        return;
      }
      imagePath = uploadBody.path;
      setForm((current) => ({ ...current, image: imagePath }));
    }

    const payload = {
      ...form,
      image: imagePath || null,
      content: form.content.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const r = editingId
      ? await fetch(`/api/articles/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingId }),
        })
      : await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setBusy(false);
    if (r.ok) {
      setMsg(editingId ? "Artikel diperbarui ✅" : "Artikel ditambahkan ✅");
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      setEditingId(null);
      load();
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg("Gagal: " + (j.error || r.status));
    }
  }

  function editArticle(a: Article) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      category: a.category,
      excerpt: a.excerpt,
      content: Array.isArray(a.content) ? a.content.join("\n") : a.content,
      image: a.image || "",
      tags: (typeof a.tags === "string" ? JSON.parse(a.tags || "[]") : a.tags || []).join(", "),
      author: a.author,
      date: a.date,
    });
    setTab("artikel");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function delArticle(id: number) {
    if (!confirm("Hapus artikel ini?")) return;
    const r = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (r.ok) {
      setMsg("Artikel dihapus 🗑️");
      // Mutasi lokal realtime — counter tab "Artikel (X)" langsung berkurang
      setArticles((prev) => prev.filter((item) => item.id !== id));
      load();
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg("Gagal menghapus: " + (j.error || r.status));
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    if (r.ok) {
      setNewCat({ slug: "", name: "", color: "#c8102e" });
      load();
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg("Gagal kategori: " + (j.error || r.status));
    }
  }

  async function delCategory(slug: string) {
    if (!confirm(`Hapus kategori ${slug}?`)) return;
    const r = await fetch(`/api/categories?slug=${slug}`, { method: "DELETE" });
    if (r.ok) load();
  }

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSrc),
    });
    if (r.ok) {
      setNewSrc({ id: "", name: "", url: "", category: "", color: "#666666" });
      load();
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg("Gagal sumber: " + (j.error || r.status));
    }
  }

  async function delSource(id: string) {
    if (!confirm(`Hapus sumber ${id}?`)) return;
    const r = await fetch(`/api/sources?id=${id}`, { method: "DELETE" });
    if (r.ok) load();
  }

  async function logout() {
    await fetch("/api/admin/logout");
    setAuthed(false);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const r = await fetch("/api/analytics/report");
      if (r.ok) {
        const data = await r.json();
        setAnalyticsReport(data);
      }
    } catch (e) {
      console.error("[admin] load analytics:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "statistik") {
      requestAnimationFrame(() => loadAnalytics());
    }
  }, [tab]);

  if (!authed) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <h1>📰 Admin GentaNusa</h1>
        <div>
          <button className={styles.tab} onClick={() => setTab("artikel")} data-active={tab === "artikel"}>Artikel ({articles.length})</button>
          <button className={styles.tab} onClick={() => setTab("kategori")} data-active={tab === "kategori"}>Kategori</button>
          <button className={styles.tab} onClick={() => setTab("sumber")} data-active={tab === "sumber"}>Sumber RSS</button>
          <button className={styles.tab} onClick={() => setTab("statistik")} data-active={tab === "statistik"}>📊 Statistik</button>
          <button className={styles.tab} onClick={logout}>Logout</button>
        </div>
      </div>
      {msg && <p className={styles.msg}>{msg}</p>}

      {tab === "artikel" && (
        <>
          <form onSubmit={saveArticle} className={styles.form}>
            <h2>{editingId ? `✏️ Edit Artikel #${editingId}` : "➕ Artikel Baru"}</h2>
            {editingId && (
              <button type="button" className={styles.cancel} onClick={() => { setEditingId(null); setForm(emptyForm); }}>Batal edit</button>
            )}
            <label>Judul
              <input className={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <div className={styles.row}>
              <label>Kategori
                <select className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
                </select>
              </label>
              <label>Tanggal (ISO)
                <input className={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
            </div>
            <label>Ringkasan
              <input className={styles.input} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </label>
            <label>Isi Artikel (1 paragraf per baris)
              <textarea className={styles.textarea} rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required placeholder={"Paragraf 1\nParagraf 2\n…"} />
            </label>
            <div className={styles.row}>
              <label>Penulis
                <input className={styles.input} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </label>
              <label>Tags (pisah koma)
                <input className={styles.input} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Politik, Ekonomi" />
              </label>
            </div>
            <label>Gambar (opsional)
              <input
                className={styles.input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setImageFile(file);
                  setImagePreview(file ? URL.createObjectURL(file) : null);
                  setImageError("");
                  if (!file) setForm((current) => ({ ...current, image: "" }));
                  e.target.value = "";
                }}
              />
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Pratinjau foto"
                  className={styles.imagePreview}
                  width={640}
                  height={360}
                  unoptimized
                />
              )}
              {imageError && <p className={styles.err}>{imageError}</p>}
              <small className={styles.help}>JPG, PNG, atau WebP. Maksimal 5 MB.</small>
            </label>
            <button className={styles.btn} disabled={busy || imageUploading}>
              {busy ? "Menyimpan…" : imageUploading ? "Mengunggah foto…" : editingId ? "Simpan Perubahan" : "Tambahkan Artikel"}
            </button>
          </form>

          <div className={styles.list}>
            {articles.map((a) => (
              <div key={a.id} className={styles.item}>
                <div>
                  <strong>{a.title}</strong>
                  <span className={styles.itemMeta}>{a.category} • {a.date} • {a.author}</span>
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.mini} onClick={() => editArticle(a)}>✏️ Edit</button>
                  <button className={styles.miniDanger} onClick={() => delArticle(a.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "kategori" && (
        <form onSubmit={addCategory} className={styles.form}>
          <h2>➕ Kategori Baru</h2>
          <div className={styles.row}>
            <label>Slug
              <input className={styles.input} value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} placeholder="hiburan" required />
            </label>
            <label>Nama
              <input className={styles.input} value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="Hiburan" required />
            </label>
            <label>Warna
              <input className={styles.input} type="color" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} />
            </label>
          </div>
          <button className={styles.btn}>Tambah Kategori</button>
          <div className={styles.list}>
            {categories.map((c) => (
              <div key={c.slug} className={styles.item}>
                <div>
                  <span className={styles.dot} style={{ background: c.color }} />
                  <strong>{c.name}</strong> <span className={styles.itemMeta}>(/kategori/{c.slug})</span>
                </div>
                <button className={styles.miniDanger} onClick={() => delCategory(c.slug)}>🗑️</button>
              </div>
            ))}
          </div>
        </form>
      )}

      {tab === "sumber" && (
        <form onSubmit={addSource} className={styles.form}>
          <h2>➕ Sumber RSS Baru</h2>
          <div className={styles.row}>
            <label>ID
              <input className={styles.input} value={newSrc.id} onChange={(e) => setNewSrc({ ...newSrc, id: e.target.value })} placeholder="antara-ekonomi" required />
            </label>
            <label>Nama
              <input className={styles.input} value={newSrc.name} onChange={(e) => setNewSrc({ ...newSrc, name: e.target.value })} placeholder="Antara Ekonomi" required />
            </label>
          </div>
          <label>URL RSS
            <input className={styles.input} value={newSrc.url} onChange={(e) => setNewSrc({ ...newSrc, url: e.target.value })} placeholder="https://…/rss" required />
          </label>
          <div className={styles.row}>
            <label>Kategori
              <input className={styles.input} value={newSrc.category} onChange={(e) => setNewSrc({ ...newSrc, category: e.target.value })} placeholder="Ekonomi" />
            </label>
            <label>Warna
              <input className={styles.input} type="color" value={newSrc.color} onChange={(e) => setNewSrc({ ...newSrc, color: e.target.value })} />
            </label>
          </div>
          <button className={styles.btn}>Tambah Sumber</button>
          <div className={styles.list}>
            {sources.map((s) => (
              <div key={s.id} className={styles.item}>
                <div>
                  <strong>{s.name}</strong>
                  <span className={styles.itemMeta}>{s.url}</span>
                </div>
                <button className={styles.miniDanger} onClick={() => delSource(s.id)}>🗑️</button>
              </div>
            ))}
          </div>
        </form>
      )}

      {tab === "statistik" && (
        <div className={styles.form}>
          <h2>📊 Statistik Akses</h2>
          {analyticsLoading ? (
            <p style={{ color: "var(--muted, #4a4a5a)" }}>Memuat statistik…</p>
          ) : analyticsReport ? (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <button
                  className={styles.mini}
                  onClick={() => {
                    window.location.href = "/api/analytics/export";
                  }}
                >
                  📥 Export CSV
                </button>
              </div>
              <div className={styles.list}>
                <div className={styles.item}>
                  <div>
                    <strong>Total Akses Website</strong>
                    <span className={styles.itemMeta}>
                      {analyticsReport.totalSiteViews.toLocaleString("id-ID")} page view
                    </span>
                  </div>
                </div>
                <div className={styles.item}>
                  <div>
                    <strong>Total Baca Artikel</strong>
                    <span className={styles.itemMeta}>
                      {analyticsReport.totalArticleViews.toLocaleString("id-ID")} page view
                    </span>
                  </div>
                </div>
                <div className={styles.item}>
                  <div>
                    <strong>Terakhir diupdate</strong>
                    <span className={styles.itemMeta}>
                      {new Date(analyticsReport.updatedAt).toLocaleString("id-ID")}
                      {analyticsReport.truncated && " (data terpotong)"}
                    </span>
                  </div>
                </div>
              </div>
              <h3 style={{ marginTop: "1.5rem", marginBottom: "0.8rem" }}>Artikel Paling Dibaca</h3>
              {analyticsReport.articles.length === 0 ? (
                <p style={{ color: "var(--muted, #4a4a5a)" }}>Belum ada data baca artikel.</p>
              ) : (
                <div className={styles.list}>
                  {analyticsReport.articles.map((a) => (
                    <div key={a.id} className={styles.item}>
                      <div>
                        <strong>{a.title}</strong>
                        <span className={styles.itemMeta}>
                          {a.date} • {a.reads.toLocaleString("id-ID")} kali dibaca
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: "var(--muted, #4a4a5a)" }}>Belum ada data statistik. Data mulai dihitung setelah tracker aktif.</p>
          )}
        </div>
      )}
    </div>
  );
}