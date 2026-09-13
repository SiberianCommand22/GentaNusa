import { NextResponse } from "next/server";

// Admin auth sederhana: password dari env (ADMIN_PASSWORD)
// Cookie httpOnly + expiry 7 hari
export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({}));
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: "ADMIN_PASSWORD belum di-set" }, { status: 500 });
  }
  if (password !== expected) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("genta_admin", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: "/",
  });
  return res;
}