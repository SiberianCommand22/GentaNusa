'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { 
  Upload, Trash2, HeartHandshake, Save, 
  AlertCircle, CheckCircle2, RefreshCw, Edit2
} from 'lucide-react';

interface PhotoItem {
  id?: string;
  src: string;
  alt: string;
  caption: string;
  handwritten_note: string;
  photographer: string;
  timestamp: string;
  rotation_deg: number;
  story_title: string;
  story_description: string;
  order_index?: number;
  file?: File;
}

interface PhotoRow {
  id: string;
  event_id: string;
  src: string;
  alt?: string | null;
  caption?: string | null;
  handwritten_note?: string | null;
  photographer?: string | null;
  timestamp?: string | null;
  rotation_deg?: number | null;
  story_title?: string | null;
  story_description?: string | null;
  order_index?: number | null;
}

interface EventRow {
  id: string;
  date_label?: string | null;
  orphanage_name?: string | null;
  location_city?: string | null;
  headline?: string | null;
  summary?: string | null;
  children_count?: number | null;
  volunteers_count?: number | null;
  packages_distributed?: number | null;
  legal_number?: string | null;
  head_name?: string | null;
  phone?: string | null;
  address?: string | null;
  urgent_needs?: string[] | string | null;
  peduli_photos?: PhotoRow[];
}

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

const PHOTO_TEXT_KEYS = [
  'alt', 'caption', 'handwritten_note', 'photographer',
  'timestamp', 'story_title', 'story_description'
] as const;

function rowToPhotoItem(p: PhotoRow): PhotoItem {
  return {
    id: p.id,
    src: p.src,
    alt: p.alt || 'Dokumentasi',
    caption: p.caption || '',
    handwritten_note: p.handwritten_note || 'Tawa dan kebersamaan di panti ~',
    photographer: p.photographer || 'Tim Liputan GentaNusa',
    timestamp: p.timestamp || '25 Okt 2026',
    rotation_deg: p.rotation_deg || 0,
    story_title: p.story_title || 'Momen Hangat di Sukaraja',
    story_description: p.story_description || '',
    order_index: p.order_index ?? 0
  };
}

function defaultPhotoItem(file: File): PhotoItem {
  return {
    src: '',
    alt: file.name,
    caption: 'Dokumentasi Lapangan',
    handwritten_note: 'Senyum hangat adik-adik di bilik panti ~',
    photographer: 'Tim Liputan GentaNusa',
    timestamp: '25 Okt 2026',
    rotation_deg: Number((Math.random() * 4 - 2).toFixed(1)),
    story_title: 'Momen Kebersamaan',
    story_description: 'Liputan aksi kemanusiaan dan kehangatan bersama adik-adik panti.',
    file
  };
}

// Semua akses tulis lewat API routes bertipe admin (sesi `genta_token`);
// RLS menolak tulisan anon, jadi halaman tidak menulis langsung ke Supabase.
async function apiJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, init);
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Sesi admin berakhir. Silakan login ulang.');
    }
    const msg =
      data && typeof data === 'object' && 'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

type UploadEntry = { file: File; photo: PhotoItem; orderIndex: number };

async function uploadPhotos(
  eventId: string,
  entries: UploadEntry[]
): Promise<{ items: PhotoItem[]; failures: string[] }> {
  const fd = new FormData();
  fd.append('event_id', eventId);
  const metas = entries.map((entry) => {
    fd.append('files', entry.file);
    const p = entry.photo;
    return {
      alt: p.alt || null,
      caption: p.caption || null,
      handwritten_note: p.handwritten_note || null,
      photographer: p.photographer || null,
      timestamp: p.timestamp || null,
      story_title: p.story_title || null,
      story_description: p.story_description || null,
      order_index: entry.orderIndex
    };
  });
  fd.append('meta', JSON.stringify(metas));

  const data = (await apiJson('/api/peduli/photos', {
    method: 'POST',
    body: fd
  })) as { photos?: PhotoRow[]; failed?: { name: string; error: string }[] };

  const items = (Array.isArray(data.photos) ? data.photos : []).map(rowToPhotoItem);
  const failures = (Array.isArray(data.failed) ? data.failed : []).map(
    (f) => `${f.name}: ${f.error}`
  );
  return { items, failures };
}

function revokeBlob(item: PhotoItem | undefined) {
  if (item && item.file && item.src.startsWith('blob:')) {
    URL.revokeObjectURL(item.src);
  }
}

