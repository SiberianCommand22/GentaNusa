"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VisualEditor, blocksToHtml, htmlToBlocks, htmlToText } from "@/components/visual-editor";
import styles from "../../cms.module.css";

const CATEGORIES = ["Nasional", "Pertahanan", "Politik", "Ekonomi", "Dunia"];

// Penanda headline disimpan sebagai tag khusus (difilter dari tampilan publik).
const HEADLINE_TAG = "headline";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image: "",
  category: "Nasional",
  tags: "",
  author: "",
  image_caption: "",
  image_credit: "",
  date: new Date().toISOString().split("T")[0],
  headline: false,
};

function slugifyBase(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') ||
    "artikel"
  );
}

function splitTags(raw: string): string[] {
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

export default function NewPostPage() {
  const router = useRouter();
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
        slug: a.slug ?? "",
        excerpt: a.excerpt ?? a.lead ?? "",
        content: blocksToHtml(Array.isArray(a.content) ? a.content : [String(a.content ?? "")]),
        image: a.image ?? a.cover_image ?? "",
        category: a.category ?? "Nasional",
        tags: tags.filter((t) => t !== HEADLINE_TAG).join(", "),
        author: a.author ?? "",
        image_caption: a.image_caption ?? "",
        image_credit: a.image_credit ?? "",
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

  // Unggah sampul via endpoint dedikasi /api/upload (multipart kecil —
  // tanpa Base64 di JSON). Mengembalikan URL proksi /media/... .
  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return form.image || null;
    const fd = new FormData();
    fd.append("file", imageFile);
    let r: Response;
    try {
      r = await fetch("/api/upload", { method: "POST", body: fd });
    } catch {
      setImgErr("Server tidak terjangkau saat mengunggah foto — periksa koneksi lalu coba lagi.");
      return null;
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) {
      setImgErr(typeof j.error === "string" && j.error ? j.error : `Gagal mengunggah foto (kode ${r.status})`);
      return null;
    }
    return j.url as string;
  }

  async function save(status: "draft" | "published") {
    setMsg("");
    setImgErr("");
    const title = form.title.trim();
    // Konten visual → blok DB yang bersih (satu string per elemen blok).
    const paras = htmlToBlocks(form.content);
    const plainText = htmlToText(form.content);
    // Ringkasan/lead: isi otomatis dari 150 karakter pertama konten bila kosong.
    const lead = form.excerpt.trim() || plainText.slice(0, 150);
    // BARU: slug unik dari judul + timestamp. EDIT: PERTAHANKAN slug lama —
    // jangan regenerasi agar URL publik tidak rusak / tidak kena unique conflict.
    const slug = editId
      ? form.slug.trim() || slugifyBase(title)
      : `${slugifyBase(title)}-${Date.now()}`;
    if (!title) {
      setMsg("Judul wajib diisi.");
      return;
    }
    if (paras.length === 0) {
      setMsg("Konten wajib diisi.");
      return;
    }
    if (status === "published" && (lead.length < 20 || lead.length > 600)) {
      setMsg("Kutipan/lead harus 20–600 karakter untuk publikasi.");
      return;
    }
    setBusy(true);
    try {
      const uploadedPath = await uploadImage();
      if (imageFile && !uploadedPath) {
        setBusy(false);
        return;
      }
      const tags = splitTags(form.tags).filter((t) => t !== HEADLINE_TAG);
      if (form.headline) tags.unshift(HEADLINE_TAG);
      const imagePath = uploadedPath || "/images/placeholder-article.svg";
      const payload = {
        title,
        slug,
        excerpt: lead,
        lead,
        content: paras,
        image: imagePath,
        cover_image: imagePath,
        image_caption: form.image_caption.trim(),
        image_credit: form.image_credit.trim(),
        category: form.category,
        author: form.author.trim() || "Redaksi GentaNusa",
        date: form.date || new Date().toISOString().split("T")[0],
        status,
        tags,
      };
      // Path relatif — tanpa CORS. PUT untuk edit, POST untuk baru.
      const targetUrl = editId ? `/api/articles/${editId}` : "/api/articles";
      const method = editId ? "PUT" : "POST";
      let r: Response;
      try {
        r = await fetch(targetUrl, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        setBusy(false);
        setMsg("Server tidak terjangkau — periksa koneksi / dev server lalu coba lagi.");
        return;
      }
      setBusy(false);
      if (r.ok || r.status === 201) {
        setMsg(editId ? "Berita berhasil diperbarui." : "Berita berhasil diterbitkan.");
        window.setTimeout(() => router.push("/admin/posts"), 600);
      } else {
        const j = await r.json().catch(() => ({}));
        const detail = typeof j.error === "string" && j.error ? j.error : `kode ${r.status}`;
        setMsg(`Gagal menyimpan artikel: ${detail}`);
      }
    } catch (e) {
      setBusy(false);
      setMsg(`Gagal menyimpan artikel: ${e instanceof Error ? e.message : "kesalahan tak terduga"}`);
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
                style={{ textAlign: "justify" }}
              />
              <p className={styles.help} style={{ textAlign: "right" }}>{form.excerpt.trim().length}/600 karakter</p>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="content">
                Konten Artikel
              </label>
              <VisualEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                placeholder="Tulis isi berita di sini — tebal, miring, dan perataan langsung terlihat…"
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
            <div className={styles.captionGrid}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="image_caption">Keterangan Gambar / Caption</label>
                <input
                  id="image_caption"
                  name="image_caption"
                  className={styles.input}
                  value={form.image_caption}
                  onChange={(e) => setForm({ ...form, image_caption: e.target.value })}
                  placeholder="Contoh: Suasana sidang paripurna di Gedung DPR RI..."
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="image_credit">Kredit Sumber / Fotografer</label>
                <input
                  id="image_credit"
                  name="image_credit"
                  className={styles.input}
                  value={form.image_credit}
                  onChange={(e) => setForm({ ...form, image_credit: e.target.value })}
                  placeholder="Contoh: Antara Foto / Hafidz Mubarak"
                />
              </div>
            </div>
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
              {msg && <p className={styles.err}>{msg}</p>}
              <button className={styles.btnSecondary} disabled={busy} onClick={() => save("draft")}>
                {busy ? "Menyimpan…" : "Simpan Draft"}
              </button>
              <button className={styles.btnPrimary} disabled={busy} onClick={() => save("published")}>
                {busy ? "Memublikasikan..." : editId ? "Simpan Perubahan" : "Publikasikan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
