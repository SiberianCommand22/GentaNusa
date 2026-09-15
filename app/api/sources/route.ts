import { NextResponse, type NextRequest } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { apiError } from "../error-handler";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

function ensureClient() {
  const r = isSupabaseReady();
  if (!r.ok) return { ok: false as const, error: r.reason };
  if (!adminClient) return { ok: false as const, error: "Service key belum di-set" };
  return { ok: true as const, client: adminClient };
}

// GET — daftar sumber RSS (public)
export async function GET() {
  try {
    const c = ensureClient();
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
    const { data, error } = await c.client.from("sources").select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return apiError(e);
  }
}

// POST — tambah sumber (admin)
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
    }
    const c = ensureClient();
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
    const body = await req.json().catch(() => null);
    if (!body?.url || !body?.name) {
      return NextResponse.json({ error: "url dan name wajib" }, { status: 400 });
    }
    const { data, error } = await c.client
      .from("sources")
      .insert([{ name: body.name, url: body.url, active: body.active ?? true }])
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

// DELETE — hapus sumber (admin)
export async function DELETE(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
    }
    const c = ensureClient();
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
    const { error } = await c.client.from("sources").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}