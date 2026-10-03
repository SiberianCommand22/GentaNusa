import { NextResponse } from "next/server";
import { ADMIN_FLAG_COOKIE, SESSION_COOKIE, TOKEN_COOKIE } from "@/lib/auth";

export async function GET() {
  const res = NextResponse.json({ ok: true });
  const clear = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
  res.cookies.set(ADMIN_FLAG_COOKIE, "", clear);
  res.cookies.set(SESSION_COOKIE, "", clear);
  res.cookies.set(TOKEN_COOKIE, "", clear);
  return res;
}