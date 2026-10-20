import type { MetadataRoute } from "next";
import { getArticles, articleUrl } from "@/lib/data";
import { siteUrl } from "@/lib/site";

// Sitemap hemat kuota: regenerasi maksimal 1x/jam dari cache CDN;
// invalidasi artikel baru tetap instan via revalidatePath di API tulis.
export const revalidate = 3600;

const SITE_URL = siteUrl();

// Rute kategori root yang bersih (tanpa prefix /kategori/*).
// "Dunia" dinaikkan ke hourly karena kanal internasional diperbarui
// paling sering dalam satu hari; sisanya daily.
const CATEGORY_ROUTES: { path: string; freq: "hourly" | "daily" }[] = [
  { path: "/nasional", freq: "daily" },
  { path: "/politik", freq: "daily" },
  { path: "/dunia", freq: "hourly" },
  { path: "/pertahanan", freq: "daily" },
  { path: "/ekonomi", freq: "daily" },
  { path: "/peduli", freq: "daily" },
];

// Kanal tanpa halaman root — diakses via /kategori/<slug>.
const CHANNEL_ROUTES = [
  "/kategori/sosial-budaya",
  "/kategori/kesehatan",
  "/kategori/olahraga",
  "/kategori/keamanan",
];

// Halaman kelembagaan resmi — semuanya route nyata (terverifikasi ada):
// /tentang (redirect 301 -> /tentang-kami) dan /syarat, /privasi (redirect)
// SENGAJA tidak dicantumkan agar sitemap bebas URL redirect/404.
const INSTITUTIONAL_ROUTES = [
  "/tentang-kami",
  "/pedoman-media-siber",
  "/kebijakan-privasi",
  "/syarat-ketentuan",
  "/kontak",
  "/susunan-redaksi",
  "/sindikasi",
  "/kategori",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...CATEGORY_ROUTES.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: 0.8,
    })),
    ...CHANNEL_ROUTES.map((r) => ({
      url: `${SITE_URL}${r}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...INSTITUTIONAL_ROUTES.map((r) => ({
      url: `${SITE_URL}${r}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  // Seluruh artikel berstatus 'published' langsung dari tabel `articles`
  // Supabase (getArticles sudah memfilter status=published di sisi DB).
  const articles = (await getArticles()).filter(
    (a) => (a.status ?? "published") === "published"
  );

  const articlePages = articles
    .filter((a) => a.id <= 100000)
    .map((a) => ({
      url: `${SITE_URL}${articleUrl(a)}`,
      lastModified: /^\d{4}-\d{2}-\d{2}/.test(a.date)
        ? new Date(`${a.date}T00:00:00+07:00`)
        : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...articlePages];
}
