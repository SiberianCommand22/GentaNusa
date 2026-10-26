"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
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

type PickedPhoto = {
  file: File;
  caption: string;
  note: string;
};

type Session = {
  isAdmin: boolean;
  displayName: string | null;
};

export default function PeduliAdminPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<PickedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

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
    setPhotoFiles([]);
    setShowForm(true);
  }

  function editEvent(ev: EventRow) {
    setEditing(ev);
    setForm({
      ...ev,
      urgent_needs: ev.urgent_needs || [],
      bank_accounts: ev.bank_accounts || [],
    });
    setPhotoFiles([]);
    setShowForm(true);
  }

  async function save() {
    setMsg("");
    if (!isAdmin) {
      setMsg("Hanya administrator yang dapat mengelola data Peduli.");
      return;
    }
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/peduli/events/${editing.id}` : "/api/peduli/events";
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        setMsg("Berhasil disimpan");
        setShowForm(false);
        load();
      } else {
        const j = await r.json().catch(() => ({}));
        setMsg(j.error || "Gagal menyimpan");
      }
    } catch {
      setMsg("Gagal menyimpan");
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

  const activeEvent = editing ? events.find((e) => e.id === editing.id) || null : null;
  const photos: PhotoRow[] = [...(activeEvent?.peduli_photos || [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setPhotoFiles((prev) => [
      ...prev,
      ...picked.map((file) => ({ file, caption: "", note: "" })),
    ]);
    e.target.value = "";
  }

  function updatePicked(index: number, patch: Partial<PickedPhoto>) {
    setPhotoFiles((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function dropPicked(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPhotos() {
    if (!isAdmin || !activeEvent || photoFiles.length === 0) return;
    setMsg("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("event_id", activeEvent.id);
      photoFiles.forEach((item) => fd.append("files", item.file));
      fd.append(
        "meta",
        JSON.stringify(photoFiles.map((item) => ({ caption: item.caption, handwritten_note: item.note })))
      );
      const r = await fetch("/api/peduli/photos", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const failed = Array.isArray(j.failed) ? j.failed : [];
        const okCount = Array.isArray(j.photos) ? j.photos.length : 0;
        setMsg(
          failed.length > 0
            ? `${okCount} foto tersimpan, ${failed.length} gagal: ${failed[0]?.error || ""}`
            : `${okCount} foto berhasil diunggah`
        );
        setPhotoFiles([]);
        load();
      } else {
        setMsg(j.error || "Gagal mengunggah foto");
      }
    } catch {
      setMsg("Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(id: string) {
    if (!isAdmin) return;
    if (!confirm("Hapus foto polaroid ini?")) return;
    setMsg("");
    try {
      const r = await fetch(`/api/peduli/photos/${id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setMsg("Foto dihapus");
        load();
      } else {
        setMsg(j.error || "Gagal menghapus foto");
      }
    } catch {
      setMsg("Gagal menghapus foto");
    }
  }

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
                  <td>{ev.location_city}</td>
                  {isAdmin && (
                    <td>
                      <button onClick={() => editEvent(ev)} style={{ marginRight: 8 }}>Edit</button>
                      <button onClick={() => remove(ev.id)}>Hapus</button>
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
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <input placeholder="Label Tanggal (contoh: 25 Oktober 2026)" value={form.date_label || ""} onChange={(e) => setForm({ ...form, date_label: e.target.value })} />
            <input placeholder="Nama Panti Asuhan" value={form.orphanage_name || ""} onChange={(e) => setForm({ ...form, orphanage_name: e.target.value })} />
            <input placeholder="Kota" value={form.location_city || ""} onChange={(e) => setForm({ ...form, location_city: e.target.value })} />
            <input placeholder="Headline" value={form.headline || ""} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
            <textarea placeholder="Ringkasan" value={form.summary || ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <input type="number" placeholder="Jumlah Anak" value={form.children_count ?? ""} onChange={(e) => setForm({ ...form, children_count: e.target.value ? Number(e.target.value) : null })} />
              <input type="number" placeholder="Jumlah Relawan" value={form.volunteers_count ?? ""} onChange={(e) => setForm({ ...form, volunteers_count: e.target.value ? Number(e.target.value) : null })} />
              <input type="number" placeholder="Paket Dibagikan" value={form.packages_distributed ?? ""} onChange={(e) => setForm({ ...form, packages_distributed: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <input placeholder="Nomor Badan Hukum" value={form.legal_number || ""} onChange={(e) => setForm({ ...form, legal_number: e.target.value })} />
            <input placeholder="Nama Pimpinan" value={form.head_name || ""} onChange={(e) => setForm({ ...form, head_name: e.target.value })} />
            <input placeholder="Telepon" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <textarea placeholder="Alamat" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
            <div>
              <button onClick={save} style={{ marginRight: 8 }}>Simpan</button>
              <button onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </div>

          {editing && activeEvent && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #1e293b" }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Galeri Polaroid ({photos.length} foto)</h3>
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                Foto tampil di halaman /peduli setelah diunggah. Keterangan & catatan bersifat opsional.
              </p>

              {photos.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Belum ada foto untuk kegiatan ini.</p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  {photos.map((ph) => (
                    <figure
                      key={ph.id}
                      style={{
                        border: "1px solid #1e293b",
                        borderRadius: 8,
                        padding: 8,
                        margin: 0,
                        background: "#0f172a",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ph.src}
                        alt={ph.alt || ph.caption || "Foto polaroid"}
                        style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 4 }}
                      />
                      <figcaption style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>
                        {ph.caption || ph.alt || "—"}
                      </figcaption>
                      <button onClick={() => removePhoto(ph.id)} style={{ marginTop: 6, fontSize: 12 }}>
                        Hapus
                      </button>
                    </figure>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPickFiles}
                />
                {photoFiles.length > 0 && (
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {photoFiles.map((item, i) => (
                      <div
                        key={`${item.file.name}-${i}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#cbd5e1",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.file.name}
                        </span>
                        <input
                          placeholder="Keterangan (caption)"
                          value={item.caption}
                          onChange={(e) => updatePicked(i, { caption: e.target.value })}
                        />
                        <input
                          placeholder="Catatan tulisan tangan"
                          value={item.note}
                          onChange={(e) => updatePicked(i, { note: e.target.value })}
                        />
                        <button onClick={() => dropPicked(i)} disabled={uploading}>
                          Buang
                        </button>
                      </div>
                    ))}
                    <div>
                      <button onClick={uploadPhotos} disabled={uploading} style={{ marginRight: 8 }}>
                        {uploading ? "Mengunggah..." : `Unggah ${photoFiles.length} Foto`}
                      </button>
                      <button onClick={() => setPhotoFiles([])} disabled={uploading}>
                        Bersihkan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
