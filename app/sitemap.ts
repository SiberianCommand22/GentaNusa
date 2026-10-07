import type { MetadataRoute } from "next";
import { getArticles, articleUrl } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";

// Rute kategori root yang bersih (tanpa prefix /kategori/*).
const CATEGORY_ROUTES = [
  "/nasional",
  "/pertahanan",
  "/politik",
  "/ekonomi",
  "/dunia",
  "/peduli",
];

// Halaman kelembagaan resmi.
const INSTITUTIONAL_ROUTES = [
  "/tentang-kami",
  "/pedoman-media-siber",
  "/kebijakan-privasi",
  "/syarat-ketentuan",
  "/kontak",
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
      url: `${SITE_URL}${r}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
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
