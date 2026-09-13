import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

// Service client: punya akses penuh (tulis/hapus) — HANYA di server
export const adminClient = createClient(url, serviceKey || "");

// Baca client: tanpa kunci rahasia (buat cek koneksi)
export const publicClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");