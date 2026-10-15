import { NextResponse } from "next/server";
import { ADMIN_FLAG_COOKIE, SESSION_COOKIE, TOKEN_COOKIE } from "@/lib/auth";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge.
export const runtime = 'nodejs';

// Cookie sesi bawaan @supabase/ssr di browser (`sb-<ref>-auth-token*`).
// Dibersihkan best-effort saat logout karena halaman login kini juga
// menyinkronkan sesi browser (setSession) selain cookie httpOnly kustom.
function ssrCookieNames(): string[] {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return [];
    const host = new URL(url).hostname; // <ref>.supabase.co
    const ref = host.split(".")[0];
    if (!ref) return [];
    const base = `sb-${ref}-auth-token`;
    return [base, `${base}.0`, `${base}.1`, `${base}.2`];
  } catch {
    return [];
  }
}

export async function POST() {
  return clearSession();
}

export async function GET() {
  return clearSession();
}

function clearSession() {
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
  for (const name of ssrCookieNames()) {
    res.cookies.set(name, "", { ...clear, httpOnly: false });
  }
  return res;
}