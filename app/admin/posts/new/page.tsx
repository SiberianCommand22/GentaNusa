"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../../cms.module.css";

const CATEGORIES = ["Nasional", "Politik", "Ekonomi", "Teknologi", "Olahraga", "Budaya", "Hiburan"];

// Penanda headline disimpan sebagai tag khusus (difilter dari tampilan publik).
const HEADLINE_TAG = "headline";

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  image: "",
  category: "Nasional",
  tags: "",
  author: "",
  date: new Date().toISOString().split("T")[0],
  headline: false,
};

function splitTags(raw: string): string[] {
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

export default function NewPostPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [imgErr, setImgErr] = useState("");

  // Mode edit: /admin/posts/new?edit=<id> (dibaca client-side saja)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("edit");
    if (!id) return;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;
    fetch(`/api/articles/${numId}`).then(async (r) => {
      if (!r.ok) return;
      const a = await r.json();
      const tags: string[] = Array.isArray(a.tags) ? a.tags : [];
      setEditId(numId);
      setForm({
        title: a.title ?? "",
        excerpt: a.excerpt ?? "",
        content: Array.isArray(a.content) ? a.content.join("\n") : a.content ?? "",
        image: a.image ?? "",
        category: a.category ?? "Nasional",
        tags: tags.filter((t) => t !== HEADLINE_TAG).join(", "),
        author: a.author ?? "",
        date: a.date ?? new Date().toISOString().split("T")[0],
        headline: tags.includes(HEADLINE_TAG),
      });
    });
  }, []);

  function pickFile(file: File | null) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
    setImgErr("");
    if (!file) setForm((f) => ({ ...f, image: "" }));
  }

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = contentRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    setForm((f) => ({ ...f, content: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return form.image || null;
    const fd = new FormData();
    fd.append("image", imageFile);
    const r = await fetch("/api/articles/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.path) {
      setImgErr(j.error || "Gagal mengunggah foto");
      return null;
    }
    return j.path as string;
  }

  async function save(status: "draft" | "published") {
    setMsg("");
    setImgErr("");
    const title = form.title.trim();
    const lead = form.excerpt.trim();
    const paras = form.content.split("\n").map((p) => p.trim()).filter(Boolean);
    if (!title) {
      setMsg("Judul wajib diisi.");
      return;
    }
    if (status === "published" && (lead.length < 20 || lead.length > 600)) {
      setMsg("Kutipan/lead harus 20–600 karakter untuk publikasi.");
      return;
    }
    if (paras.length === 0) {
      setMsg("Konten artikel masih kosong.");
      return;
    }
    setBusy(true);
    const imagePath = await uploadImage();
    if (imageFile && !imagePath) {
      setBusy(false);
      return;
    }
    const tags = splitTags(form.tags).filter((t) => t !== HEADLINE_TAG);
    if (form.headline) tags.unshift(HEADLINE_TAG);
    const payload = {
      title,
      category: form.category,
      excerpt: lead,
      content: paras,
      image: imagePath,
      tags,
      author: form.author.trim() || "Redaksi GentaNusa",
      date: form.date || new Date().toISOString().split("T")[0],
      status,
    };
    const r = editId
      ? await fetch(`/api/articles/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    setBusy(false);
    if (r.ok) {
      router.push("/admin/posts");
    } else {
      const j = await r.json().catch(() => ({}));
      setMsg("Gagal menyimpan: " + (j.error || r.status));
    }
  }

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageHeading}>{editId ? `Edit Berita #${editId}` : "Tulis Berita Baru"}</h2>
          <p className={styles.pageSub}>
            {editId ? "Perbarui konten, lalu simpan sebagai draft atau publikasikan." : "Susun liputan, lalu simpan sebagai draft atau langsung publikasikan."}
          </p>
        </div>
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      <div className={styles.formGrid}>
        {/* Kolom kiri — konten utama */}
        <div className={styles.formCol}>
          <div className={styles.panel}>
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <input
                className={`${styles.input} ${styles.titleInput}`}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul berita yang menarik..."
              />
            </div>
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <label className={styles.fieldLabel} htmlFor="lead">
                Kutipan / Lead (20–600 karakter)
              </label>
              <textarea
                id="lead"
                className={styles.textarea}
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Ringkasan pembuka yang memikat pembaca…"
              />
              <p className={styles.help}>{form.excerpt.trim().length}/600 karakter</p>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="content">
                Konten Artikel (1 paragraf per baris)
              </label>
              <div className={styles.toolbar} role="toolbar" aria-label="Format teks">
                <button type="button" className={styles.toolBtn} onClick={() => wrapSelection("**", "**", "teks tebal")} title="Tebal">B</button>
                <button type="button" className={styles.toolBtn} onClick={() => wrapSelection("*", "*", "teks miring")} title="Miring"><em>I</em></button>
                <button type="button" className={styles.toolBtn} onClick={() => wrapSelection("[", "](https://)", "tautan")} title="Tautan">Link</button>
              </div>
              <textarea
                id="content"
                ref={contentRef}
                className={styles.textarea}
                rows={14}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder={"Paragraf 1\nParagraf 2\n…"}
              />
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Foto Sampul</h3>
            <input
              ref={fileRef}
              className={styles.dropzoneInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                pickFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            {!imagePreview && !form.image ? (
              <div
                className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""}`}
                role="button"
                tabIndex={0}
                aria-label="Unggah foto sampul"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  pickFile(e.dataTransfer.files?.[0] ?? null);
                }}
              >
                <span className={styles.dropzoneIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </span>
                <p className={styles.dropzoneText}>Seret dan lepas foto sampul di sini, atau klik untuk memilih</p>
                <p className={styles.dropzoneHint}>JPG, PNG, WebP maks 5MB</p>
              </div>
            ) : (
              <div>
                <Image
                  src={imagePreview || form.image}
                  alt="Pratinjau foto sampul"
                  width={640}
                  height={360}
                  unoptimized
                  className={styles.previewImg}
                />
                <div style={{ marginTop: 12 }}>
                  <button type="button" className={styles.btnSecondary} onClick={() => fileRef.current?.click()}>
                    Ganti Foto
                  </button>
                </div>
              </div>
            )}
            {imgErr && <p className={styles.err}>{imgErr}</p>}
          </div>
        </div>

        {/* Kolom kanan — workflow & taksonomi */}
        <div className={styles.formCol}>
          <div className={styles.panel}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.checked })}
              />
              Jadikan Headline / Prioritas
            </label>
          </div>

          <div className={styles.panel}>
            <div className={styles.field} style={{ marginBottom: 12 }}>
              <label className={styles.fieldLabel} htmlFor="pubdate">Tanggal Tayang</label>
              <input
                id="pubdate"
                className={styles.input}
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className={styles.field} style={{ marginBottom: 12 }}>
              <label className={styles.fieldLabel} htmlFor="cat">Kategori</label>
              <select
                id="cat"
                className={styles.select}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className={styles.field} style={{ marginBottom: 12 }}>
              <label className={styles.fieldLabel} htmlFor="tags">Tag / Topik</label>
              <input
                id="tags"
                className={styles.input}
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Politik, Ekonomi"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="author">Penulis / Editor</label>
              <input
                id="author"
                className={styles.input}
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Redaksi GentaNusa"
              />
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.actions}>
              <button className={styles.btnSecondary} disabled={busy} onClick={() => save("draft")}>
                {busy ? "Menyimpan…" : "Simpan Draft"}
              </button>
              <button className={styles.btnPrimary} disabled={busy} onClick={() => save("published")}>
                {busy ? "Menyimpan…" : editId ? "Perbarui & Publikasikan" : "Publikasikan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
