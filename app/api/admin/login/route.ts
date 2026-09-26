import { NextRequest, NextResponse } from "next/server";

// Track rate per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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

    const body = await request.json();
    const { password } = body || {};

    if (!password) {
      return NextResponse.json({ ok: false, error: "Password diperlukan" }, { status: 400 });
    }

    const isAdmin = password === process.env.ADMIN_PASSWORD;

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Password salah" }, { status: 401 });
    }

    // Set cookie
    const res = NextResponse.json({
      ok: true,
      admin: true,
      message: "Berhasil masuk",
    });

    res.cookies.set("genta_admin", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}