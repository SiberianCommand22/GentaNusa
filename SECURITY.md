# Kebijakan Keamanan GentaNusa — Go-Live Checklist

## ✅ Selesai (verified)

| No | Checklist | Status | Bukti |
|----|-----------|--------|-------|
| 1 | API key aman (env var, .gitignore) | ✅ | `.env.local` di-gitignore, 4+1 env var di Vercel |
| 2 | No hardcode secret | ✅ | Semua kunci via `process.env`; tidak ada password master di kode |
| 3 | Debug mode OFF | ✅ | `poweredByHeader: false`, `generateEtags: true` |
| 4 | Error jangan bocor | ✅ | `apiError()` — detail hanya di dev |
| 5 | Validasi input | ✅ | `/api/articles/[id]` ID numerik → 400 jika bukan |
| 6 | Sanitasi input | ✅ | `article-content.tsx` + DOMPurify |
| 7 | Anti SQL injection | ✅ | Supabase ORM (parameterized) |
| 8 | Anti XSS | ✅ | Sanitizer + CSP header |
| 9 | Server-side auth | ✅ | Cookie `genta_admin` di server |
| 10 | Cek akses user | ✅ | `isAdmin()` di setiap mutasi |
| 11 | Role admin aman | ✅ | Cookie + rate limit 5x/15min |
| 12 | DB permission ketat | ✅ | RLS aktif |
| 13 | Session aman | ✅ | `httpOnly + secure + sameSite: lax` |
| 14 | Timing-safe compare | ✅ | `timingSafeEqual` pada login |
| 15 | Rate limiting login | ✅ | 5 percobaan/15 menit/IP (verified: 6→429) |
| 16 | CSP headers production | ✅ | CSP, XFO, XCO, Referrer-Policy, Permissions-Policy |
| 17 | HSTS aktif | ✅ | Strict-Transport-Security dari Vercel |
| 18 | `/api/categories` tanpa color | ✅ | Hanya slug+name |
| 19 | `/api/articles/abc` → 400 | ✅ | Validasi numerik |
| 20 | `/artikel/abc` → notFound() | ✅ | 404 production |
| 21 | Test articles dihapus dari DB | ✅ | ID 125/126 tidak ada di articles.json |
| 22 | `NEXT_PUBLIC_SITE_URL` env-based | ✅ | sitemap.ts, layout.ts, artikel page |

## ⏳ Masih perlu (post launch)

| No | Item | Catatan |
|----|------|---------|
| 1 | Hash password (bcrypt/Argon2) | Saat ini plaintext env — migrate saat auth upgrade |
| 2 | Password reset flow | Belum ada fitur |
| 3 | File upload validation | Belum ada fitur upload |
| 4 | Audit log | Catat aksi admin |
| 5 | DB connection pooler | Supabase Pooler mode |
| 6 | CSP relaksasi | Jika font.googleapis.com diperlukan, tambahkan `font-src` |

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