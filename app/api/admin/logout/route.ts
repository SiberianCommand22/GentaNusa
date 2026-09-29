import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ ok: true });
  const clear = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
  res.cookies.set("genta_admin", "", clear);
  res.cookies.set("genta_session", "", clear);
  return res;
}