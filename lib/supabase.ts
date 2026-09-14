import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

export const supabaseAnon: SupabaseClient | null = url && anonKey
  ? createClient(url, anonKey)
  : null;

export const adminClient: SupabaseClient | null = url && serviceKey
  ? createClient(url, serviceKey)
  : null;

export function isSupabaseReady() {
  if (!url) return { ok: false as const, reason: "NEXT_PUBLIC_SUPABASE_URL belum di-set (.env.local)" };
  if (!anonKey) return { ok: false as const, reason: "NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set (.env.local)" };
  return { ok: true as const, url };
}