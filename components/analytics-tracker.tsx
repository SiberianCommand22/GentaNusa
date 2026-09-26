"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

    const match = pathname.match(/^\/artikel\/(\d+)\/?$/);
    if (match) sendEvent("article", pathname, Number(match[1]));
  }, [pathname]);

  return null;
}
