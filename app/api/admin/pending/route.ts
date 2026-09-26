import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "lib", "data");
const PENDING_FILE = path.join(DATA_DIR, "pending-articles.json");

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

async function loadPending(): Promise<PendingArticle[]> {
  try {
    const data = await fs.readFile(PENDING_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePending(pending: PendingArticle[]): Promise<void> {
  const tmp = PENDING_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(pending, null, 2), "utf-8");
  await fs.rename(tmp, PENDING_FILE);
}

export async function GET() {
  const pending = await loadPending();
  return NextResponse.json(pending);
}

export async function POST(req: NextRequest) {
  const { action, index } = await req.json();
  const pending = await loadPending();

  if (index < 0 || index >= pending.length) {
    return NextResponse.json({ error: "Index tidak valid" }, { status: 400 });
  }

  if (action === "approve") {
    const article = pending.splice(index, 1)[0];
    await savePending(pending);

    // Insert to Supabase
    const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!serviceUrl || !serviceKey) {
      // Put back on error
      pending.splice(index, 0, article);
      await savePending(pending);
      return NextResponse.json({ error: "Supabase env tidak lengkap" }, { status: 500 });
    }

    const payload = {
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      date: article.date,
      author: "Redaksi GentaNusa",
      author_slug: "redaksi-gentanusa",
      author_role: "Jurnalis GentaNusa",
      image: article.image || "/images/placeholder-article.svg",
      content: article.content,
      tags: article.tags,
    };

    try {
      const res = await fetch(`${serviceUrl}/rest/v1/articles`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.text();
        // Put back on error
        pending.splice(index, 0, article);
        await savePending(pending);
        return NextResponse.json({ error: `Supabase HTTP ${res.status}: ${detail}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Artikel dipublish", article });
    } catch (exc) {
      pending.splice(index, 0, article);
      await savePending(pending);
      return NextResponse.json({ error: String(exc) }, { status: 500 });
    }
  }

  if (action === "reject") {
    const article = pending.splice(index, 1)[0];
    await savePending(pending);
    return NextResponse.json({ success: true, message: "Artikel ditolak", article });
  }

  return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
}