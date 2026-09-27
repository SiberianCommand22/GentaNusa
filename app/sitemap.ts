import type { MetadataRoute } from "next";
import { getArticles, getCategories } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/tentang`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ] as MetadataRoute.Sitemap;

  const categoryPages = (await getCategories()).map((c) => ({
    url: `${SITE_URL}/kategori/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Pinning lastModified to "now" told Google every article changed today, which is
  // a lie it learns to ignore. Per-article dates are already stored as YYYY-MM-DD.
  const articlePages = (await getArticles())
    .filter((a) => a.id <= 1000)
    .map((a) => ({
      url: `${SITE_URL}/artikel/${a.id}`,
      lastModified: /^\d{4}-\d{2}-\d{2}/.test(a.date)
        ? new Date(`${a.date}T00:00:00+07:00`)
        : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...categoryPages, ...articlePages];
}