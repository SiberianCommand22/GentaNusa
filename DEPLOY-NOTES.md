# GentaNusa — Rilis Awal (MVP)

## Status: ✅ Produksi Aktif

- **URL:** https://gentanusa.vercel.app
- **Versi:** 1.0 (MVP)
- **Tanggal:** September 2026

## Halaman Utama

| Route | Deskripsi |
|-------|-----------|
| `/` | Beranda — hierarki card editorial, hero dengan gradient overlay |
| `/artikel/[id]` | Detail artikel — layout 1200px, grid 1fr 340px |
| `/kategori/[slug]` | Kategori — banner seragam merah #c8102e |
| `/api/articles` | API — daftar artikel (RLS: publik baca) |
| `/api/articles/[id]` | API — satu artikel (ID numerik, 400 jika invalid) |
| `/api/categories` | API — daftar kategori (tanpa field color) |
| `/api/admin/login` | API — login admin (rate limit 5x/15min, timing-safe, cookie HttpOnly+Secure+SameSite=Lax) |
| `/api/admin/logout` | API — logout admin |
| `/api/admin/check` | API — cek sesi admin (401 jika belum login) |

## Fitur Keamanan Aktif

- CSP header (production): `default-src 'self'`, inline style diizinkan (Tailwind), HTTPS-only images
- X-Frame-Options: DENY
- HSTS aktif (Vercel)
- Rate limiting login: 5 percobaan per 15 menit per IP
- Timing-safe password compare (`timingSafeEqual`)
- Cookie admin: `httpOnly`, `secure`, `sameSite: lax`, path `/api/admin`
- XSS sanitasi pada konten artikel (DOMPurify)
- Validasi input: ID numerik wajib pada `/api/articles/[id]`
- Error handling: detail error hanya di development, production → generic message
- RLS aktif di Supabase (publik baca, admin tulis via service_role)

## Belum Ada (Roadmap v1.x)

- Fitur admin CRUD artikel (admin panel)
- Upload gambar
- Password hashing (bcrypt/Argon2) — saat ini plaintext env
- Password reset flow
- Audit log
- CSP lebih granular (font CDN jika diperlukan nanti)

## Persiapan Beli Domain

1. Beli domain (contoh: gentanusa.id)
2. Update `NEXT_PUBLIC_SITE_URL` di Vercel → domain baru
3. CNAME record: `www` → `gentanusa.vercel.app`
4. Vercel: add alias `gentanusa.id` dan `www.gentanusa.id`
5. Update email kontak, alamat, dan link sosial di footer (jika ada)
6. Set `ADMIN_PASSWORD` kuat untuk production baru
7. Uji ulang semua route production
8. Luncurkan! 🚀