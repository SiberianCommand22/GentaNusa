import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

// GET /api/articles — daftar artikel (public)
export async function GET() {
  const { data, error } = await adminClient
    .from("articles")
    .select("*")
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/articles — tambah artikel (admin)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || !body.title || !body.content) {
    return NextResponse.json({ error: "title dan content wajib" }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from("articles")
    .insert([
      {
        title: body.title,
        category: body.category || "Nasional",
        excerpt: body.excerpt || "",
        content: body.content, // array string
        image: body.image || null,
        tags: body.tags || [],
        author: body.author || "Redaksi",
        author_slug: body.authorSlug || null,
        author_role: body.authorRole || null,
        date: body.date || new Date().toISOString().slice(0, 10),
      },
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}