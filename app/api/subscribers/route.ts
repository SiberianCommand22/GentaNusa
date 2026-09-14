import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";

// GET /api/subscribers — daftar email subscriber (admin)
export async function GET(req: NextRequest) {
  if (req.cookies.get("genta_admin")?.value !== "1") {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const { data, error } = await adminClient
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/subscribers — daftarkan email (publik, dari form)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  }
  const { error } = await adminClient.from("subscribers").insert([{ email }]);
  if (error) {
    // Email sudah terdaftar (unique) — anggap sukses, jangan error ke user
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}