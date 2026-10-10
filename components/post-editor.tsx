"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { VisualEditor, blocksToHtml, htmlToBlocks, htmlToText } from "@/components/visual-editor";
import styles from "@/app/admin/cms.module.css";

/**
 * Editor berita GentaNusa — dipakai bersama oleh:
 *   - /admin/posts/new              (tulis baru)
 *   - /admin/posts/edit/[id]        (sunting, sudah dijaga kepemilikannya)
 *
 * Kepemilikan artikel (user_id) SELALU diteken ulang di server dari sesi
 * Supabase Auth; kolom di bawah tidak pernah dipercaya untuk itu.
 */

const CATEGORIES = ["Nasional", "Pertahanan", "Politik", "Ekonomi", "Dunia", "Peduli", "Sosial Budaya", "Kesehatan", "Olahraga", "Keamanan"];

// Penanda headline disimpan sebagai tag khusus (difilter dari tampilan publik).
const HEADLINE_TAG = "headline";

const ACCESS_DENIED_EDIT =
  "Akses Ditolak: Anda tidak memiliki izin mengedit artikel ini.";

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
  secondary_image: "",
  secondary_image_caption: "",
  secondary_image_credit: "",
  date: new Date().toISOString().split("T")[0],
  headline: false,
};

function splitTags(raw: string): string[] {
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

export function PostEditor({ editId = null }: { editId?: number | null }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [activeId, setActiveId] = useState<number | null>(editId);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(null);
  const [secondaryImagePreview, setSecondaryImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const secondaryFileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [guardMsg, setGuardMsg] = useState("");
  const [imgErr, setImgErr] = useState("");
  const [draftNotice, setDraftNotice] = useState("");
  const [hasStoredDraft, setHasStoredDraft] = useState(false);
  const [loadedEdit, setLoadedEdit] = useState(false);

  const draftKey = `gentanusa_draft_${activeId || "new"}`;

  function todayWIB(): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  }

  function writeDraftSnapshot(next: typeof emptyForm) {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          title: next.title,
          category: next.category,
          excerpt: next.excerpt,
          content: next.content,
          image: next.image,
          image_caption: next.image_caption,
          image_credit: next.image_credit,
          tags: next.tags,
          author: next.author,
          date: next.date,
          headline: next.headline,
          slug: next.slug,
          savedAt: new Date().toISOString(),
        })
      );
      setDraftNotice("Draf tersimpan di peramban ini");
    } catch {
      // storage penuh / mode privat — abaikan diam-diam
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // abaikan
    }
    setDraftNotice("");
    setHasStoredDraft(false);
  }

  function loadStoredDraft() {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      setForm((f) => ({
        ...f,
        title: d.title ?? f.title,
        category: d.category ?? f.category,
        excerpt: d.excerpt ?? f.excerpt,
        content: d.content ?? f.content,
        image: d.image ?? f.image,
        image_caption: d.image_caption ?? f.image_caption,
        image_credit: d.image_credit ?? f.image_credit,
        tags: d.tags ?? f.tags,
        author: d.author ?? f.author,
        date: d.date ?? f.date,
        headline: Boolean(d.headline),
        slug: d.slug ?? f.slug,
      }));
      setHasStoredDraft(false);
      setDraftNotice("Draf tersimpan di peramban ini");
    } catch {
      // abaikan
    }
  }

  // Auto-save halus ke localStorage (debounce 1 detik) setiap kali form berubah.
  useEffect(() => {
    if (!loadedEdit && !form.title && !form.excerpt && !form.content) return;
    const t = window.setTimeout(() => writeDraftSnapshot(form), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, draftKey, loadedEdit]);

  // Mode tulis baru: prefill byline dari display_name sesi login (bebas
  // diedit penulis — nama pena / "Tim Liputan" diperbolehkan server).
  useEffect(() => {
    if (editId) return;
    try {
      if (localStorage.getItem(draftKey)) return;
    } catch {
      // abaikan
    }
    fetch("/api/admin/check")
      .then(async (r) => {
        if (!r.ok) return;
        const j = (await r.json().catch(() => ({}))) as {
          display_name?: string;
        };
        const name = typeof j.display_name === "string" ? j.display_name.trim() : "";
        if (name) setForm((f) => (f.author.trim() ? f : { ...f, author: name }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, draftKey]);

  // Mode edit: ID datang dari route server (/admin/posts/edit/[id]) yang sudah
  // memeriksa sesi + kepemilikan. Query `?edit=` tetap didukung agar
  // bookmark lama tidak rusak.
  useEffect(() => {
    const legacyId = new URLSearchParams(window.location.search).get("edit");
    const target =
      editId ?? (legacyId && /^\d+$/.test(legacyId) ? Number(legacyId) : null);

    // Cek draf tersimpan: tawarkan "Muat Draf Tersimpan" bila form masih kosong.
    try {
      const key = `gentanusa_draft_${target || "new"}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw);
        const isEmptyForm = !emptyForm.title && !emptyForm.excerpt && !emptyForm.content;
        if (d && (d.title || d.excerpt || d.content) && isEmptyForm) {
          setHasStoredDraft(true);
        }
      }
    } catch {
      // abaikan
    }
    if (!target) {
      setLoadedEdit(true);
      return;
    }

    // `scope=edit` memaksa server menegakkan kepemilikan artikel.
    fetch(`/api/articles/${target}?scope=edit`).then(async (r) => {
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setGuardMsg(
          r.status === 403
            ? ACCESS_DENIED_EDIT
            : typeof j.error === "string" && j.error
              ? j.error
              : `Gagal memuat artikel (kode ${r.status}).`
        );
        setLoadedEdit(true);
        return;
      }
      const a = await r.json();
      // Kolom DB tersimpan sebagai string JSON — parsing defensif.
      let tags: string[] = [];
      try {
        tags = Array.isArray(a.tags) ? a.tags : JSON.parse(String(a.tags ?? "[]"));
        if (!Array.isArray(tags)) tags = [];
      } catch {
        tags = [];
      }
      let contentBlocks: string[] = [];
      try {
        contentBlocks = Array.isArray(a.content) ? a.content : JSON.parse(String(a.content ?? "[]"));
        if (!Array.isArray(contentBlocks)) contentBlocks = [String(a.content ?? "")];
      } catch {
        contentBlocks = [String(a.content ?? "")];
      }
      setActiveId(target);
      setForm({
        title: a.title ?? "",
        slug: a.slug ?? "",
        excerpt: a.excerpt ?? a.lead ?? "",
        content: blocksToHtml(contentBlocks),
        image: a.image ?? a.cover_image ?? "",
        secondary_image: a.secondary_image ?? a.optional_image ?? "",
        category: a.category ?? "Nasional",
        tags: tags.filter((t) => t !== HEADLINE_TAG).join(", "),
        author: a.author ?? "",
        image_caption: a.image_caption ?? "",
        image_credit: a.image_credit ?? "",
        secondary_image_caption:
          a.secondary_image_caption ?? a.optional_image_caption ?? "",
        secondary_image_credit:
          a.secondary_image_credit ?? a.optional_image_credit ?? "",
        date: a.date ?? todayWIB(),
        headline: tags.includes(HEADLINE_TAG),
      });
      if (a.status === "draft") {
        setOkMsg("Tersimpan sebagai draf. Berita ini tidak akan tampil di halaman depan maupun kategori sampai Anda mempublikasikannya.");
      }
      setLoadedEdit(true);
    });
  }, [editId]);

  // Prefill kolom Penulis dari sesi login (/api/admin/check terverifikasi
  // Supabase Auth) agar byline mencerminkan pengguna yang sedang login,
  // bukan teks bebas. Hanya untuk tulisan baru dengan kolom masih kosong.
  useEffect(() => {
    if (editId) return;
    let cancelled = false;
    fetch("/api/admin/check")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        const name =
          j && typeof j.display_name === "string" ? j.display_name.trim() : "";
        if (name) {
          setForm((f) => (f.author.trim() ? f : { ...f, author: name }));
        }
      })
      .catch(() => {
        // abaikan — validasi server tetap mengunci identitas penulis
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  function pickFile(file: File | null) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
    setImgErr("");
    if (!file) setForm((f) => ({ ...f, image: "" }));
  }

  function pickSecondaryFile(file: File | null) {
    if (secondaryImagePreview) URL.revokeObjectURL(secondaryImagePreview);
    setSecondaryImageFile(file);
    setSecondaryImagePreview(file ? URL.createObjectURL(file) : null);
    setImgErr("");
    if (!file) setForm((f) => ({ ...f, secondary_image: "" }));
  }

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (secondaryImagePreview) URL.revokeObjectURL(secondaryImagePreview);
    };
  }, [imagePreview, secondaryImagePreview]);

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

  // Unggah Foto 2 (Dokumentasi Kedua - Opsional)
  async function uploadSecondaryImage(): Promise<string | null> {
    if (!secondaryImageFile) return form.secondary_image || null;
    const fd = new FormData();
    fd.append("file", secondaryImageFile);
    let r: Response;
    try {
      r = await fetch("/api/upload", { method: "POST", body: fd });
    } catch {
      setImgErr("Server tidak terjangkau saat mengunggah foto kedua — periksa koneksi lalu coba lagi.");
      return null;
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) {
      setImgErr(typeof j.error === "string" && j.error ? j.error : `Gagal mengunggah foto kedua (kode ${r.status})`);
      return null;
    }
    return j.url as string;
  }

  type MissingField = { label: string; fieldId: string };

  function isPlaceholderImage(src: string): boolean {
    const s = String(src || "").trim();
    return (
      !s ||
      s.includes("/images/placeholder-article.svg") ||
      s.includes("placeholder-article")
    );
  }

  // Guard publikasi: 10 kolom wajib. Kembalikan daftar yang belum lengkap.
  function validatePublish(input: {
    title: string;
    category: string;
    excerpt: string;
    paras: string[];
    plainText: string;
    imagePath: string;
    imageCaption: string;
    imageCredit: string;
    author: string;
    tags: string[];
  }): MissingField[] {
    const missing: MissingField[] = [];
    if (input.title.trim().length < 10) {
      missing.push({ label: "Judul Berita", fieldId: "field-title" });
    }
    if (!CATEGORIES.includes(input.category)) {
      missing.push({ label: "Kategori", fieldId: "cat" });
    }
    if (!input.excerpt.trim()) {
      missing.push({ label: "Lead Berita", fieldId: "lead" });
    }
    if (!input.excerpt.trim()) {
      missing.push({ label: "Ringkasan", fieldId: "lead" });
    }
    if (input.paras.length === 0 || !input.plainText.trim()) {
      missing.push({ label: "Isi Berita", fieldId: "field-content" });
    }
    if (isPlaceholderImage(input.imagePath)) {
      missing.push({ label: "Foto Sampul", fieldId: "field-image" });
    }
    if (!input.imageCaption.trim()) {
      missing.push({ label: "Keterangan Foto", fieldId: "image_caption" });
    }
    if (!input.imageCredit.trim()) {
      missing.push({ label: "Sumber Foto", fieldId: "image_credit" });
    }
    if (!input.author.trim()) {
      missing.push({ label: "Penulis", fieldId: "author" });
    }
    if (input.tags.length === 0) {
      missing.push({ label: "Tag Berita", fieldId: "tags" });
    }
    return missing;
  }

  function focusFirstMissing(fieldId: string) {
    window.setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof (el as HTMLElement).focus === "function") {
        window.setTimeout(() => (el as HTMLElement).focus({ preventScroll: true }), 350);
      }
    }, 50);
  }

  // Handler A — Simpan Draf: validasi minimal (judul), status eksplisit 'draft'.
  async function handleSaveDraft() {
    setMsg("");
    setOkMsg("");
    setGuardMsg("");
    setImgErr("");
    const title = form.title.trim();
    if (!title) {
      setMsg("Judul wajib diisi untuk menyimpan draf.");
      focusFirstMissing("field-title");
      return;
    }
    setBusy(true);
    try {
      const paras = htmlToBlocks(form.content);
      const tags = splitTags(form.tags).filter((t) => t !== HEADLINE_TAG);
      if (form.headline) tags.unshift(HEADLINE_TAG);
      const uploadedPath = await uploadImage();
      if (imageFile && !uploadedPath) {
        setBusy(false);
        return;
      }
      const secondaryUploadedPath = await uploadSecondaryImage();
      if (secondaryImageFile && !secondaryUploadedPath) {
        setBusy(false);
        return;
      }
      const imagePath = uploadedPath || form.image.trim();
      const secondaryRaw = (secondaryUploadedPath || form.secondary_image.trim()).trim();
      // MODUL 1.2: kosong → null (jangan string kosong / error); kirim
      // NAMA KANONIK `optional_image*` + alias `secondary_image*` agar
      // API + halaman pembaca mengenali Tipe 1 vs Tipe 2.
      const secondaryImagePath = secondaryRaw ? secondaryRaw : null;
      const secondaryCaptionRaw = form.secondary_image_caption.trim();
      const secondaryCreditRaw = form.secondary_image_credit.trim();
      const draftPayload = {
        title,
        category: form.category || "Nasional",
        excerpt: form.excerpt.trim(),
        content: JSON.stringify(paras),
        image: imagePath,
        optional_image: secondaryImagePath,
        optional_image_caption: secondaryCaptionRaw ? secondaryCaptionRaw : null,
        secondary_image: secondaryImagePath,
        tags: JSON.stringify(tags),
        author: form.author.trim() || "Redaksi GentaNusa",
        author_slug:
          form.author.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") ||
          "redaksi-generic",
        author_role: "Redaktur GentaNusa",
        date: form.date || todayWIB(),
        image_caption: form.image_caption.trim(),
        image_credit: form.image_credit.trim(),
        secondary_image_caption: secondaryCaptionRaw ? secondaryCaptionRaw : null,
        secondary_image_credit: secondaryCreditRaw ? secondaryCreditRaw : null,
        lead: form.excerpt.trim(),
        status: "draft",
      };
      const targetUrl = activeId ? `/api/articles/${activeId}` : "/api/articles";
      const method = activeId ? "PUT" : "POST";
      let r: Response;
      try {
        r = await fetch(targetUrl, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftPayload),
        });
      } catch {
        setBusy(false);
        setMsg("Server tidak terjangkau — periksa koneksi / dev server lalu coba lagi.");
        return;
      }
      setBusy(false);
      if (r.ok || r.status === 201) {
        const j = await r.json().catch(() => ({}));
        if (!activeId && j && typeof j.id === "number") setActiveId(j.id);
        writeDraftSnapshot(form);
        setOkMsg("Tersimpan sebagai draf. Berita ini tidak akan tampil di halaman depan maupun kategori sampai Anda mempublikasikannya.");
      } else {
        const j = await r.json().catch(() => ({}));
        const detail = typeof j.error === "string" && j.error ? j.error : `kode ${r.status}`;
        setMsg(`Gagal menyimpan draf: ${detail}`);
      }
    } catch (e) {
      setBusy(false);
      setMsg(`Gagal menyimpan draf: ${e instanceof Error ? e.message : "kesalahan tak terduga"}`);
    }
  }

  // Handler B — Publikasikan: guard 10 kolom, tanggal WIB, status 'published'.
  // Memperbaiki bug fatal draf->publikasi: payload SELALU membawa status
  // eksplisit 'published' (baru via POST, draf-lama via PUT ke ID yang sama).
  async function handlePublish() {
    setMsg("");
    setOkMsg("");
    setGuardMsg("");
    setImgErr("");
    setBusy(true);
    try {
      const uploadedPath = await uploadImage();
      if (imageFile && !uploadedPath) {
        setBusy(false);
        return;
      }
      const secondaryUploadedPath = await uploadSecondaryImage();
      if (secondaryImageFile && !secondaryUploadedPath) {
        setBusy(false);
        return;
      }
      const imagePath = uploadedPath || form.image.trim();
      const secondaryRawPub = (secondaryUploadedPath || form.secondary_image.trim()).trim();
      const secondaryImagePathPub = secondaryRawPub ? secondaryRawPub : null;
      const secondaryCaptionPub = form.secondary_image_caption.trim();
      const secondaryCreditPub = form.secondary_image_credit.trim();
      const title = form.title.trim();
      const paras = htmlToBlocks(form.content);
      const plainText = htmlToText(form.content);
      const tags = splitTags(form.tags).filter((t) => t !== HEADLINE_TAG);
      if (form.headline) tags.unshift(HEADLINE_TAG);
      const userTags = tags.filter((t) => t !== HEADLINE_TAG);

      const missing = validatePublish({
        title,
        category: form.category,
        excerpt: form.excerpt,
        paras,
        plainText,
        imagePath,
        imageCaption: form.image_caption,
        imageCredit: form.image_credit,
        author: form.author,
        tags: userTags,
      });
      if (missing.length > 0) {
        setBusy(false);
        const labels = [...new Set(missing.map((m) => m.label))];
        setGuardMsg(
          `Gagal Publikasi: Seluruh kolom wajib diisi sebelum berita resmi diterbitkan! Kolom yang belum lengkap: ${labels.join(", ")}.`
        );
        focusFirstMissing(missing[0].fieldId);
        return;
      }

      const today = todayWIB();
      const lead = form.excerpt.trim();
      const publishPayload = {
        title,
        category: form.category,
        excerpt: lead,
        content: JSON.stringify(paras),
        image: imagePath.trim(),
        optional_image: secondaryImagePathPub,
        optional_image_caption: secondaryCaptionPub ? secondaryCaptionPub : null,
        secondary_image: secondaryImagePathPub,
        tags: JSON.stringify(tags),
        author: form.author.trim(),
        author_slug:
          form.author.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") ||
          "redaksi-generic",
        author_role: "Redaktur GentaNusa",
        date: today,
        image_caption: form.image_caption.trim(),
        image_credit: form.image_credit.trim(),
        secondary_image_caption: secondaryCaptionPub ? secondaryCaptionPub : null,
        secondary_image_credit: secondaryCreditPub ? secondaryCreditPub : null,
        lead,
        status: "published",
      };
      const targetUrl = activeId ? `/api/articles/${activeId}` : "/api/articles";
      const method = activeId ? "PUT" : "POST";
      let r: Response;
      try {
        r = await fetch(targetUrl, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(publishPayload),
        });
      } catch {
        setBusy(false);
        setMsg("Server tidak terjangkau — periksa koneksi / dev server lalu coba lagi.");
        return;
      }
      setBusy(false);
      if (r.ok || r.status === 201) {
        clearDraft();
        setOkMsg("Berita berhasil dipublikasikan!");
        window.setTimeout(() => router.push("/admin/posts"), 600);
      } else {
        const j = await r.json().catch(() => ({}));
        const detail = typeof j.error === "string" && j.error ? j.error : `kode ${r.status}`;
        setMsg(`Gagal memublikasikan artikel: ${detail}`);
      }
    } catch (e) {
      setBusy(false);
      setMsg(`Gagal memublikasikan artikel: ${e instanceof Error ? e.message : "kesalahan tak terduga"}`);
    }
  }

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageHeading}>{activeId ? `Edit Berita #${activeId}` : "Tulis Berita Baru"}</h2>
          <p className={styles.pageSub}>
            {activeId ? "Perbarui konten, lalu simpan sebagai draft atau publikasikan." : "Susun liputan, lalu simpan sebagai draft atau langsung publikasikan."}
          </p>
        </div>
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}
      {guardMsg && (
        <div className={styles.guardBanner} role="alert">
          {guardMsg}
        </div>
      )}
      {okMsg && (
        <div className={okMsg.startsWith("Tersimpan sebagai draf") ? styles.warnBanner : styles.okBanner} role="status">
          {okMsg}
        </div>
      )}
      {hasStoredDraft && (
        <div className={styles.panel} style={{ marginBottom: 16 }}>
          <p className={styles.pageSub}>Draf tersimpan ditemukan di peramban ini.</p>
          <button type="button" className={styles.btnSecondary} onClick={loadStoredDraft}>
            Muat Draf Tersimpan
          </button>
        </div>
      )}

      <div className={styles.formGrid}>
        {/* Kolom kiri — konten utama */}
        <div className={styles.formCol}>
          <div className={styles.panel}>
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <input
                id="field-title"
                className={`${styles.input} ${styles.titleInput}`}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul berita yang menarik..."
              />
            </div>
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <label className={styles.fieldLabel} htmlFor="lead">
                Kutipan / Lead (20&ndash;600 karakter)
              </label>
              <textarea
                id="lead"
                className={styles.textarea}
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Ringkasan pembuka yang memikat pembaca..."
                style={{ textAlign: "justify" }}
              />
              <p className={styles.help} style={{ textAlign: "right" }}>{form.excerpt.trim().length}/600 karakter</p>
            </div>
            <div className={styles.field} id="field-content">
              <label className={styles.fieldLabel} htmlFor="content" id="content-label">
                Konten Artikel
              </label>
              <VisualEditor
                id="content"
                labelledBy="content-label"
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                placeholder="Tulis isi berita di sini — tebal, miring, dan perataan langsung terlihat..."
              />
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Foto Sampul</h3>
            <div id="field-image">
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

            {/* Foto 2 — Dokumentasi Kedua (Opsional) */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Foto Tambahan / Dokumentasi Kedua (Opsional)</h3>
              <div id="field-secondary-image">
              <input
                ref={secondaryFileRef}
                className={styles.dropzoneInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  pickSecondaryFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              {!secondaryImagePreview && !form.secondary_image ? (
                <div
                  className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label="Unggah foto dokumentasi kedua"
                  onClick={() => secondaryFileRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") secondaryFileRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    pickSecondaryFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                >
                  <span className={styles.dropzoneIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </span>
                  <p className={styles.dropzoneText}>Seret dan lepas foto dokumentasi kedua di sini, atau klik untuk memilih</p>
                  <p className={styles.dropzoneHint}>JPG, PNG, WebP maks 5MB — Maksimal 2 foto per artikel</p>
                </div>
              ) : (
                <div>
                  <Image
                    src={secondaryImagePreview || form.secondary_image}
                    alt="Pratinjau foto dokumentasi kedua"
                    width={640}
                    height={360}
                    unoptimized
                    className={styles.previewImg}
                  />
                  <div style={{ marginTop: 12 }}>
                    <button type="button" className={styles.btnSecondary} onClick={() => secondaryFileRef.current?.click()}>
                      Ganti Foto
                    </button>
                  </div>
                </div>
              )}
              {imgErr && <p className={styles.err}>{imgErr}</p>}
              </div>
              <div className={styles.captionGrid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="secondary_image_caption">Keterangan Foto 2 / Caption</label>
                  <input
                    id="secondary_image_caption"
                    name="secondary_image_caption"
                    className={styles.input}
                    value={form.secondary_image_caption}
                    onChange={(e) => setForm({ ...form, secondary_image_caption: e.target.value })}
                    placeholder="Contoh: Dokumentasi bantuan logistik di daerah terdampak..."
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="secondary_image_credit">Kredit Sumber Foto 2 / Fotografer</label>
                  <input
                    id="secondary_image_credit"
                    name="secondary_image_credit"
                    className={styles.input}
                    value={form.secondary_image_credit}
                    onChange={(e) => setForm({ ...form, secondary_image_credit: e.target.value })}
                    placeholder="Contoh: Humas BPBD Provinsi..."
                  />
                </div>
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
              {draftNotice && !msg && !guardMsg && <p className={styles.pageSub}>{draftNotice}</p>}
              <button className={styles.btnSecondary} disabled={busy} onClick={handleSaveDraft}>
                {busy ? "Menyimpan..." : "Simpan Draf"}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={busy}
                onClick={clearDraft}
                title="Bersihkan draf tersimpan di peramban ini"
              >
                Hapus Draf
              </button>
              <button className={styles.btnPrimary} disabled={busy} onClick={handlePublish}>
                {busy ? "Mempublikasikan..." : "Publikasikan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}