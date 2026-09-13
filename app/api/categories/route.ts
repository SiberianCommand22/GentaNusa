import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

// GET — daftar kategori (public)
export async function GET() {
  const { data, error } = await adminClient.from("categories").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — tambah kategori (admin)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.name || !body?.color) {
    return NextResponse.json({ error: "slug, name, color wajib" }, { status: 400 });
  }
  const { data, error } = await adminClient
    .from("categories")
    .insert([{ slug: body.slug, name: body.name, color: body.color }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE — hapus kategori (admin)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug wajib" }, { status: 400 });
  const { error } = await adminClient.from("categories").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}