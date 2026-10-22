# Kebijakan Keamanan GentaNusa — Go-Live Checklist

## ✅ Selesai (verified)

| No | Checklist | Status | Bukti |
|----|-----------|--------|-------|
| 1 | API key aman (env var, .gitignore) | ✅ | `.env.local` di-gitignore, 4+1 env var di Vercel |
| 2 | No hardcode secret | ✅ | Semua kunci via `process.env`; tidak ada password master di kode |
| 3 | Debug mode OFF | ✅ | `poweredByHeader: false`, `generateEtags: true` |
| 4 | Error jangan bocor | ✅ | `apiError()` — detail hanya di dev |
| 5 | Validasi input | ✅ | `/api/articles/[id]` ID numerik → 400 jika bukan |
| 6 | Sanitasi input | ✅ | `lib/sanitize-regex.ts` (regex murni, nol jsdom) |
| 7 | Anti SQL injection | ✅ | Supabase ORM (parameterized) |
| 8 | Anti XSS | ✅ | Sanitizer + CSP header |
| 9 | Server-side auth | ✅ | Token Supabase (`genta_token`) diverifikasi `auth.getUser()` |
| 10 | Cek akses user | ✅ | `isAdmin()` di setiap mutasi |
| 11 | Role admin aman | ✅ | `app_metadata.role` (bukan `user_metadata`) + rate limit login |
| 12 | DB permission ketat | ✅ | RLS aktif + policy editor per-`user_id` |
| 13 | Session aman | ✅ | `httpOnly + secure + sameSite: lax` |
| 14 | Timing-safe compare | ✅ | Verifikasi kredensial di Supabase Auth, bukan di kode |
| 15 | Rate limiting login | ✅ | 10 gagal / 5 menit per IP+email (map dibatasi 10k entri) |
| 16 | CSP headers production | ✅ | CSP, XFO, XCO, Referrer-Policy, Permissions-Policy |
| 17 | HSTS aktif | ✅ | Strict-Transport-Security dari Vercel |
| 18 | `/api/categories` tanpa color | ✅ | Hanya slug+name |
| 19 | `/api/articles/abc` → 400 | ✅ | Validasi numerik |
| 20 | `/artikel/abc` → notFound() | ✅ | 404 production |
| 21 | Test articles dihapus dari DB | ✅ | ID 125/126 tidak ada di articles.json |
| 22 | `NEXT_PUBLIC_SITE_URL` env-based | ✅ | sitemap.ts, layout.ts, artikel page |
| 23 | Cyber deception (decoy + tarpit) | ✅ | 5 rute umpan, log `[decoy:*]`, honeytoken kredensial |
| 24 | Postur CORS | ✅ | Tanpa ACAO (same-origin default) + CORP `same-site` |

## ⏳ Masih perlu (post launch)

| No | Item | Catatan |
|----|------|---------|
| 1 | Password reset flow | Belum ada fitur |
| 2 | Audit log persistif | Log decoy hanya ke stdout Vercel; belum ada tabel audit |
| 3 | DB connection pooler | Supabase Pooler mode |
| 4 | Rotasi kunci berkala | Jadwalkan rotasi anon/service key |

## Remediasi Okt 2026 (sudah diterapkan di kode)

- Auth tanpa fallback: `getEditorialSession()` hanya mengakui token Supabase
  yang lolos `auth.getUser()`; cookie `genta_session` tak dipercaya.
- Tanpa kredensial hardcoded: login 100% Supabase Auth. Administrator Utama
  wajib punya akun Supabase Auth beremail `MASTER_ADMIN_EMAIL`.
- RBAC via `app_metadata.role` (set dengan `scripts/assign-admin-role.ts`);
  `user_metadata.role` tidak memberi hak admin. Kebijakan DB di
  `scripts/enable-rls.sql` — jalankan di SQL Editor Supabase.
