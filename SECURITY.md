# Kebijakan Keamanan GentaNusa

Dokumen ini menjelaskan versi yang mendapat dukungan keamanan, cara melaporkan kerentanan (vulnerability), serta praktik keamanan yang diterapkan pada proyek GentaNusa.

## Versi yang Didukung

| Versi   | Didukung           |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                 |

> Skema versioning mengikuti tag rilis di Git (mis. `v1.0.0`).

## Melaporkan Kerentanan

Jika Anda menemukan celah keamanan (XSS, SQL/NoSQL injection, kebocoran data, broken auth, SSRF, RCE, dsb.), **jangan** membuat *issue* publik di repository. Laporkan secara privat melalui:

- Email: *(isi dengan email resmi, mis. security@gentanusa.id)*
- Pesan langsung ke maintainer repo

Sertakan dalam laporan:

1. Deskripsi singkat kerentanan dan dampaknya
2. Langkah reproduksi (proof of concept bila ada)
3. URL/endpoint atau file yang terdampak
4. Versi/commit yang digunakan saat menemukan masalah
5. Tingkat keparahan perkiraan (rendah/sedang/tinggi/kritis)

### Respons yang Diharapkan

| Tahap                              | Target waktu      |
| ---------------------------------- | ----------------- |
| Konfirmasi laporan diterima        | 2–3 hari kerja    |
| Penilaian awal tingkat keparahan   | 5 hari kerja      |
| Perbaikan atau mitigasi            | Sesuai keparahan  |
| Pengumuman/disclosure (jika relevan) | Setelah fix rilis |

Detail kerentanan **tidak boleh dipublikasikan** sebelum perbaikan tersedia.

## Cakupan

**Termasuk:**

- Aplikasi web GentaNusa (frontend & API routes)
- Autentikasi dan otorisasi panel admin (`/admin`)
- Penyimpanan dan pemrosesan data (Supabase, JSON lokal)
- RSS feed, sitemap, endpoint publik

**Di luar cakupan:**

- Serangan yang membutuhkan akses fisik ke perangkat pengguna
- Kerentanan pada layanan pihak ketiga di luar kendali proyek (Vercel, Supabase, provider domain)
- Social engineering tanpa celah teknis

## Praktik Keamanan yang Diterapkan

### 1. Koneksi & Transport
- HTTPS wajib di production (Vercel menyediakan sertifikat otomatis)
- Cookie admin `genta_admin`: `httpOnly`, `secure` di production, `sameSite: lax`, expiry 7 hari
- `poweredByHeader: false` (sembunyikan info server)

### 2. Rahasia & Kredensial
- Semua kunci (Supabase URL, anon key, service key, `ADMIN_PASSWORD`) disimpan sebagai Environment Variable — **tidak pernah di-commit** ke repository
- `.env.local` di-gitignore
- Service key (`SUPABASE_SERVICE_KEY`) hanya dipakai di server-side (API routes), tidak pernah bocor ke client
- Vercel menyimpan nilai sebagai Secret (tersembunyi dari dashboard)

### 3. XSS & Injeksi
- Konten artikel disanitasi sebelum dirender (`components/article-content.tsx`):
  - Blokir `javascript:` dan `data:text/html` URI
  - Buang tag `<script>` dan atribut `on*`
  - Hanya izinkan tag aman: `b`, `strong`, `em`, `i`, `code`, `a`, `p`, `br`
  - Hanya izinkan atribut `href` untuk link
- JSON-LD (schema.org) di-escape via `JSON.stringify` — dipakai aman dengan `dangerouslySetInnerHTML` hanya untuk data internal
- Input admin divalidasi di API route (title/content wajib, ID harus numerik)

### 4. Otorisasi API
- Semua mutasi (POST/PUT/DELETE) pada `/api/articles`, `/api/categories`, `/api/sources`, `/api/subscribers` memeriksa cookie admin
- Endpoint admin (`/api/admin/*`) tidak bocor ke publik
- `getCategories()` dan `/api/categories` tidak lagi mengembalikan field `color`

### 5. Login & Auth
- Password dibandingkan secara constant-time (`timingSafeEqual`) — anti timing attack
- Rate limiting: 5 percobaan per 15 menit per IP pada `/api/admin/login`
- Cookie `genta_admin`: `httpOnly: true`, `secure: true` (production), `sameSite: lax`, path `/api/admin`
- Error message tidak membedakan: "Password salah" bukan "Password benar tapi ..."

### 6. Error Handling
- Helper `apiError()` (`app/api/error-handler.ts`) membungkus semua error API
- Stack trace detail hanya muncul di development — production hanya returned generic pesan
- Tidak ada leak endpoint/internal info dalam error responses

### 7. Dependensi
- `npm audit` dijalankan secara berkala untuk mendeteksi CVE
- Dependensi diperbarui untuk menutup celah yang sudah diketahui

### 8. SEO & Metadata
- `NEXT_PUBLIC_SITE_URL` dipakai untuk canonical URL, sitemap, RSS, OpenGraph — tidak hardcoded
- `robots.txt` dan `sitemap.xml` disediakan untuk kontrol perayapan mesin pencari

## Checklist Sebelum Rilis (Go-Live)

- [ ] Ganti semua placeholder `gentanusa.example` / `gentanusa.id` dengan domain final via env var
- [ ] Set `ADMIN_PASSWORD` kuat (≥ 12 karakter, unik)
- [ ] Verifikasi semua env var production di Vercel (5 var: Supabase × 3 + ADMIN_PASSWORD + SITE_URL)
- [ ] Hapus artikel percobaan dari database (jika ada)
- [ ] Jalankan `npm audit` dan `npm run build` tanpa error
- [ ] Test alur login admin gagal (password salah → 401, tanpa bocor info)
- [ ] Test akses API mutasi tanpa cookie → harus 401
- [ ] Test ID artikel non-numerik → 400 (bukan 200/500)
- [ ] Konfigurasi Vercel: Deployment Protection untuk `/admin`
- [x] Aktifkan rate-limiting login (sudah: 5x/15min)
- [x] Database: RLS aktif
- [ ] CSP header aktif di production
- [ ] DB connection pooler mode (Supabase Pooler) — belum dikonfigurasi

## Roadmap Keamanan

- [ ] Hash password dengan bcrypt/Argon2 (saat ini plaintext env — akan di-migrate)
- [ ] Two-Factor Authentication (TOTP) untuk admin
- [ ] Content Security Policy (CSP) header di production (Next.js headers config)
- [ ] Audit log: catat aksi admin (tambah/edit/hapus artikel, login)
- [ ] Backup otomatis database Supabase
- [ ] Monitoring error (Sentry atau sejenisnya)
- [ ] File upload validation (type, size, virus scan)
- [ ] Secure password reset flow (expiring tokens)
- [ ] DB network isolation (private network binding)

## Kontak

Untuk pertanyaan umum seputar kebijakan ini, hubungi maintainer proyek melalui kanal pelaporan yang sama.