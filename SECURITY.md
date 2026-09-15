# Kebijakan Keamanan GentaNusa — Go-Live Checklist

## ✅ Selesai (verified)

| No | Checklist | Status | Bukti |
|----|-----------|--------|-------|
| 1 | API key aman (env var, .gitignore) | ✅ | `.env.local` di-gitignore, 4+1 env var di Vercel |
| 2 | No hardcode secret | ✅ | Semua kunci via `process.env` |
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

## Langkah berikutnya

1. Deploy selesai ✅ → production sudah berjalan
2. Beli domain (contoh: gentanusa.id)
3. Update `NEXT_PUBLIC_SITE_URL` di Vercel dengan domain baru
4. Update CNAME/record DNS ke Vercel
5. Set `ADMIN_PASSWORD` kuat untuk production baru
6. Uji ulang semua route production
7. Luncurkan ke publik 🚀