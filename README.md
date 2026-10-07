# GentaNusa

Portal berita Indonesia — Next.js 16 (App Router), data JSON, SSG.

## Mulai

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).
Web otomatis hidup saat laptop nyala (auto-start `gentanusa_dev.bat`).

## Dokumentasi

- **PRD.md** → visi, fitur, roadmap, keputusan (baca dulu sebelum kerja)
- **lib/data/** → konten (articles.json, categories.json, sources.json, syndicated.json)
- **Publikasi 100% manual** → via `/admin` oleh akun redaksi yang login (tidak ada bot/cron)

## Struktur

```
app/          → halaman (beranda, artikel, kategori, penulis, sindikasi, cari, legal)
components/   → UI dipakai ulang (header, kartu, share, TTS, dark mode, reveal)
lib/data/     → konten JSON
lib/data.ts   → helper baca data (getArticles, getCategories, dll)
public/       → gambar, favicon
scripts/      → utilitas manual satu-kali (seed, sinkronisasi build, verifikasi)
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server (jangan bila auto-start sudah jalan) |
| `npm run build` | Build produksi |
| `npm start` | Jalankan build produksi |
| `npm run lint` | Cek kode |
| `/admin` (browser) | Tulis & terbitkan berita — wajib login, tanpa bot/cron |

## Deploy

Target: Vercel (gratis). Lihat PRD.md bagian Roadmap.