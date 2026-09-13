import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!url) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL belum di-set (.env.local)");
}

// Client anon — HANYA baca (RLS: publik bisa select). Aman untuk halaman web.
export const supabaseAnon = createClient(
  url,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Service client — akses penuh (tulis/hapus). HANYA di route API admin.
export const adminClient = createClient(
  url,
  process.env.SUPABASE_SERVICE_KEY || ""
);