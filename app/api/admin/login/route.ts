import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

// Rate limiting: 5 percobaan per 15 menit per IP (in-memory, restart reset)
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

// Bandingkan password secara constant-time (anti timing attack)
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Panjang sama tetap diproses agar timing seragam
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// Admin auth sederhana: password dari env (ADMIN_PASSWORD)
// Cookie httpOnly + expiry 7 hari
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }

  try {
    const { password } = await request.json().catch(() => ({}));
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      return NextResponse.json({ error: "ADMIN_PASSWORD belum di-set" }, { status: 500 });
    }
    if (!safeEqual(password ?? "", expected)) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("genta_admin", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/api/admin",
    });
    return res;
  } catch (e) {
    // Log detail hanya di development
    if (process.env.NODE_ENV === "development") {
      console.error("[Login Error]", e);
    }
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}