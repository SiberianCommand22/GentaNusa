import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getEditorialSession, TOKEN_COOKIE } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

export const dynamic = "force-dynamic";

// POST|PATCH /api/auth/update-profile — perbarui nama tampilan penulis.
// displayName 2–60 karakter; ditulis ke user_metadata via token sesi milik
// user sendiri (cakupan tepat akun sendiri, bukan service key).
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (!limited.ok) return limited.response;

  const session = await getEditorialSession();
  if (!session || !session.userId) {
    return NextResponse.json({ ok: false, error: "Wajib login." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : "";

  if (!displayName || displayName.length < 2 || displayName.length > 60) {
    return NextResponse.json(
      { ok: false, error: "Nama tampilan wajib 2–60 karakter." },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!url || !anonKey || !token) {
    return NextResponse.json(
      { ok: false, error: "Sesi tidak valid. Login ulang." },
      { status: 401 }
    );
  }

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.updateUser({
    data: { display_name: displayName },
  });
  if (error || !data?.user) {
    const expired = /expired|invalid|jwt/i.test(error?.message ?? "");
    return NextResponse.json(
      { ok: false, error: expired ? "Sesi kedaluwarsa. Login ulang." : "Gagal memperbarui nama." },
      { status: expired ? 401 : 400 }
    );
  }

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const saved =
    typeof meta.display_name === "string" && meta.display_name.trim()
      ? meta.display_name.trim()
      : displayName;
  return NextResponse.json(
    {
      success: true,
      message: "Nama penulis berhasil diperbarui",
      user: { display_name: saved, email: data.user.email ?? session.email },
    },
    { status: 200 }
  );
}

export const PATCH = POST;
