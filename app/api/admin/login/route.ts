import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp } from "@/lib/get-client-ip";
import {
  sessionFromSupabaseUser,
  MASTER_ADMIN_EMAIL,
  SESSION_COOKIE,
  TOKEN_COOKIE,
  type EditorialSession,
} from "@/lib/auth";

// Track rate per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Master Administrator — akses penuh (Role: Superadmin).
const MASTER_EMAIL = MASTER_ADMIN_EMAIL;
const MASTER_PASSWORD = "siberiannibos133";

// Role redaksi yang diizinkan masuk via Supabase Auth.
const EDITOR_ROLES = new Set(["superadmin", "admin", "editor", "redaksi"]);

// Bentuk ringkasan sesi yang disimpan di cookie httpOnly `genta_session`.
// `user_id` + `author_slug` adalah kunci kepemilikan artikel (Pilar 3).
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

    let session: SessionPayload | null = null;
    let accessToken: string | null = null;

    // 1. Pemeriksaan Master Administrator
    if (email.trim().toLowerCase() === MASTER_EMAIL && password === MASTER_PASSWORD) {
      session = {
        email: MASTER_EMAIL,
        role: "superadmin",
        display_name: "Master Admin",
        user_id: null,
        author_slug: null,
        is_admin: true,
      };
    } else {
      // 2. Pemeriksaan Tim Redaksi via Supabase Auth
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
      const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
      const role = String(meta.role ?? "").toLowerCase();
      if (!EDITOR_ROLES.has(role)) {
        return NextResponse.json(
          { ok: false, error: "Email atau kata sandi tidak valid." },
          { status: 401 }
        );
      }
      const identity: EditorialSession = sessionFromSupabaseUser(data.user);
      const fallbackName = (data.user.email ?? email).split("@")[0];
      session = {
        email: identity.email ?? email,
        role: identity.role,
        display_name: identity.fullName ?? fallbackName,
        user_id: identity.userId,
        author_slug: identity.authorSlug,
        is_admin: identity.isAdmin,
      };
      accessToken = data.session?.access_token ?? null;
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
    if (accessToken) {
      res.cookies.set(TOKEN_COOKIE, accessToken, cookieFlags(60 * 60 * 24 * 7));
    }

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
