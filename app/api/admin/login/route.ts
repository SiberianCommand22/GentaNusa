import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "../../rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (shared, 10 requests per minute)
    const rl = rateLimit(request);
    if (!rl.ok) return rl.response;

    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email dan password diperlukan" },
        { status: 400 }
      );
    }

    const isAdmin = email === "admin" && password === process.env.ADMIN_PASSWORD;

    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Set session cookie
    const res = NextResponse.json({
      ok: true,
      admin: true,
      message: "Berhasil masuk",
    });

    res.cookies.set("admin_session", "1", {
      httpOnly: true,
      sameSite: "strict",
      path: "/api/admin",
      secure: true,
      maxAge: 60 * 60, // 1 hour
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}