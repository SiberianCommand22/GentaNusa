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
    ],
  },
  async redirects() {
    return [
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
            key: "X-Frame-Options",
            value: "DENY",
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
        ],
      },
      // Cache images from Supabase Storage — immutable, 1 year
      {
        source: "/api/media/:path*",
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