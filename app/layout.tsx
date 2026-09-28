import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { BackToTop } from "@/components/back-to-top";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";

export const metadata: Metadata = {
  title: {
    default: "GentaNusa — Berita Nusantara Terkini",
    template: "%s | GentaNusa",
  },
  description:
    "GentaNusa menyajikan berita politik, ekonomi, dan nasional Indonesia secara akurat, cepat, dan terpercaya.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "GentaNusa",
    title: "GentaNusa — Berita Nusantara Terkini",
    description:
      "GentaNusa menyajikan berita politik, ekonomi, dan nasional Indonesia secara akurat, cepat, dan terpercaya.",
    images: [
      {
        url: "/images/placeholder-article.svg",
        width: 1200,
        height: 630,
        alt: "GentaNusa — Berita Nusantara",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GentaNusa — Berita Nusantara Terkini",
    description:
      "GentaNusa menyajikan berita politik, ekonomi, dan nasional Indonesia secara akurat, cepat, dan terpercaya.",
    images: ["/images/placeholder-article.svg"],
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  other: process.env.BING_SITE_VERIFICATION
    ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${sourceSerif.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.jpg" type="image/jpeg" />
      </head>
      <body>
        <Navbar />
        <AnalyticsTracker />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
