DEPLOY NOTES — GentaNusa
========================

- **Lokal (dev)**: http://localhost:3000 ✅ (port 3000)
- **Production URL**: https://gentanusa-2cx4xc57b-genta-nusa.vercel.app
  - ⚠️ URL ini ada **Deployment Protection** (Vercel meminta login SSO untuk akses)
  - Masalah ini bukan dari kode kita — ini pengaturan akun Vercel
  - Bisa diakses via `vercel inspect` atau setelah setting password protection off
- **Build**: sukses ✅ (Next.js 16.3.4, Turbopack)
- **Deploy**: manual via `npx vercel --prod` (akun Vercel terotentikasi)
- **Artikel**: 3 artikel konten asli di DB (90, 91, 92), penulis "Redaksi GentaNusa"