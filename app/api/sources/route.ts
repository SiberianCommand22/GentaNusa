import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

// GET — daftar sumber RSS (public)
export async function GET() {
  const { data, error } = await adminClient.from("sources").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — tambah sumber (admin)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.name || !body?.url) {
    return NextResponse.json({ error: "id, name, url wajib" }, { status: 400 });
  }
  const { data, error } = await adminClient
    .from("sources")
    .insert([
      {
        id: body.id,
        name: body.name,
        url: body.url,
        category: body.category || null,
        color: body.color || "#666666",
        notice: body.notice || null,
      },
    ])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE — hapus sumber (admin)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const { error } = await adminClient.from("sources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}