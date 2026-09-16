import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/site";

export const metadata: Metadata = {
  title: "Tidak Ditemukan",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: 64, fontWeight: 800, color: "#c8102e" }}>404</h1>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Halaman tidak ditemukan
        </h2>
        <p style={{ color: "#4a4a5a", marginBottom: 24 }}>
          Halaman yang Anda cari mungkin telah dipindahkan atau dihapus.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "#c8102e",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Kembali ke Beranda
        </Link>
      </main>
      <Footer />
    </>
  );
}