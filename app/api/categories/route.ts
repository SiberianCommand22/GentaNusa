import { NextResponse, type NextRequest } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

function ensureClient() {
  const r = isSupabaseReady();
  if (!r.ok) return { ok: false as const, error: r.reason };
  if (!adminClient) return { ok: false as const, error: "Service key belum di-set" };
  return { ok: true as const, client: adminClient };
}

// GET — daftar kategori (public) — tanpa field color (bukan untuk publik)
export async function GET() {
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  const { data, error } = await c.client
    .from("categories")
    .select("slug, name")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — tambah kategori (admin)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.name) {
    return NextResponse.json({ error: "slug, name wajib" }, { status: 400 });
  }
  const { data, error } = await c.client
    .from("categories")
    .insert([{ slug: body.slug, name: body.name }])
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
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug wajib" }, { status: 400 });
  const { error } = await c.client.from("categories").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}