export default function AdminPeduliPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Field Form Terbuka (Editable)
  const [dateLabel, setDateLabel] = useState('25 Oktober 2026');
  const [orphanageName, setOrphanageName] = useState('Yayasan Ar-Rakha Gladys Makaluas, Rumah Yatim Piatu Miftaahul Jannah (Yardysma RYP-MJ)');
  const [locationCity, setLocationCity] = useState('Sukaraja, Kabupaten Bogor, Jawa Barat');
  const [headline, setHeadline] = useState('Menjemput Senyum di Sudut Sukaraja: Secuil Kasih dan Pelukan Hangat untuk Tunas Harapan Yardysma');
  const [summary, setSummary] = useState('Di balik pintu sederhana di sudut Sukaraja, senyum tulus dan tatap mata berbinar adik-adik yatim piatu menyambut kehadiran kami. Lewat sepaket sembako, bingkisan kecil, dan hangatnya kebersamaan, tim GentaNusa hadir bukan sekadar mengantarkan amanah logistik, melainkan merawat lentera harapan agar mimpi mereka di Yayasan Ar-Rakha Miftaahul Jannah terus menyala tanpa rasa sunyi.');
  
  const [childrenCount, setChildrenCount] = useState<number | string>(30);
  const [volunteersCount, setVolunteersCount] = useState<number | string>(22);
  const [packagesDistributed, setPackagesDistributed] = useState<number | string>(30);

  const [legalNumber, setLegalNumber] = useState('AHU-0012485.AH.01.04.Tahun 2020');
  const [headName, setHeadName] = useState('Pengelola Yayasan Ar-Rakha Gladys Makaluas (Yardysma RYP-MJ)');
  const [phone, setPhone] = useState('0251-7556161 / 0812-1330-777');
  const [address, setAddress] = useState('PERUM SUKARAJA RESIDENCE Jl. Sukaraja - Katulampa No.KAV III / 123, RT.01/RW.07, Sukaraja, Kec. Sukaraja, Kabupaten Bogor, Jawa Barat 16710');
  const [urgentNeeds, setUrgentNeeds] = useState('Beras Utama, Minyak Goreng, Mie Instan, Hampers Snack, Buku Bacaan');

  // Daftar Foto
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  // Snapshot foto saat terakhir dimuat + id foto yang sudah ada di server —
  // dipakai untuk diff (hapus/ubah) saat Simpan.
  const origRef = useRef<PhotoItem[]>([]);
  const serverIdsRef = useRef<Set<string>>(new Set());

  const loadEventToForm = (event: EventRow) => {
    setSelectedEventId(event.id);
    setDateLabel(event.date_label || '');
    setOrphanageName(event.orphanage_name || '');
    setLocationCity(event.location_city || '');
    setHeadline(event.headline || '');
    setSummary(event.summary || '');
    setChildrenCount(event.children_count ?? 30);
    setVolunteersCount(event.volunteers_count ?? 22);
    setPackagesDistributed(event.packages_distributed ?? 30);
    setLegalNumber(event.legal_number || '');
    setHeadName(event.head_name || '');
    setPhone(event.phone || '');
    setAddress(event.address || '');
    setUrgentNeeds(Array.isArray(event.urgent_needs) ? event.urgent_needs.join(', ') : (event.urgent_needs || ''));

    photos.forEach(revokeBlob);
    const mapped = (event.peduli_photos ?? []).map(rowToPhotoItem);
    origRef.current = mapped.map((p) => ({ ...p }));
    serverIdsRef.current = new Set(mapped.map((p) => p.id).filter(Boolean) as string[]);
    setPhotos(mapped);
  };

  // Daftar kegiatan via API (baca publik, tanpa join PostgREST).
  const fetchEvents = async (preferId?: string | null) => {
    setLoading(true);
    try {
      const data = await apiJson('/api/peduli/events');
      const combined: EventRow[] = Array.isArray(data) ? (data as EventRow[]) : [];
      setEvents(combined);
      if (combined.length > 0) {
        const wanted =
          combined.find((ev) => ev.id === (preferId ?? selectedEventId)) ?? combined[0];
        loadEventToForm(wanted);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: toMessage(err, 'Gagal mengambil data dari database') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tunda satu tick agar tidak memanggil setState secara sinkron di dalam
    // effect (larangan react-hooks: set-state-in-effect).
    const timer = setTimeout(fetchEvents, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateNew = () => {
    photos.forEach(revokeBlob);
    setSelectedEventId(null);
    setHeadline('');
    setSummary('');
    setPhotos([]);
    origRef.current = [];
    serverIdsRef.current = new Set();
  };

  // Upload foto: untuk kegiatan tersimpan langsung lewat API admin;
  // untuk kegiatan baru, foto ditahan lokal sampai Simpan.
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setStatusMsg(null);

    try {
      const picked = Array.from(files);

      if (selectedEventId) {
        const base = photos.length;
        const { items, failures } = await uploadPhotos(
          selectedEventId,
          picked.map((file, i) => ({ file, photo: defaultPhotoItem(file), orderIndex: base + i }))
        );
        setPhotos(prev => [...prev, ...items]);
        if (failures.length > 0) {
          setStatusMsg({
            type: 'error',
            text: `${items.length} foto masuk, ${failures.length} gagal diunggah: ${failures.join('; ')}`
          });
        } else {
          setStatusMsg({ type: 'success', text: `${items.length} foto berhasil diunggah & tersimpan.` });
        }
      } else {
        const held = picked.map(file => ({
          ...defaultPhotoItem(file),
          src: URL.createObjectURL(file)
        }));
        setPhotos(prev => [...prev, ...held]);
        setStatusMsg({
          type: 'success',
          text: `${picked.length} foto siap. Klik 'Simpan Perubahan' untuk mengunggah & menerbitkan.`
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: `Upload gagal: ${toMessage(err, 'Periksa koneksi atau sesi admin')}` });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const updatePhoto = (index: number, field: keyof PhotoItem, value: PhotoItem[keyof PhotoItem]) => {
    setPhotos(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removePhoto = (index: number) => {
    revokeBlob(photos[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const eventPayload = {
        date_label: dateLabel,
        orphanage_name: orphanageName,
        location_city: locationCity,
        headline,
        summary,
        children_count: Number(childrenCount) || 0,
        volunteers_count: Number(volunteersCount) || 0,
        packages_distributed: Number(packagesDistributed) || 0,
        legal_number: legalNumber,
        head_name: headName,
        phone,
        address,
        urgent_needs: urgentNeeds.split(',').map(s => s.trim()).filter(Boolean)
      };

      let activeId = selectedEventId;

      if (activeId) {
        await apiJson(`/api/peduli/events/${activeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventPayload)
        });
      } else {
        const created = (await apiJson('/api/peduli/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventPayload)
        })) as EventRow;
        activeId = created.id;
        setSelectedEventId(activeId);
      }

      // 1) foto server yang hilang dari daftar lokal → hapus permanen
      for (const id of serverIdsRef.current) {
        if (!photos.some(p => p.id === id)) {
          await apiJson(`/api/peduli/photos/${id}`, { method: 'DELETE' });
        }
      }

      // 2) foto tersimpan yang diedit teks / geser urutan → PATCH parsial
      for (let idx = 0; idx < photos.length; idx++) {
        const photo = photos[idx];
        if (!photo.id || photo.file) continue;
        const origIdx = origRef.current.findIndex(o => o.id === photo.id);
        if (origIdx < 0) continue;
        const orig = origRef.current[origIdx];

        const patch: Record<string, string | number> = {};
        for (const key of PHOTO_TEXT_KEYS) {
          if (photo[key] !== orig[key]) patch[key] = photo[key];
        }
        if (idx !== origIdx) patch.order_index = idx;

        if (Object.keys(patch).length > 0) {
          await apiJson(`/api/peduli/photos/${photo.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
          });
        }
      }

      // 3) foto baru (ditahan lokal) → unggah sekali jalan
      const pending = photos
        .map((p, idx) => ({ p, idx }))
        .filter((x): x is { p: PhotoItem & { file: File }; idx: number } => !x.p.id && Boolean(x.p.file));
      if (pending.length > 0) {
        const { items, failures } = await uploadPhotos(
          activeId,
          pending.map(({ p, idx }) => ({ file: p.file, photo: p, orderIndex: idx }))
        );
        if (failures.length > 0) {
          throw new Error(`${failures.length} foto gagal diunggah: ${failures.join('; ')}`);
        }
        items.forEach(item => { if (item.id) serverIdsRef.current.add(item.id); });
      }

      await fetch('/api/peduli/revalidate', { method: 'POST' });

      setStatusMsg({ type: 'success', text: 'Perubahan teks dan foto berhasil disimpan & live seketika!' });
      await fetchEvents(activeId);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: toMessage(err, 'Gagal menyimpan data') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-1">
              <HeartHandshake className="w-4 h-4" />
              <span>Dashboard Admin Kanal Peduli</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Edit Narasi & Dokumentasi Foto
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
            >
              + Kegiatan Baru
            </button>
            <button
              type="button"
              onClick={() => fetchEvents()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-950 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            statusMsg.type === 'success' ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-200' : 'bg-rose-950 border border-rose-500/50 text-rose-200'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tabel Riwayat Kegiatan */}
        {events.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
              Daftar Kegiatan Tersedia
            </div>
            <div className="divide-y divide-slate-800 text-xs">
              {events.map((ev) => (
                <div key={ev.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">{ev.headline || ev.orphanage_name}</p>
                    <p className="text-slate-400">{ev.date_label} • {ev.location_city} • {ev.peduli_photos?.length || 0} Foto Terpasang</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadEventToForm(ev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-300 hover:bg-sky-900 transition font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Pilih & Edit</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Formulir Narasi Terbuka */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
              1. Teks Headline & Narasi Kegiatan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Tanggal Pelaksanaan</label>
                <input
                  type="text"
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  placeholder="25 Oktober 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Wilayah / Lokasi</label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  placeholder="Sukaraja, Kabupaten Bogor"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Nama Mitra Panti / Yayasan</label>
                <input
                  type="text"
                  value={orphanageName}
                  onChange={(e) => setOrphanageName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Judul Utama (Headline)</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-semibold text-sky-200"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Ringkasan Narasi (Summary)</label>
              <textarea
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Anak Asuh</label>
                <input
                  type="number"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Relawan Hadir</label>
                <input
                  type="number"
                  value={volunteersCount}
                  onChange={(e) => setVolunteersCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Paket Bantuan</label>
                <input
                  type="number"
                  value={packagesDistributed}
                  onChange={(e) => setPackagesDistributed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Editor Foto Polaroid Lengkap */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
                  2. Dokumentasi Foto ({photos.length} Foto Aktif)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Foto yang telah tersimpan bisa diatur catatan tangannya atau dihapus. Tambah foto baru lewat tombol di samping.
                </p>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition">
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? 'Mengunggah ke Storage...' : '+ Upload Foto Baru'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                <p className="text-sm text-slate-400">Belum ada foto dokumentasi yang aktif.</p>
                <p className="text-xs text-slate-500 mt-1">Klik tombol ungu di atas untuk mengunggah kumpulan foto.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {photos.map((photo, index) => (
                  <div key={index} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 relative">
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Hapus foto ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Pratinjau Foto */}
                    <div className="w-full md:w-40 shrink-0 flex flex-col items-center">
                      <div className="relative w-36 h-36 rounded-lg overflow-hidden border border-slate-700 bg-black">
                        {photo.src.startsWith('blob:') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo.src}
                            alt={photo.alt}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={photo.src}
                            alt={photo.alt}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-2 font-mono">Foto #{index + 1}</span>
                    </div>

                    {/* Metadata Foto */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="md:col-span-2">
                        <label className="block text-slate-400 mb-1 font-medium">
                          Catatan Tangan Polaroid (Muncul di Bawah Foto)
                        </label>
                        <input
                          type="text"
                          value={photo.handwritten_note}
                          onChange={(e) => updatePhoto(index, 'handwritten_note', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-200 outline-none"
                          placeholder="Tawa hangat adik-adik ~"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Judul Cerita (Lightbox)</label>
                        <input
                          type="text"
                          value={photo.story_title}
                          onChange={(e) => updatePhoto(index, 'story_title', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Fotografer Liputan</label>
                        <select
                          value={photo.photographer}
                          onChange={(e) => updatePhoto(index, 'photographer', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                        >
                          <option value="Tim Liputan GentaNusa">Tim Liputan GentaNusa</option>
                          <option value="Hanif Zulfikar">Hanif Zulfikar</option>
                          <option value="Chelsea Aulya">Chelsea Aulya</option>
                          <option value="Adhira Bachtiar">Adhira Bachtiar</option>
                          <option value="Dimas Arrizki">Dimas Arrizki</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-slate-400 mb-1 font-medium">Kisah di Balik Foto</label>
                        <textarea
                          rows={2}
                          value={photo.story_description}
                          onChange={(e) => updatePhoto(index, 'story_description', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                          placeholder="Ceritakan momen di balik foto ini..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Profil & Kontak Panti */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
              3. Profil & Kontak Resmi Panti
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Nomor Legalitas</label>
                <input
                  type="text"
                  value={legalNumber}
                  onChange={(e) => setLegalNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Telepon / WhatsApp Resmi</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Alamat Lengkap</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Kebutuhan Mendesak (Pisahkan Koma)</label>
              <input
                type="text"
                value={urgentNeeds}
                onChange={(e) => setUrgentNeeds(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="flex justify-end pt-2 pb-12">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-xl shadow-sky-950 transition"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Menyimpan ke Database...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}