"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const RESERVED_SLUGS = [
  "admin",
  "api",
  "cari",
  "tentang",
  "tentang-kami",
  "kebijakan-privasi",
  "pedoman-media-siber",
  "syarat-ketentuan",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "kontak",
  "susunan-redaksi",
  "sindikasi",
  "kategori",
  "penulis",
  "privasi",
  "syarat",
  "feed.xml",
  "news-sitemap.xml",
];

function getVisitorId() {
  const key = "gentanusa_visitor_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

function isTrackablePath(pathname: string) {
  return (
    pathname !== "/admin" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/media/")
  );
}

function isArticlePath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return false;
  const slug = segments[0];
  return !RESERVED_SLUGS.includes(slug);
}

// Identitas artikel dibaca dari atribut data-* yang dirender halaman
// detail artikel — tracker global tidak punya akses ke data server.
function readArticleIdentity(): { articleId?: number; slug?: string } {
  const el = document.querySelector("[data-article-id]");
  const out: { articleId?: number; slug?: string } = {};
  const idAttr = el?.getAttribute("data-article-id");
  if (idAttr && /^\d+$/.test(idAttr)) out.articleId = Number(idAttr);
  const slugAttr = el?.getAttribute("data-article-slug");
  if (slugAttr) out.slug = slugAttr;
  return out;
}

function sendEvent(
  kind: "site" | "article",
  pathname: string,
  extra?: { articleId?: number; slug?: string },
) {
  const visitorId = getVisitorId();
  void fetch("/api/analytics/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      path: pathname,
      ...(extra?.articleId ? { articleId: extra.articleId } : {}),
      ...(extra?.slug ? { slug: extra.slug } : {}),
      visitorId,
    }),
    keepalive: true,
  }).catch(() => {});
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isTrackablePath(pathname)) return;

    sendEvent("site", pathname);

    // Match old /artikel/<id> pattern
    const legacyMatch = pathname.match(/^\/artikel\/(\d+)\/?$/);
    if (legacyMatch) {
      sendEvent("article", pathname, { articleId: Number(legacyMatch[1]) });
      return;
    }

    // Match new root-level /<slug> pattern for articles
    if (isArticlePath(pathname)) {
      const identity = readArticleIdentity();
      sendEvent("article", pathname, {
        articleId: identity.articleId,
        slug: identity.slug ?? pathname.replace(/^\//, ""),
      });
    }
  }, [pathname]);

  return null;
}
