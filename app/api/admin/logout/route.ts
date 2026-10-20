import { NextResponse } from "next/server";
import {
  ADMIN_FLAG_COOKIE,
  SESSION_COOKIE,
  TOKEN_COOKIE,
  sessionCookieFlags,
} from "@/lib/auth";

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
  // Atribut yang sama dengan saat ditulis (sessionCookieFlags di lib/auth.ts),
  // hanya `maxAge: 0` — penghapusan GAGAL bila atributnya tidak persis cocok
  // (Secure/SameSite/Path). Cookie Supabase SSR tetap `httpOnly: false`
  // karena memang ditulis oleh klien browser.
  const clear = sessionCookieFlags(0);
  res.cookies.set(ADMIN_FLAG_COOKIE, "", clear);
  res.cookies.set(SESSION_COOKIE, "", clear);
  res.cookies.set(TOKEN_COOKIE, "", clear);
  for (const name of ssrCookieNames()) {
    res.cookies.set(name, "", { ...clear, httpOnly: false });
  }
  return res;
}