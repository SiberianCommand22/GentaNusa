# PRD — GentaNusa

> Product Requirements Document — dokumen "satu pemikiran" untuk pengembangan
> portal berita GentaNusa. Baca ini sebelum nambah fitur / ubah konten.
> Terakhir diperbarui: 12 September 2026.

---

## 1. Visi

**GentaNusa adalah portal berita Indonesia modern** yang menyajikan berita
politik, ekonomi, dan nasional secara akurat, cepat, dan terpercaya — dengan
tampilan bersih (news-first), nyaman dibaca (dark mode), dan terbuka (atribusi
sumber untuk semua konten sindikasi).

Filosofi konten: **fakta boleh, ekspresi tidak.** GentaNusa TIDAK menyalin isi
artikel pihak lain. Sindikasi = judul + ringkasan + tautan balik + atribusi.

## 2. Target Pengguna

- **Pembaca umum Indonesia** (18–50) — pencari berita politik/ekonomi/nasional
- **Pembaca mobile** — mayoritas buka dari HP (mobile-first, menu hamburger)
- **Pembaca malam** — dark mode untuk kenyamanan mata

## 3. Platform & Teknologi

| Aspek | Keputusan | Alasan |
|---|---|---|
| Framework | Next.js 16.3.4 (App Router, Turbopack) | SSG cepat, SEO bawaan |
| Data | JSON file (`lib/data/`) | Konten sedikit (puluhan), tanpa DB |
| Database | **Tidak ada** | JSON cukup; SQLite baru kalau ada admin panel |
| Gambar | SVG themed per kategori | Tanpa foto berbayar / hak cipta |
| Font | Source Serif 4 (judul) + Inter (teks) | Nuansa koran + modern |
| Tema | Light + Dark (toggle, tersimpan) | Tren 2026, kenyamanan baca |
| Deploy | Vercel (target) | Gratis, mudah, SSG-friendly |

## 4. Fitur

### 4.1 Selesai (✅)

**Konten**
- ✅ 6 artikel asli (id 45–121, kategori Politik/Ekonomi/Nasional/Kesehatan/Olahraga)
- ✅ Kategori: politik (merah), ekonomi (biru), nasional (hijau)
- ✅ Sindikasi: 30 item real dari 4 RSS (Antara Ekonomi/Terkini, CNBC, CNN)
- ✅ Artikel: judul, ekscerpt, isi (markdown ringan), tags, penulis, tanggal ISO

**Halaman** (23 route)
- ✅ Beranda (hero + terbaru + per kategori + newsletter)
- ✅ Artikel (breadcrumbs, gambar, share, TTS, penulis, terkait, JSON-LD)
- ✅ Kategori (banner warna, grid)
- ✅ Penulis (`/penulis/slug`)
- ✅ Sindikasi (`/sindikasi` — atribusi + catatan legal)
- ✅ Cari (`/cari` — server-side, highlight)
- ✅ Tentang, Privasi, Syarat
- ✅ 404, error, loading skeleton

**Visual**
- ✅ Font koran serif, hero gradien, ikon share SVG
- ✅ Kartu hover zoom + "Baca selengkapnya"
- ✅ Terpopuler bernomor, banner kategori warna
- ✅ Dark mode toggle (tersimpan, ikut sistem)
- ✅ Animasi fade-in scroll (Reveal, hormati reduced-motion)

**SEO & Infra**
- ✅ Metadata lengkap (OG, Twitter, canonical, JSON-LD NewsArticle)
- ✅ `/feed.xml` (RSS), `/sitemap.xml`, `/robots.txt`
- ✅ Auto-start `gentanusa_dev.bat` (port 3000)
- ✅ Git versioned, lint 0 error, build sukses

### 4.2 Direncanakan (🔜)

| Fitur | Prioritas | Catatan |
|---|---|---|
| Konten asli lebih banyak | **Tinggi** | 6 artikel → target 20+; portal butuh volume |
| Deploy Vercel | **Tinggi** | Online biar bisa dibuka orang & dishare |
| Update sindikasi terjadwal | Sedang | Bot `fetch_rss.py` manual → cron/jadwal |
| Halaman Kontak | Rendah | Form/email biar bisa dihubungi |

### 4.3 Tidak dilakukan (❌) — disengaja

- ❌ Foto hasil fetch bot (hak cipta; user: "gausah pakai foto")
- ❌ Salin isi artikel orang (UU 28/2014)
- ❌ MySQL/XAMPP (tidak perlu)
- ❌ Komentar pembaca (butuh moderasi, auth)
- ❌ Dark mode "auto" tanpa toggle (tetap kasih pilihan)

## 5. Struktur Konten

```
lib/data/
  articles.json   → artikel asli (id unik, category sesuai kategori, ISO date)
  categories.json → kategori + warna
  sources.json    → sumber RSS sindikasi (id, name, url, category, color)
  syndicated.json → hasil bot RSS ([], diisi scripts/fetch_rss.py)
public/images/articles/ → gambar artikel (SVG)
scripts/fetch_rss.py     → bot sindikasi (judul+link+atribusi, tanpa foto)
```

Aturan nulis artikel (wajib):
1. `id` unik (angka, naik)
2. `category` PERSIS: Politik / Ekonomi / Nasional (atau tambah di categories.json)
3. `date` format ISO (`2026-09-12`)
4. `image` path SVG di `public/images/articles/`
5. `authorSlug` harus ada di daftar penulis (`lib/data.ts`)

## 6. Sumber Kepercayaan / Atribusi

Sindikasi hidup dari: **Antara Ekonomi, Antara Terkini, CNBC Indonesia, CNN Indonesia**.
Setiap item: judul + ringkasan + link (target blank, `rel="noopener nofollow"`) + nama sumber.
Catatan legal ditampilkan di halaman `/sindikasi`.

## 7. Metrik Kesuksesan (jika deploy)

- Halaman terbuka: 500+/bulan
- Artikel dibaca: 3+ per orang
- Waktu baca: 1:30+ rata-rata
- Dark mode dipakai: 30%+ pengguna
- Feed di-subscribe: 10+ orang

## 8. Batasan & Risiko

- **Konten sindikasi tidak menghasilkan uang** — hanya trafik (perlu konten asli)
- **Deploy butuh domain** — `gentanusa.id` belum aktif
- **Bot RSS** — sumber bisa berubah/mati (sudah pernah: BBC 404, VOA berubah) → cek berkala
- **SSG + notFound** — URL artikel tak dikenal render 404 body tapi status 200 (limitasi Next 16, diterima)

## 9. Roadmap

| Fase | Isi | Status |
|---|---|---|
| 1 | Data layer JSON, kategori, artikel | ✅ |
| 2 | Media, gambar, font, dark mode | ✅ |
| 3 | UX (nav, search, share, TTS, skeleton) | ✅ |
| 4 | SEO, RSS, sitemap, 404/error | ✅ |
| 5 | Visual polish (hero, kartu, animasi) | ✅ |
| 6 | Sindikasi RSS bot (30 item live) | ✅ |
| 7 | **Konten asli banyak + deploy** | 🔜 |
| 8 | Admin panel (kalau konten makin banyak) | ⏳ nanti |

---

*Dokumen ini = sumber kebenaran. Kalau ada perubahan besar (fitur dihapus/
ditambah/konten kategori berubah), update bagian terkait + tanggal di atas.*