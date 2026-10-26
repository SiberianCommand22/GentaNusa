import type { Metadata } from "next";
import { Footer } from "@/components/site";
import { PeduliView } from "@/components/peduli/PeduliView";
import { fetchPeduliEvents } from "@/lib/peduli";
import { siteUrl } from "@/lib/site";

// Data diambil dari Supabase per request (revalidate = 0 → tidak pernah
// disajikan dari ISR cache), sehingga unggahan foto/admin langsung terlihat.
export const revalidate = 0;

const SITE_URL = siteUrl();
const description =
  "Dokumentasi kegiatan sosial dan kemanusiaan GentaNusa: galeri jemuran polaroid, profil panti asuhan, dan kanal donasi.";

export const metadata: Metadata = {
  title: "GentaNusa Peduli — Dokumentasi Aksi Sosial & Kemanusiaan",
  description,
  keywords: [
    "peduli",
    "aksi sosial",
    "kemanusiaan",
    "panti asuhan",
    "relawan",
    "donasi",
    "GentaNusa",
  ],
  alternates: { canonical: `${SITE_URL}/peduli` },
  openGraph: {
    title: "GentaNusa Peduli — Dokumentasi Aksi Sosial & Kemanusiaan",
    description,
    url: `${SITE_URL}/peduli`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GentaNusa Peduli — Dokumentasi Aksi Sosial & Kemanusiaan",
    description,
  },
};

export default async function PeduliPage() {
  const events = await fetchPeduliEvents();
  return (
    <>
      <PeduliView initialEvents={events} />
      <Footer />
    </>
  );
}
