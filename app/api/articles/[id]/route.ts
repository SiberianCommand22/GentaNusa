import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

async function getArticle(id: string) {
  const { data } = await adminClient.from("articles").select("*").eq("id", id).single();
  return data;
}

// GET /api/articles/[id] — satu artikel (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getArticle(id);
  if (!data) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/articles/[id] — update artikel (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body kosong" }, { status: 400 });

  const { data, error } = await adminClient
    .from("articles")
    .update({
      title: body.title,
      category: body.category,
      excerpt: body.excerpt,
      content: body.content,
      image: body.image ?? null,
      tags: body.tags ?? [],
      author: body.author,
      author_slug: body.authorSlug ?? null,
      author_role: body.authorRole ?? null,
      date: body.date,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/articles/[id] — hapus artikel (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const { id } = await params;
  const { error } = await adminClient.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}