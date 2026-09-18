import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getArticles } from "@/lib/data";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

function ensureClient() {
  const r = isSupabaseReady();
  if (!r.ok) return { ok: false as const, error: r.reason };
  if (!adminClient) return { ok: false as const, error: "Service key belum di-set" };
  return { ok: true as const, client: adminClient };
}

// GET — daftar artikel (public) — tanpa field sensitif
export async function GET(req: NextRequest) {
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  try {
    const articles = await getArticles();
    return NextResponse.json(
      articles.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        excerpt: a.excerpt,
        date: a.date,
        author: a.author,
        image: a.image,
        tags: a.tags,
      }))
    );
  } catch (e) {
    return NextResponse.json({ error: "Gagal memuat artikel" }, { status: 500 });
  }
}

// POST — tambah artikel (admin)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const required = ["title", "category", "excerpt", "content", "tags", "image"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} wajib` }, { status: 400 });
    }
  }

  const { data, error } = await c.client
    .from("articles")
    .insert([
      {
        title: body.title,
        category: body.category,
        excerpt: body.excerpt,
        content: body.content,
        tags: body.tags,
        image: body.image,
        date: body.date || new Date().toISOString().split("T")[0],
        author: body.author || "Redaksi GentaNusa",
        author_slug: body.authorSlug || "redaksi-generic",
        author_role: body.authorRole || "Redaktur GentaNusa",
      },
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE — hapus artikel (admin)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) {
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  }
  const { error } = await c.client.from("articles").delete().eq("id", numId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}