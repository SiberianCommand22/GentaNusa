import type { NextConfig } from "next";

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
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
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
    ];
  },
};

export default nextConfig;