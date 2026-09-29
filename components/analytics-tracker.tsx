"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const RESERVED_SLUGS = [
  "admin",
  "api",
  "cari",
  "tentang",
  "kebijakan-privasi",
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

function sendEvent(
  kind: "site" | "article",
  pathname: string,
  articleId?: number,
) {
  const visitorId = getVisitorId();
  void fetch("/api/analytics/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      path: pathname,
      ...(articleId ? { articleId } : {}),
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
      sendEvent("article", pathname, Number(legacyMatch[1]));
      return;
    }

    // Match new root-level /<slug> pattern for articles
    if (isArticlePath(pathname)) {
      sendEvent("article", pathname);
    }
  }, [pathname]);

  return null;
}
