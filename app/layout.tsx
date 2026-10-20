import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { SiteChrome } from "@/components/site-chrome";
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

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

// Viewport eksplisit memakai format bawaan Next.js App Router —
// menghindari tag <meta name="viewport"> manual yang duplikat (merusak
// rendering Safari Mobile: halaman kosong / freeze saat first paint).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `maximumScale: 5` menjaga zoom tetap TERSEDIA bagi pengguna low-vision
  // (aksesibilitas) sambil mencegah layout "terkunci" akibat zoom tak
  // terkendali di Safari iOS/macOS. JANGAN pernah memakai
  // `userScalable: false` — mematikan zoom di iOS Safari adalah regresi a11y.
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#F8FAFC",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gentanusa.id"),
  title: {
    default: "GentaNusa - Berita Terkini & Kabar Kedaulatan Nasional",
    template: "%s | GentaNusa",
  },
  description:
    "Portal berita nasional independen menyajikan informasi akurat, berimbang, dan terpercaya dari seluruh penjuru Nusantara.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "96x96" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "GentaNusa",
    description:
      "Portal berita nasional independen menyajikan kabar Nusantara terkini.",
    url: "https://gentanusa.id",
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "https://gentanusa.id/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "GentaNusa - Kabar Kedaulatan & Dinamika Nusantara",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GentaNusa",
    description:
      "Portal berita nasional independen menyajikan kabar Nusantara terkini.",
    images: ["https://gentanusa.id/og-default.jpg"],
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
    <html lang="id" className={`${sourceSerif.variable} ${inter.variable} ${jakarta.variable}`}>
      <body className={`${jakarta.className} bg-[#F8FAFC] text-slate-900 antialiased min-h-dvh flex flex-col justify-between`}>
        <AnalyticsTracker />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
