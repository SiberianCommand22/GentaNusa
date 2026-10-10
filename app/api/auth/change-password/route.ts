import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEditorialSession } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

export const dynamic = "force-dynamic";

function passwordIssues(pw: string): string | null {
  if (pw.length < 8) return "Kata sandi baru minimal 8 karakter.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
    return "Kata sandi baru wajib mengandung kombinasi huruf, angka, dan simbol.";
  }
  return null;
}

// POST /api/auth/change-password — ganti kata sandi akun sendiri.
// 401 bila anonim; bukti kata sandi lama diverifikasi via signInWithPassword
// sebelum updateUser dijalankan dengan token sesi segar milik user.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (!limited.ok) return limited.response;

  const session = await getEditorialSession();
  if (!session || !session.email) {
    return NextResponse.json({ ok: false, error: "Wajib login." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirmPassword =
    typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { ok: false, error: "Semua field wajib diisi." },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { ok: false, error: "Konfirmasi kata sandi tidak cocok." },
      { status: 400 }
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { ok: false, error: "Kata sandi baru harus berbeda dari kata sandi saat ini." },
      { status: 400 }
    );
  }
  const issue = passwordIssues(newPassword);
  if (issue) {
    return NextResponse.json({ ok: false, error: issue }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Layanan autentikasi belum dikonfigurasi." },
      { status: 500 }
    );
  }

  // 1. Buktikan kepemilikan akun: kata sandi lama harus benar.
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email: session.email,
    password: currentPassword,
  });
  if (signInError || !signIn.session) {
    return NextResponse.json(
      { ok: false, error: "Kata sandi saat ini tidak sesuai." },
      { status: 400 }
    );
  }

  // 2. Update memakai token sesi segar milik user (bukan service key) —
  // cakupan tepat pada akun sendiri, mengikuti spec updateUser.
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
  });
  const { error: updateError } = await userClient.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(
    { success: true, message: "Kata sandi berhasil diperbarui" },
    { status: 200 }
  );
}
