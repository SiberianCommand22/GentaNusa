import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getEditorialSession } from "@/lib/auth";
import { adminClient, isSupabaseReady } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isSupabaseReady().ok || !adminClient) {
      return NextResponse.json([]);
    }
    const [eventsRes, photosRes] = await Promise.all([
      adminClient
        .from("peduli_events")
        .select("*")
        .order("created_at", { ascending: false }),
      adminClient
        .from("peduli_photos")
        .select("*")
        .order("order_index", { ascending: true }),
    ]);

    if (eventsRes.error) {
      return NextResponse.json(
        { error: eventsRes.error.message },
        { status: 500 }
      );
    }
    if (photosRes.error) {
      return NextResponse.json(
        { error: photosRes.error.message },
        { status: 500 }
      );
    }
    const photos = Array.isArray(photosRes.data) ? photosRes.data : [];
    const combined = (eventsRes.data || []).map((ev) => ({
      ...ev,
      peduli_photos: photos.filter((p) => p.event_id === ev.id),
    }));
    return NextResponse.json(combined);
  } catch (e) {
    const error = e as { message?: string };
    return NextResponse.json({ error: error.message || "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getEditorialSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    if (!isSupabaseReady().ok || !adminClient) {
      return NextResponse.json({ error: "Storage belum siap" }, { status: 500 });
    }
    const body = await req.json();
    const { data, error } = await adminClient
      .from("peduli_events")
      .insert(body)
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
