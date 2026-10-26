"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Trash2, Upload } from "lucide-react";
import styles from "../cms.module.css";

type BankAccount = {
  bank_name: string;
  account_number: string;
  account_holder: string;
};

type UrgentNeed = {
  item: string;
  priority?: "high" | "medium" | "low";
};

type PhotoRow = {
  id: string;
  event_id?: string | null;
  src: string;
  alt?: string | null;
  caption?: string | null;
  handwritten_note?: string | null;
  photographer?: string | null;
  story_title?: string | null;
  story_description?: string | null;
  order_index?: number | null;
  created_at?: string;
};

type EventRow = {
  id: string;
  date_label: string;
  orphanage_name: string;
  location_city: string;
  headline: string;
  summary: string;
  children_count?: number | null;
  volunteers_count?: number | null;
  packages_distributed?: number | null;
  legal_number?: string | null;
  head_name?: string | null;
  phone?: string | null;
  address?: string | null;
  urgent_needs?: UrgentNeed[] | string[] | null;
  bank_accounts?: BankAccount[] | null;
  created_at?: string;
  peduli_photos?: PhotoRow[];
};

/** Satu kartu di editor foto: baris tersimpan (dbId) atau berkas lokal (file). */
type PhotoItem = {
  key: string;
  dbId?: string;
  file?: File;
  src: string;
  handwritten_note: string;
  photographer: string;
  story_title: string;
  story_description: string;
  order_index: number;
  /** Salinan awal (baris DB) untuk deteksi perubahan saat Simpan. */
  orig: {
    handwritten_note: string;
    photographer: string;
    story_title: string;
    story_description: string;
    order_index: number;
  };
};

type Session = {
  isAdmin: boolean;
  displayName: string | null;
};

const PHOTOGRAPHERS = [
  "Hanif Zulfikar",
  "Chelsea Aulya",
  "Adhira Bachtiar",
  "Dimas Arrizki",
];

const inputCls =
  "w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm";

function toItemFromRow(ph: PhotoRow, index: number): PhotoItem {
  const base = {
    handwritten_note: ph.handwritten_note || "",
    photographer: ph.photographer || "",
    story_title: ph.story_title || "",
    story_description: ph.story_description || "",
    order_index: ph.order_index ?? index,
  };
  return {
    key: ph.id,
    dbId: ph.id,
    src: ph.src,
    ...base,
    orig: { ...base },
  };
}

