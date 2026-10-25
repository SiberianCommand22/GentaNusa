import type { NextConfig } from "next";

// CSP diperketat pasca-remediasi Okt 2026: 'unsafe-eval' HILANG di produksi
// (Next.js production tidak membutuhkannya; dev HMR masih boleh via kondisi
// di bawah). 'unsafe-inline' untuk script dipertahankan karena Next.js
// menyuntik inline bootstrap + (opsional) AdSense; style inline dibutuhkan
// Tailwind/Next. Tambahkan host AdSense/Analytics agar skrip iklan tidak pecah.
const isDev = process.env.NODE_ENV !== "production";
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://pagead2.googlesyndication.com https://*.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://pagead2.googlesyndication.com https://*.google-analytics.com;
  frame-src 'self' https://googleads.g.doubleclick.net https://*.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  generateEtags: true,
  images: {
    // HEMAT KUOTA VERCEL HOBBY: tanpa Image Optimization sama sekali.
    // `next/image` tetap dipakai (layout anti-shift, lazy-load, sizes),
    // tetapi file gambar disajikan apa adanya tanpa transformasi server.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {    return [
      {
        source: "/tentang",
        destination: "/tentang-kami",
        permanent: true,
      },
      {
        source: "/syarat",
        destination: "/syarat-ketentuan",
        permanent: true,
      },
      {
        source: "/artikel/:slug",
        destination: "/:slug",
        permanent: true, // 301 Permanent Redirect untuk SEO
      },
      // Redirect semua /kategori/:slug ke root level /:slug
      {
        source: "/kategori/nasional",
        destination: "/nasional",
        permanent: true,
      },
      {
        source: "/kategori/pertahanan",
        destination: "/pertahanan",
        permanent: true,
      },
      {
        source: "/kategori/politik",
        destination: "/politik",
        permanent: true,
      },
      {
        source: "/kategori/ekonomi",
        destination: "/ekonomi",
        permanent: true,
      },
      {
        source: "/kategori/dunia",
        destination: "/dunia",
        permanent: true,
      },
      {
        source: "/kategori/peduli",
        destination: "/peduli",
        permanent: true,
      },
    ];
  },
  // Pengaman fallback: kanal baru TANPA halaman root-level dipetakan
  // /<slug> -> /kategori/<slug> secara internal (URL tetap, tanpa 404).
  // SENGAJA hanya 4 slug baru: nasional/politik/pertahanan/ekonomi/dunia/
  // peduli punya halaman root + redirect 301 di atas — memasukkannya ke sini
  // akan membayangi halaman asli / berisiko loop redirect.
  async rewrites() {
    return [
      // MODUL 4 — CYBER DECEPTION: `/.git/*` tidak bisa dibuat sebagai folder
      // route karena Git menolak melacak apa pun di dalam direktori `.git`
      // (akan hilang saat deploy via Vercel/Git). Petakan URL umpan ke handler
      // `app/api/decoy/git/[...path]` yang mencatat & menahan pemindai.
      {
        source: "/.git/:path*",
        destination: "/api/decoy/git/:path*",
      },
      // MODUL 4 — honeytoken `.env`: berkas dotfile tidak bisa dijadikan
      // folder route Next.js, jadi petakan ke handler decoy. Kredensial di
      // dalamnya fiktif (contoh resmi AWS) — murni umpan.
      {
        source: "/.env",
        destination: "/api/decoy/env",
      },
      {
        source: "/.env.local",
        destination: "/api/decoy/env",
      },
      {
        source: "/:category(sosial-budaya|kesehatan|olahraga|keamanan)",
        destination: "/kategori/:category",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // MODUL 4 — CYBER DECEPTION: umpan fingerprint. Penyerang otomatis
          // (Nuclei/WhatWeb/WPScan) memilih payload berdasarkan header ini;
          // menampilkan stack LAMP fiktif membuat eksploitasi PHP/WordPress
          // yang tak relevan tetap dicoba dan langsung tertangkap decoy route.
          // Catatan: Vercel dapat menimpa `Server` pada edge jaringan; header
          // ini tetap berlaku untuk respons yang di-stream Next.js.
          {
            key: "Server",
            value: "Apache/2.4.52 (Ubuntu)",
          },
          {
            key: "X-Powered-By",
            value: "PHP/8.1.12",
          },
          {
            key: "X-Backend-Server",
            value: "web-node-03.internal.lan",
          },
          // Isolasi browsing context tanpa memutus popup iklan/AdSense:
          // popup yang dibuka dokumen ini tetap mempertahankan window.opener.
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
      // API = permukaan privat: jangan pernah diindeks mesin pencari dan
      // jangan boleh di-embed lintas situs (JSON tidak untuk <script>/<img>).
      {
        source: "/api(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
        ],
      },
      // Halaman admin tidak boleh masuk indeks/cache bersama.
      {
        source: "/admin(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      // Pengganti Cache-Control middleware untuk API (nol invocation).
      // KECUALIAN: path persis /api/articles (feed publik, cabang GET tanpa
      // `scope`) TIDAK dicakup aturan mana pun sehingga route handler-lah
      // yang menentukan: `public, s-maxage=60` untuk feed publik,
      // `no-store` eksplisit untuk cabang scope=all/mine/draft.
      // DIVERIFIKASI (next start + curl): header next.config MENANG atas
      // header route handler — karena itu seluruh rute privat harus
      // dieksplisitkan di sini. Pola /api/articles/:path* tidak dipakai
      // karena :path* ikut cocok dengan path tanpa sub-segmen.
      // Gambar /media/* mengatur immutable-nya sendiri di dalam route
      // handler (app/media/[name]/route.ts). Rute API BARU wajib ditambahkan
      // ke daftar ini agar tetap no-store.
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/analytics/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/articles/upload",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/articles/:id",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/articles/:id/stats",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/auth/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/categories",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/debug/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/og",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/og-image",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/sources",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/upload",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      // Cache images from Supabase Storage — immutable, 1 year.
      // (Aktif di dalam handler app/media/[name]/route.ts; aturan statis
      // ini dipertahankan sebagai lapis cadangan.)
      {
        source: "/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // MODUL 4: cache optimal untuk aset gambar & chunk statis Next —
      // cegah re-fetch berulang tanpa memicu preload usang.
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;