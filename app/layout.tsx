import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gentanusa.id"),
  title: {
    default: "GentaNusa - Kabar Kedaulatan & Dinamika Nusantara",
    template: "%s | GentaNusa",
  },
  description:
    "Portal berita nasional independen menyajikan informasi akurat, berimbang, dan tepercaya.",
  openGraph: {
    title: "GentaNusa",
    description:
      "Portal berita nasional independen menyajikan kabar Nusantara terkini.",
    url: "https://www.gentanusa.id",
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "https://www.gentanusa.id/og-default.jpg",
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
    images: ["https://www.gentanusa.id/og-default.jpg"],
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
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`${jakarta.className} bg-[#F8FAFC] text-slate-900 antialiased min-h-screen flex flex-col justify-between`}>
        <AnalyticsTracker />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
