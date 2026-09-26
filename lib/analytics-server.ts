import { randomUUID } from "node:crypto";
import { getArticles } from "@/lib/data";

const BUCKET = "analytics-events";
const EVENT_PREFIX = "events/";
const CACHE_TTL = 30_000;
const MAX_FILES = 10_000;

type EventKind = "site" | "article";

type AnalyticsEvent = {
  kind: EventKind;
  path: string;
  articleId?: number;
  recordedAt: string;
  visitorId?: string;
};

type StorageEntry = {
  name: string;
  id?: string | null;
};

type ArticleCount = {
  articleId: number;
  reads: number;
};

export type AnalyticsSummary = {
  totalSiteViews: number;
  totalArticleViews: number;
  articleCounts: ArticleCount[];
  dailySiteViews: Record<string, number>;
  dailyArticleViews: Record<string, number>;
  updatedAt: string;
  truncated: boolean;
  available: boolean;
};

export type AnalyticsReport = AnalyticsSummary & {
  articles: Array<{
    id: number;
    title: string;
    date: string;
    reads: number;
  }>;
};

let cachedSummary:
  | { data: AnalyticsSummary; timestamp: number }
  | null = null;

function envValues() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const readKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !readKey) {
    throw new Error("Supabase analytics env belum lengkap");
  }
  return { url: url.replace(/\/$/, ""), readKey };
}

function storageHeaders(readKey: string) {
  return {
    apikey: readKey,
    Authorization: `Bearer ${readKey}`,
    "Content-Type": "application/json",
  };
}

function emptySummary(): AnalyticsSummary {
  return {
    totalSiteViews: 0,
    totalArticleViews: 0,
    articleCounts: [],
    dailySiteViews: {},
    dailyArticleViews: {},
    updatedAt: new Date().toISOString(),
    truncated: false,
    available: false,
  };
}

function normalizeObjectName(prefix: string, name: string) {
  const clean = name.replace(/^\/+/, "");
  if (clean.startsWith(prefix.replace(/\/$/, ""))) return clean;
  return `${prefix.replace(/\/$/, "")}/${clean}`;
}

