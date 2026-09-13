import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import { BackToTop } from "@/components/back-to-top";
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

export const metadata: Metadata = {
  title: {
    default: "GentaNusa — Berita Nusantara Terkini",
    template: "%s | GentaNusa",
  },
  description:
    "GentaNusa menyajikan berita politik, ekonomi, dan nasional Indonesia secara akurat, cepat, dan terpercaya.",
  metadataBase: new URL("https://gentanusa.id"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://gentanusa.id",
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${sourceSerif.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("genta-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <BackToTop />
      </body>
    </html>
  );
}