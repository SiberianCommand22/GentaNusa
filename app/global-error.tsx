"use client";

import { useRouter } from "next/navigation";

// Pemangkas terakhir (root error boundary): berlaku bila GALAT terjadi di
// tingkat `app/layout.tsx` itu sendiri — `app/error.tsx` TIDAK akan
// menanganinya, dan default Next.js menyisakan layar kosong/putih di
// Safari iOS. Berkat file ini pengguna SELALU mendapat antarmuka yang bisa
// dipulihkan.
//
// GAYA INLINE disengaja: komponen ini harus berdiri sendiri 100% tanpa
// mengandalkan CSS global/root layout yang ikut gagal dimuat.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#F8FAFC",
          color: "#0f172a",
        }}
      >
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: "100%",
              textAlign: "center",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 40,
            }}
          >
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>
              Layanan Sedang Terganggu
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
              Terjadi kesalahan teknis yang tidak terduga. Muat ulang halaman;
              bila masih berlanjut, coba beberapa saat lagi.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#c8102e",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Coba Lagi
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#c8102e",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
