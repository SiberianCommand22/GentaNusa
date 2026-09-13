import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";

// GET /api/public/articles — daftar artikel lengkap (publik, live dari DB)
// Dipakai halaman web biar artikel baru langsung muncul tanpa build ulang
export async function GET() {
  const { data, error } = await adminClient
    .from("articles")
    .select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    date: a.date,
    author: a.author,
    authorSlug: a.author_slug ?? "redaksi-generic",
    authorRole: a.author_role ?? undefined,
    image: a.image ?? undefined,
    content: a.content ?? [],
    tags: a.tags ?? [],
  }));

  return NextResponse.json(mapped);
}