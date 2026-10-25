import { NextResponse } from "next/server";
import { getEditorialSession } from "@/lib/auth";
import { adminClient, isSupabaseReady } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isSupabaseReady().ok || !adminClient) {
      return NextResponse.json([]);
    }
    const { data, error } = await adminClient
      .from("peduli_events")
      .select("*, peduli_photos(*)")
      .order("created_at", { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
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
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
