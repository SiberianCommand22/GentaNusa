import { NextRequest, NextResponse } from "next/server";

// Pending articles live in Supabase, not on disk. Writing to process.cwd() worked
// on the local dev machine but every write returned 500 on Vercel, where the
// filesystem is read-only — that is why Approve silently did nothing in the admin
// panel. The `staging-` author_slug marks a row as unpublished; the public site
// never filters on it today, so promote to a normal row by rewriting the slug.
const STAGING_SLUG = "staging-";

type PendingArticle = {
  title: string;
  excerpt: string;
  content: string[];
  tags: string[];
  category: string;
  date: string;
  image: string;
  sourceId: string;
  sourceLink: string;
};

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase env tidak lengkap");
  return { url, key };
}

async function supabase(method: string, path: string, body?: unknown, prefer?: string) {
  const { url, key } = env();
  return fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function loadPending(): Promise<PendingArticle[]> {
  const res = await supabase(
    "GET",
    `articles?author_slug=like.staging-*&select=title,excerpt,content,tags,category,date,image&order=date.desc`
  );
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map((row) => ({
    title: String(row.title ?? ""),
    excerpt: String(row.excerpt ?? ""),
    content: Array.isArray(row.content) ? (row.content as string[]) : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    category: String(row.category ?? "Nasional"),
    date: String(row.date ?? ""),
    image: String(row.image ?? ""),
    sourceId: String((row.content as { sourceId?: string } | undefined)?.sourceId ?? ""),
    sourceLink: String((row.content as { sourceLink?: string } | undefined)?.sourceLink ?? ""),
  }));
}

export async function GET() {
  try {
    return NextResponse.json(await loadPending());
  } catch (exc) {
    return NextResponse.json({ error: String(exc) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { action, index } = (await req.json()) as { action: string; index: number };

  let pending: PendingArticle[];
  try {
    pending = await loadPending();
  } catch (exc) {
    return NextResponse.json({ error: String(exc) }, { status: 500 });
  }

  if (index < 0 || index >= pending.length) {
    return NextResponse.json({ error: "Index tidak valid" }, { status: 400 });
  }
  const article = pending[index];

  if (action === "approve") {
    const res = await supabase(
      "PATCH",
      `articles?author_slug=eq.staging-${encodeURIComponent(slugOf(article.title))}`,
      {
        author: "Redaksi GentaNusa",
        author_slug: "redaksi-gentanusa",
        author_role: "Jurnalis GentaNusa",
        image: article.image || "/images/placeholder-article.svg",
      },
      "return=representation"
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Supabase HTTP ${res.status}: ${await res.text()}` }, { status: 500 });
    }
    const updated = (await res.json()) as unknown[];
    if (updated.length === 0) {
      return NextResponse.json({ error: "Baris pending tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Artikel dipublish", article });
  }

  if (action === "reject") {
    const res = await supabase(
      "DELETE",
      `articles?author_slug=eq.staging-${encodeURIComponent(slugOf(article.title))}`
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Supabase HTTP ${res.status}: ${await res.text()}` }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "Artikel ditolak", article });
  }

  return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
}

// Each staged row gets a unique slug so approve/reject can target it by query
// instead of by array index, which shifts as soon as the 30s poll refetches.
// Must stay byte-identical to staging_slug() in scripts/auto-article-gen.py —
// both roll a 32-bit multiply-and-add hash and print it in lowercase hex.
// Do not "improve" one side without the other.
function slugOf(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (Math.imul(hash, 31) + title.charCodeAt(i)) | 0;
  }
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base}-${(hash >>> 0).toString(16)}`;
}
