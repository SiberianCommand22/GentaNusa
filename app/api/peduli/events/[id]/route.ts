import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getEditorialSession } from "@/lib/auth";
import { adminClient, isSupabaseReady } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEditorialSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  try {
    if (!isSupabaseReady().ok || !adminClient) {
      return NextResponse.json({ error: "Storage belum siap" }, { status: 500 });
    }
    const body = await req.json();
    const { data, error } = await adminClient
      .from("peduli_events")
      .update(body)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    try {
      revalidatePath("/kategori/peduli");
      revalidatePath("/peduli");
    } catch {}
    return NextResponse.json(data);
  } catch (e) {
    const error = e as { message?: string };
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEditorialSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  try {
    if (!isSupabaseReady().ok || !adminClient) {
      return NextResponse.json({ error: "Storage belum siap" }, { status: 500 });
    }
    const { error } = await adminClient
      .from("peduli_events")
      .delete()
      .eq("id", id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    try {
      revalidatePath("/kategori/peduli");
      revalidatePath("/peduli");
    } catch {}
    return NextResponse.json({ ok: true });
  } catch (e) {
    const error = e as { message?: string };
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status: 500 });
  }
}