function sortPhotos(rows: PhotoRow[]): PhotoRow[] {
  return rows
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

export default function PeduliAdminPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<Partial<EventRow>>({
    date_label: "",
    orphanage_name: "",
    location_city: "",
    headline: "",
    summary: "",
    children_count: null,
    volunteers_count: null,
    packages_distributed: null,
    legal_number: "",
    head_name: "",
    phone: "",
    address: "",
    urgent_needs: [],
    bank_accounts: [],
  });

  useEffect(() => {
    fetch("/api/admin/check")
      .then(async (r) => {
        if (!r.ok) return null;
        const j = await r.json().catch(() => ({}));
        return {
          isAdmin: Boolean(j.is_admin),
          displayName: typeof j.display_name === "string" ? j.display_name : null,
        } satisfies Session;
      })
      .then((s) => setSession(s))
      .catch(() => setSession(null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/peduli/events");
      if (r.ok) {
        const rows = await r.json();
        setEvents(Array.isArray(rows) ? rows : []);
      } else {
        setMsg("Gagal memuat data peduli");
      }
    } catch {
      setMsg("Gagal memuat data peduli");
    } finally {
      setLoading(false);
    }
  }, []);

  // Pemuatan awal didefer agar tidak setState sinkron di body effect
  // (pola sama dengan app/admin/posts/page.tsx).
  useEffect(() => {
    const t = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const isAdmin = session?.isAdmin === true;

  function closeForm() {
    photoItems.forEach((item) => {
      if (item.file) URL.revokeObjectURL(item.src);
    });
    setPhotoItems([]);
    setShowForm(false);
    setEditing(null);
  }

  function newEvent() {
    setEditing(null);
    setForm({
      date_label: "",
      orphanage_name: "",
      location_city: "",
      headline: "",
      summary: "",
      children_count: null,
      volunteers_count: null,
      packages_distributed: null,
      legal_number: "",
      head_name: "",
      phone: "",
      address: "",
      urgent_needs: [],
      bank_accounts: [],
    });
    setPhotoItems([]);
    setShowForm(true);
  }

  function editEvent(ev: EventRow) {
    setEditing(ev);
    setForm({
      ...ev,
      urgent_needs: ev.urgent_needs || [],
      bank_accounts: ev.bank_accounts || [],
    });
    setPhotoItems(sortPhotos(ev.peduli_photos || []).map(toItemFromRow));
    setShowForm(true);
  }

  async function save() {
    setMsg("");
    if (!isAdmin) {
      setMsg("Hanya administrator yang dapat mengelola data Peduli.");
      return;
    }

    const dateLabel = (form.date_label || "").trim();
    const orphanage = (form.orphanage_name || "").trim();
    const headline = (form.headline || "").trim();
    if (!dateLabel || !orphanage || !headline) {
      setMsg("Isi Label Tanggal, Nama Panti Asuhan, dan Headline terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      // 1. Simpan / perbarui data pokok kegiatan.
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/peduli/events/${editing.id}` : "/api/peduli/events";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date_label: dateLabel,
          orphanage_name: orphanage,
          headline,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setMsg(j.error || "Gagal menyimpan");
        return;
      }
      const saved = (await r.json().catch(() => null)) as EventRow | null;
      const eventId = saved?.id || editing?.id || "";

      // 2. Unggah foto lokal yang belum terkirim (kegiatan baru / unggahan tertunda).
      let uploadNote = "";
      const pending = photoItems.filter((p) => p.file);
      if (pending.length > 0 && eventId) {
        const fd = new FormData();
        fd.append("event_id", eventId);
        pending.forEach((p) => fd.append("files", p.file as File));
        fd.append(
          "meta",
          JSON.stringify(
            pending.map((p) => ({
              handwritten_note: p.handwritten_note || null,
              photographer: p.photographer || null,
              story_title: p.story_title || null,
              story_description: p.story_description || null,
              order_index: photoItems.indexOf(p),
            }))
          )
        );
        const up = await fetch("/api/peduli/photos", { method: "POST", body: fd });
        const upj = await up.json().catch(() => ({}));
        if (!up.ok) {
          uploadNote = ` | Foto gagal diunggah: ${upj.error || "kesalahan server"}`;
        } else {
          const failed = Array.isArray(upj.failed) ? upj.failed : [];
          const okCount = Array.isArray(upj.photos) ? upj.photos.length : 0;
          uploadNote = failed.length
            ? ` | ${okCount} foto terunggah, ${failed.length} gagal: ${failed[0]?.error || ""}`
            : ` | ${okCount} foto terunggah`;
        }
      }

      // 3. Sinkronkan perubahan keterangan foto yang sudah tersimpan di DB.
      let patched = 0;
      for (const p of photoItems) {
        if (!p.dbId || p.file) continue;
        const patch: Record<string, unknown> = {};
        if (p.handwritten_note !== p.orig.handwritten_note) {
          patch.handwritten_note = p.handwritten_note;
        }
        if (p.photographer !== p.orig.photographer) {
          patch.photographer = p.photographer;
        }
        if (p.story_title !== p.orig.story_title) {
          patch.story_title = p.story_title;
        }
        if (p.story_description !== p.orig.story_description) {
          patch.story_description = p.story_description;
        }
        const order = photoItems.indexOf(p);
        if (order !== p.orig.order_index) {
          patch.order_index = order;
        }
        if (Object.keys(patch).length === 0) continue;
        try {
          const pr = await fetch(`/api/peduli/photos/${p.dbId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          if (pr.ok) patched += 1;
        } catch {
          // Lanjut ke foto berikutnya; kegagalan dilaporkan lewat pesan umum.
        }
      }

      // 4. Segarkan cache halaman publik /peduli & /kategori/peduli.
      try {
        await fetch("/api/peduli/revalidate", { method: "POST" });
      } catch {
        // Opsional — rute tulis sudah memanggil revalidatePath secara lokal.
      }

      setMsg(
        `Berhasil disimpan${uploadNote}${
          patched > 0 ? ` | ${patched} keterangan foto diperbarui` : ""
        }`
      );
      setPhotoItems([]);
      setShowForm(false);
      setEditing(null);
      load();
    } catch {
      setMsg("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!isAdmin) return;
    if (!confirm("Hapus kegiatan peduli ini?")) return;
    const r = await fetch(`/api/peduli/events/${id}`, { method: "DELETE" });
    if (r.ok) {
      setMsg("Dihapus");
      load();
    } else {
      setMsg("Gagal menghapus");
    }
  }

  async function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0 || !isAdmin) return;

    // Kegiatan sudah ada di DB → unggah langsung ke bucket peduli.
    if (editing) {
      setUploading(true);
      setMsg("");
      try {
        const base = photoItems.length;
        const fd = new FormData();
        fd.append("event_id", editing.id);
        picked.forEach((file) => fd.append("files", file));
        fd.append(
          "meta",
          JSON.stringify(
            picked.map((_, i) => ({
              handwritten_note: null,
              photographer: null,
              story_title: null,
              story_description: null,
              order_index: base + i,
            }))
          )
        );
        const r = await fetch("/api/peduli/photos", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setMsg(j.error || "Gagal mengunggah foto");
          return;
        }
        const rows: PhotoRow[] = Array.isArray(j.photos) ? j.photos : [];
        const failed = Array.isArray(j.failed) ? j.failed : [];
        setPhotoItems((prev) => [
          ...prev,
          ...rows.map((row, i) => toItemFromRow(row, prev.length + i)),
        ]);
        setMsg(
          failed.length > 0
            ? `${rows.length} foto terunggah, ${failed.length} gagal: ${failed[0]?.error || ""}`
            : `${rows.length} foto diunggah`
        );
        load();
      } catch {
        setMsg("Gagal mengunggah foto");
      } finally {
        setUploading(false);
      }
      return;
    }

    // Kegiatan baru → tahan berkas lokal, diunggah bersamaan saat Simpan.
    setPhotoItems((prev) => [
      ...prev,
      ...picked.map((file, i) => {
        const base = {
          handwritten_note: "",
          photographer: "",
          story_title: "",
          story_description: "",
          order_index: prev.length + i,
        };
        return {
          key: `local-${Date.now()}-${i}-${file.name}`,
          file,
          src: URL.createObjectURL(file),
          ...base,
          orig: { ...base },
        } satisfies PhotoItem;
      }),
    ]);
  }

  function updateItem(key: string, patch: Partial<PhotoItem>) {
    setPhotoItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  async function removePhoto(item: PhotoItem) {
    if (!isAdmin) return;

    // Berkas lokal: cukup buang dari daftar.
    if (item.file) {
      URL.revokeObjectURL(item.src);
      setPhotoItems((prev) => prev.filter((p) => p.key !== item.key));
      return;
    }
    if (!item.dbId) return;
    if (!confirm("Hapus foto polaroid ini?")) return;

    setMsg("");
    setUploading(true);
    try {
      const r = await fetch(`/api/peduli/photos/${item.dbId}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setPhotoItems((prev) => prev.filter((p) => p.key !== item.key));
        setMsg("Foto dihapus");
        load();
      } else {
        setMsg(j.error || "Gagal menghapus foto");
      }
    } catch {
      setMsg("Gagal menghapus foto");
    } finally {
      setUploading(false);
    }
  }

  const busy = saving || uploading;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageHeading}>Peduli: Aksi Kemanusiaan</h2>
          <p className={styles.pageSub}>Kelola kegiatan, foto polaroid, profil panti, dan rekening donasi</p>
        </div>
        {isAdmin && (
          <button onClick={newEvent} className={styles.primaryBtn}>
            + Tambah Kegiatan
          </button>
        )}
      </div>

      {msg && <div className={styles.infoBanner}>{msg}</div>}

      {loading ? (
        <div>Memuat...</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Panti Asuhan</th>
                <th>Judul</th>
                <th>Foto</th>
                <th>Lokasi</th>
                {isAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.date_label}</td>
                  <td>{ev.orphanage_name}</td>
                  <td>{ev.headline}</td>
                  <td>{ev.peduli_photos?.length || 0}</td>
                  <td>{ev.location_city}</td>
                  {isAdmin && (
                    <td>
                      <button onClick={() => editEvent(ev)} disabled={busy} style={{ marginRight: 8 }}>Edit</button>
                      <button onClick={() => remove(ev.id)} disabled={busy}>Hapus</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && isAdmin && (
        <div style={{ marginTop: 24, padding: 16, border: "1px solid #1e293b", borderRadius: 8 }}>
          <h3>{editing ? "Edit Kegiatan" : "Tambah Kegiatan"}</h3>
          <div className="grid gap-3 mt-3">
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Label Tanggal</span>
              <input
                className={inputCls}
                placeholder="contoh: 25 Oktober 2026"
                value={form.date_label || ""}
                onChange={(e) => setForm({ ...form, date_label: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Nama Panti Asuhan</span>
              <input
                className={inputCls}
                placeholder="Nama Panti Asuhan"
                value={form.orphanage_name || ""}
                onChange={(e) => setForm({ ...form, orphanage_name: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Kota</span>
              <input
                className={inputCls}
                placeholder="Kota penyelenggaraan"
                value={form.location_city || ""}
                onChange={(e) => setForm({ ...form, location_city: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Headline</span>
              <input
                className={inputCls}
                placeholder="Headline editorial kegiatan"
                value={form.headline || ""}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Ringkasan</span>
              <textarea
                className={inputCls}
                placeholder="Ringkasan kegiatan"
                value={form.summary || ""}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={4}
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                className={inputCls}
                type="number"
                placeholder="Jumlah Anak"
                value={form.children_count ?? ""}
                onChange={(e) => setForm({ ...form, children_count: e.target.value ? Number(e.target.value) : null })}
              />
              <input
                className={inputCls}
                type="number"
                placeholder="Jumlah Relawan"
                value={form.volunteers_count ?? ""}
                onChange={(e) => setForm({ ...form, volunteers_count: e.target.value ? Number(e.target.value) : null })}
              />
              <input
                className={inputCls}
                type="number"
                placeholder="Paket Dibagikan"
                value={form.packages_distributed ?? ""}
                onChange={(e) => setForm({ ...form, packages_distributed: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Nomor Badan Hukum</span>
              <input
                className={inputCls}
                placeholder="Nomor Badan Hukum"
                value={form.legal_number || ""}
                onChange={(e) => setForm({ ...form, legal_number: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Nama Pimpinan</span>
              <input
                className={inputCls}
                placeholder="Nama Pimpinan Yayasan"
                value={form.head_name || ""}
                onChange={(e) => setForm({ ...form, head_name: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Telepon</span>
              <input
                className={inputCls}
                placeholder="Nomor telepon yayasan"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-400">Alamat</span>
              <textarea
                className={inputCls}
                placeholder="Alamat lengkap"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
              />
            </label>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={save}
                disabled={busy}
                className={styles.primaryBtn}
                style={{ opacity: busy ? 0.6 : 1 }}
              >
                {saving ? "Menyimpan..." : "Simpan Kegiatan"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={busy}
                className="text-sm text-slate-400 hover:text-white"
              >
                Batal
              </button>
            </div>
          </div>

          {/* Editor Foto Dokumentasi — berlaku untuk kegiatan baru & lama */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>
              Editor Foto Dokumentasi ({photoItems.length} foto)
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
              Setiap foto punya keterangan sendiri: catatan tulisan tangan, fotografer,
              dan kisah di balik foto. Kegiatan baru mengunggah foto saat tombol Simpan
              ditekan.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className={styles.primaryBtn}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                {uploading ? "Mengunggah..." : "Unggah Foto Dokumentasi"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onPickFiles}
              />
              <span className="text-xs text-slate-500">
                JPG, PNG, atau WebP &middot; maksimal 4 MB per foto
              </span>
            </div>

            {photoItems.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 14 }}>
                Belum ada foto. Unggah dokumentasi kegiatan untuk galeri jemuran polaroid.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {photoItems.map((item) => (
                  <figure
                    key={item.key}
                    className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 flex gap-3 m-0"
                  >
                    <div className="w-24 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.story_title || item.handwritten_note || "Foto dokumentasi"}
                        className="w-24 h-24 object-cover rounded-md border border-slate-700"
                      />
                    </div>
                    <div className="flex-1 min-w-0 grid gap-2">
                      <textarea
                        className={`${inputCls} resize-none`}
                        placeholder="Catatan tulisan tangan (muncul di bawah foto polaroid)"
                        value={item.handwritten_note}
                        onChange={(e) => updateItem(item.key, { handwritten_note: e.target.value })}
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className={inputCls}
                          aria-label="Fotografer"
                          value={item.photographer}
                          onChange={(e) => updateItem(item.key, { photographer: e.target.value })}
                        >
                          <option value="">— Pilih fotografer —</option>
                          {PHOTOGRAPHERS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                          {item.photographer && !PHOTOGRAPHERS.includes(item.photographer) && (
                            <option value={item.photographer}>{item.photographer}</option>
                          )}
                        </select>
                        <input
                          className={inputCls}
                          placeholder="Judul cerita lightbox"
                          value={item.story_title}
                          onChange={(e) => updateItem(item.key, { story_title: e.target.value })}
                        />
                      </div>
                      <textarea
                        className={`${inputCls} resize-none`}
                        placeholder="Kisah di balik foto"
                        value={item.story_description}
                        onChange={(e) => updateItem(item.key, { story_description: e.target.value })}
                        rows={2}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 font-mono truncate">
                          {item.file ? item.file.name : "Terunggah"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePhoto(item)}
                          disabled={busy}
                          className="text-xs text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
