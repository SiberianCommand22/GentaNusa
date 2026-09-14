import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import { BackToTop } from "@/components/back-to-top";
import { BackgroundCanvas } from "@/components/background-canvas";
import { Header, Footer } from "@/components/site";

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
  title: "GentaNusa — Berita Nusantara Terkini",
  description:
    "GentaNusa menyajikan berita politik, ekonomi, dan nasional Indonesia secara akurat, cepat, dan terpercaya.",
  openGraph: {
    title: "GentaNusa — Berita Nusantara Terkini",
    description:
      "GentaNusa menyajikan berita politik, ekonomi, dan nasional Indonesia secara akurat, cepat, dan terpercaya.",
    url: "https://gentanusa.id",
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${sourceSerif.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("genta-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body style={{ minHeight: "100vh" }}>
        <BackgroundCanvas />
        <Header />
        <main>{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}