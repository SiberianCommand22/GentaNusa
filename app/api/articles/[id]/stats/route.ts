import { NextResponse, type NextRequest } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getEditorialSession } from "@/lib/auth";

// Statistik artikel: administrator saja — sesi wajib terverifikasi
// Supabase Auth, bukan flag cookie mentah.
async function requireAdmin() {
  const session = await getEditorialSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Akses ditolak. Wajib login." }, { status: 401 }) };
  }
  if (!session.isAdmin) {
    return { error: NextResponse.json({ error: "Hanya Administrator." }, { status: 403 }) };
  }
  return { session };
}

function ensureClient() {
  const r = isSupabaseReady();
  if (!r.ok) return { ok: false as const, error: r.reason };
  if (!adminClient) return { ok: false as const, error: "Service key belum di-set" };
  return { ok: true as const, client: adminClient };
}

// GET /api/articles/[id]/stats — statistik artikel (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  const { id } = await params;
  const { data, error } = await c.client
    .from("article_stats")
    .select("*")
    .eq("article_id", id)
    .single();
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? { article_id: id, views: 0, likes: 0, shares: 0 });
}

// POST /api/articles/[id]/stats — update views/likes/shares (admin)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  const body = await req.json().catch(() => null);
  const { id } = await params;
  const { data, error } = await c.client
    .from("article_stats")
    .upsert(
      {
        article_id: id,
        views: body?.views ?? 0,
        likes: body?.likes ?? 0,
        shares: body?.shares ?? 0,
      },
      { onConflict: "article_id" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}