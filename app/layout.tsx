import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GentaNusa — Berita Nusantara Terkini",
    template: "%s | GentaNusa",
  },
  description:
    "GentaNusa menyajikan berita politik, ekonomi, dan nasional Indonesia secara akurat, cepat, dan terpercaya.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}