- Anti-SSRF di `/api/og` (edge, `@vercel/og`) dan `/api/og-image` (sharp):
  allowlist host + tolak IP privat/localhost + skema non-https.
- CSP produksi tanpa `'unsafe-eval'`; `/api/debug/*` → 404 di produksi.

## Modul 4 — Cyber Deception (umba & tarpit)

Aplikasi ini **bukan** WordPress/PHP/MySQL. Karena itu setiap permintaan ke
jalur stack-LAMP berikut pasti berasal dari pemindai/penyerang otomatis, bukan
pengguna: `.git/*`, `wp-admin`, `wp-login.php`, `phpmyadmin`, `api/v1/debug`.

- Handler: `lib/decoy.ts` — tahan ±3,5 detik (tarpit, hanya `setTimeout`,
  tidak memakai CPU/kuota tambahan), balas halaman/JSON palsu yang meyakinkan,
  lalu catat satu baris JSON ke log server dengan prefiks `[decoy:<trap>]`
  (IP, metode, path, UA, referer, negara, dan body form yang dipotong 300 char).
- Rute: `app/api/decoy/git/[...path]` (dipetakan dari `/.git/:path*` lewat
  `rewrites()` karena Git tidak bisa melacak folder bernama `.git`),
  `app/wp-admin`, `app/wp-login.php`, `app/phpmyadmin`, `app/api/v1/debug`.
- **Honeytoken**: body POST ke form login palsu (`wp-login.php`, `wp-admin`,
  `phpmyadmin`) dicatat sebagai bukti percobaan kredensial. Tidak pernah
  divalidasi, tidak pernah menyentuh Supabase.
- **Fingerprint umpan**: header global `Server: Apache/2.4.52 (Unix)` dan
  `X-Powered-By: PHP/8.1.12` (Vercel dapat menimpa `Server` di edge; header
  tetap terkirim pada respons yang di-stream Next.js).
- Monitoring: Vercel → Logs → filter `[decoy:`. Lonjakan = sedang dipindai.
  Tidak ada jalur sah yang memanggil rute-rute ini; 100% hit dapat dianggap
  sinyal jahat (nol false positive).
- Jangan menambahkan `Disallow` untuk jalur umpan di `robots.txt`: itu justru
  memberi tahu pemindai bahwa jalur tersebut ada.

## Postur CORS

Tidak ada header `Access-Control-Allow-Origin` yang dipasang (default browser:
same-origin), dan `/api(.*)` memakai `Cross-Origin-Resource-Policy: same-site`.
Ini **disengaja**: API hanya untuk klien di domain sendiri. Rute publik yang
perlu diakses lintas situs (OG image) tidak memerlukan CORS karena dipakai
sebagai `<img>`/metadata, bukan `fetch` lintas origin. Jangan menambahkan
`Access-Control-Allow-Origin: *` pada rute yang membaca cookie/sesi.

## Cloudflare WAF — aturan rate limiting wajib (lapis pertahanan utama,
## karena rate-limit in-memory tidak lintas instance serverless)

| Endpoint | Batas | Aksi |
|----------|-------|------|
| `/api/admin/login` | 5 req/menit/IP | Block 10 menit |
| `/api/upload` | 20 req/menit/IP | Block 5 menit |
| `/api/articles/*` (POST/PUT/DELETE) | 30 req/menit/IP | Challenge/Block |

## Langkah berikutnya

1. Deploy selesai ✅ → production sudah berjalan
2. Beli domain (contoh: gentanusa.id)
3. Update `NEXT_PUBLIC_SITE_URL` di Vercel dengan domain baru
4. Update CNAME/record DNS ke Vercel
5. Buat akun Supabase Auth untuk Administrator Utama + jalankan
   `scripts/assign-admin-role.ts` untuk setiap admin, lalu terapkan
   `scripts/enable-rls.sql` di SQL Editor Supabase
6. Uji ulang semua route production
7. Luncurkan ke publik 🚀