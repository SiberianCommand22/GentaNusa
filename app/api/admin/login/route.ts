import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Track rate per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Master Administrator — akses penuh (Role: Superadmin).
const MASTER_EMAIL = "siberiantwotwo@gmail.com";
const MASTER_PASSWORD = "siberiannibos133";

// Role redaksi yang diizinkan masuk via Supabase Auth.
const EDITOR_ROLES = new Set(["superadmin", "admin", "editor", "redaksi"]);

type SessionPayload = {
  email: string;
  role: string;
  display_name: string;
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
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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

    // 1. Pemeriksaan Master Administrator
    if (email === MASTER_EMAIL && password === MASTER_PASSWORD) {
      session = {
        email: MASTER_EMAIL,
        role: "superadmin",
        display_name: "Master Admin",
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
      const supabase = createClient(url, anonKey);
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
      const fallbackName = (data.user.email ?? email).split("@")[0];
      session = {
        email: data.user.email ?? email,
        role,
        display_name: String(meta.name ?? meta.display_name ?? fallbackName),
      };
    }

    // Set sesi: flag admin (kompatibel dgn seluruh guard API) + ringkasan sesi.
    const res = NextResponse.json({
      ok: true,
      admin: true,
      message: "Berhasil masuk",
      session,
    });

    res.cookies.set("genta_admin", "1", cookieFlags(60 * 60 * 24 * 7)); // 7 hari
    res.cookies.set("genta_session", JSON.stringify(session), cookieFlags(60 * 60 * 24 * 7));

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