async function listStoragePage(
  prefix: string,
  offset: number,
): Promise<{ entries: StorageEntry[]; hasMore: boolean }> {
  const { url, readKey } = envValues();
  const response = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: storageHeaders(readKey),
    body: JSON.stringify({
      prefix,
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gagal membaca statistik: HTTP ${response.status}`);
  }

  const entries = (await response.json()) as StorageEntry[];
  return {
    entries: Array.isArray(entries) ? entries : [],
    hasMore: entries.length === 1000,
  };
}

async function collectStorageFiles(
  prefix: string,
  files: string[] = [],
  maxFiles = MAX_FILES,
): Promise<{ files: string[]; truncated: boolean }> {
  const pendingPrefixes = [prefix];
  let truncated = false;

  while (pendingPrefixes.length > 0 && files.length < maxFiles) {
    const currentPrefix = pendingPrefixes.pop();
    if (!currentPrefix) continue;

    let offset = 0;
    let hasMore = true;
    while (hasMore && files.length < maxFiles) {
      const page = await listStoragePage(currentPrefix, offset);
      offset += page.entries.length;

      for (const entry of page.entries) {
        if (files.length >= maxFiles) break;
        if (typeof entry.name !== "string") continue;

        const name = normalizeObjectName(currentPrefix, entry.name);
        if (!entry.id) {
          pendingPrefixes.push(`${name.replace(/\/+$/, "")}/`);
          continue;
        }

        files.push(name);
      }

      hasMore = page.hasMore;
    }

    if (files.length >= maxFiles) truncated = true;
  }

  return { files, truncated };
}

function parseEventPath(name: string):
  | { kind: EventKind; articleId?: number; date?: string }
  | null {
  const parts = name.split("/").filter(Boolean);
  if (
    parts.length < 5 ||
    parts[0] !== "events" ||
    (parts[2] !== "site" && parts[2] !== "article")
  ) {
    return null;
  }

  if (parts[2] === "site") {
    return { kind: "site", date: parts[1] };
  }

  const articleId = Number(parts[3]);
  if (!Number.isFinite(articleId) || articleId <= 0) return null;
  return { kind: "article", articleId, date: parts[1] };
}

async function readSummary(): Promise<AnalyticsSummary> {
  const { files, truncated } = await collectStorageFiles(EVENT_PREFIX);
  const articleCounts = new Map<number, number>();
  const dailySiteViews: Record<string, number> = {};
  const dailyArticleViews: Record<string, number> = {};
  let totalSiteViews = 0;
  let totalArticleViews = 0;

  for (const file of files) {
    const event = parseEventPath(file);
    if (!event?.date) continue;

    if (event.kind === "site") {
      totalSiteViews += 1;
      dailySiteViews[event.date] = (dailySiteViews[event.date] || 0) + 1;
      continue;
    }

    if (event.articleId) {
      totalArticleViews += 1;
      articleCounts.set(
        event.articleId,
        (articleCounts.get(event.articleId) || 0) + 1,
      );
      dailyArticleViews[event.date] =
        (dailyArticleViews[event.date] || 0) + 1;
    }
  }

  return {
    totalSiteViews,
    totalArticleViews,
    articleCounts: [...articleCounts.entries()]
      .map(([articleId, reads]) => ({ articleId, reads }))
      .sort((a, b) => b.reads - a.reads || b.articleId - a.articleId),
    dailySiteViews,
    dailyArticleViews,
    updatedAt: new Date().toISOString(),
    truncated,
    available: true,
  };
}

async function getSummary() {
  const now = Date.now();
  if (cachedSummary && now - cachedSummary.timestamp < CACHE_TTL) {
    return cachedSummary.data;
  }

  let summary: AnalyticsSummary;
  try {
    summary = await readSummary();
  } catch (error) {
    console.warn("[analytics] gagal membaca ringkasan", error);
    summary = emptySummary();
  }

  cachedSummary = { data: summary, timestamp: now };
  return summary;
}

export async function getAnalyticsSummary() {
  return getSummary();
}

export async function recordAnalytics(input: {
  kind: EventKind;
  path: string;
  articleId?: number;
  visitorId?: string;
}) {
  if (process.env.NODE_ENV === "development") return;
  if (input.kind === "article" && (!input.articleId || input.articleId <= 0)) {
    throw new Error("ID artikel tidak valid");
  }

  const { url, readKey } = envValues();
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const articleSegment = input.kind === "article" ? String(input.articleId) : "site";
  const objectName = `${EVENT_PREFIX}${date}/${input.kind}/${articleSegment}/${randomUUID()}.json`;
  const event: AnalyticsEvent = {
    kind: input.kind,
    path: input.path,
    ...(input.articleId ? { articleId: input.articleId } : {}),
    recordedAt: now.toISOString(),
    visitorId: input.visitorId?.slice(0, 100),
  };

  const response = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${objectName}`,
    {
      method: "POST",
      headers: storageHeaders(readKey),
      body: JSON.stringify(event),
    },
  );

  if (!response.ok) {
    throw new Error(`Gagal menyimpan statistik: HTTP ${response.status}`);
  }
}

export async function getArticleReadCount(articleId: number) {
  const summary = await getSummary();
  return summary.articleCounts.find((item) => item.articleId === articleId)?.reads || 0;
}

export async function getAnalyticsReport(): Promise<AnalyticsReport> {
  const summary = await getSummary();
  const articles = await getArticles();
  const counts = new Map(summary.articleCounts.map((item) => [item.articleId, item.reads]));
  const articleRows = articles
    .map((article) => ({
      id: article.id,
      title: article.title,
      date: article.date,
      reads: counts.get(article.id) || 0,
    }))
    .sort((a, b) => b.reads - a.reads || b.id - a.id);

  return {
    ...summary,
    articles: articleRows,
  };
}
