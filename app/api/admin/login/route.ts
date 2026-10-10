import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp } from "@/lib/get-client-ip";
import {
  sessionFromSupabaseUser,
  SESSION_COOKIE,
  TOKEN_COOKIE,
  type EditorialSession,
} from "@/lib/auth";

// Track rate per IP (fallback in-memory; lihat lib catatan arsitektur di
// app/api/rate-limit.ts — tidak efektif lintas instance serverless, lapisi
// dengan aturan Cloudflare WAF,<Item:> lihat SECURITY.md).
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Bentuk ringkasan sesi yang disimpan di cookie httpOnly `genta_session`.
// PERINGATAN: cookie ini hanya petunjuk tampilan — lib/auth.ts TIDAK PERNAH
// memakainya untuk otentikasi. `user_id` adalah kunci kepemilikan artikel
// (Pilar 3); `author_slug` hanya petunjuk tampilan, bukan bukti milik.
type SessionPayload = {
  email: string;
  role: string;
  display_name: string;
  user_id: string | null;
  author_slug: string | null;
  is_admin: boolean;
};

function cookieFlags(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (IP asli via Cloudflare-aware helper)
    const ip = getClientIp(request);
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (entry && now < entry.resetAt) {
      if (entry.count >= RATE_LIMIT) {
        return NextResponse.json(
          { ok: false, error: "Too many attempts. Try again later." },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }

    const body = await request.json().catch(() => null);
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    // Seluruh autentikasi lewat Supabase Auth — tidak ada kredensial
    // hardcoded / jalur pintas master di kode sumber. Administrator Utama
    // wajib memiliki akun Supabase Auth dengan email MASTER_ADMIN_EMAIL
    // (hak admin diberi via kecocokan email terverifikasi atau app_metadata,
    // lihat scripts/assign-admin-role.ts).
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json(
        { ok: false, error: "Layanan autentikasi belum dikonfigurasi." },
        { status: 500 }
      );
    }
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, error: "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    const identity: EditorialSession = sessionFromSupabaseUser(data.user);
    const fallbackName = (data.user.email ?? email).split("@")[0];
    const session: SessionPayload = {
      email: identity.email ?? email,
      role: identity.role,
      display_name: identity.fullName ?? fallbackName,
      user_id: identity.userId,
      author_slug: identity.authorSlug,
      is_admin: identity.isAdmin,
    };
    const accessToken = data.session?.access_token ?? null;
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Gagal membuat sesi. Coba lagi." },
        { status: 500 }
      );
    }

    // Set sesi: flag admin (kompatibel dgn seluruh guard API) + ringkasan sesi.
    const res = NextResponse.json({
      ok: true,
      admin: true,
      message: "Berhasil masuk",
      session,
    });

    res.cookies.set("genta_admin", "1", cookieFlags(60 * 60 * 24 * 7)); // 7 hari
    res.cookies.set(SESSION_COOKIE, JSON.stringify(session), cookieFlags(60 * 60 * 24 * 7));
    // Access token Supabase disimpan httpOnly agar `auth.getUser()` bisa
    // memverifikasi ulang peran di setiap permintaan (anti pemalsuan cookie).
    res.cookies.set(TOKEN_COOKIE, accessToken, cookieFlags(60 * 60 * 24 * 7));

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
