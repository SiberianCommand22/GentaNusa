import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const SITE_URL = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Umpan: path ini tidak pernah ada di aplikasi nyata. Bot yang tetap
      // memanggilnya (mengabaikan robots) menyentuh decoy route dan tercatat.
      disallow: ["/admin-internal/", "/db-dump/", "/backup.sql"],
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  };
}