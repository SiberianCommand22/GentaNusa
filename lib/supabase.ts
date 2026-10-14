import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Vercel memakai SUPABASE_SERVICE_ROLE_KEY, lokal memakai SUPABASE_SERVICE_KEY.
// Dukung keduanya agar Admin Client tidak null di salah satu environment.
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// PENTING: konstruksi klien TIDAK BOLEH melempar saat import modul.
// Bila env belum ter-set (mis. runtime produksi pincang), klien = null dan
// setiap route handler menjawab JSON 503 — bukan crash 500 tanpa body yang
// ditelan client admin menjadi tabel kosong "0 berita".
function safeCreate(
  u: string | undefined,
  k: string | undefined
): SupabaseClient | null {
  if (!u || !k) return null;
  try {
    return createClient(u, k);
  } catch {
    return null;
  }
}

export const supabaseAnon: SupabaseClient | null = safeCreate(url, anonKey);

export const adminClient: SupabaseClient | null = safeCreate(url, serviceKey);

export function isSupabaseReady() {
  if (!url) return { ok: false as const, reason: "NEXT_PUBLIC_SUPABASE_URL belum di-set (.env.local)" };
  if (!anonKey) return { ok: false as const, reason: "NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set (.env.local)" };
  return { ok: true as const, url };
}