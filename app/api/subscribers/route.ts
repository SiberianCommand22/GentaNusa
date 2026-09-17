import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "../rate-limit";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { apiError } from "../error-handler";

function ensureClient() {
  const r = isSupabaseReady();
  if (!r.ok) return { ok: false as const, error: r.reason };
  if (!adminClient) return { ok: false as const, error: "Service key belum di-set" };
  return { ok: true as const, client: adminClient };
}

// GET /api/subscribers — daftar email subscriber (admin)
export async function GET(req: NextRequest) {
  try {
    if (req.cookies.get("admin_session")?.value !== "1") {
      return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
    }
    const c = ensureClient();
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
    const { data, error } = await c.client
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e) {
    return apiError(e);
  }
}

// POST /api/subscribers — daftarkan email (publik, dari form)
export async function POST(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.ok) return rl.response;

  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }
    const c = ensureClient();
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
    const { error } = await c.client.from("subscribers").insert([{ email }]);
    if (error) {
      if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}