// DINONAKTIFKAN: tabel `public.categories` tidak ada di Supabase.
// Daftar kanal GentaNusa bersifat tetap dan didefinisikan di kode
// (lib/data.ts STATIC_CATEGORIES + VALID_CATEGORIES di app/kategori/[slug]).
// Skrip ini dipertahankan sebagai arsip dan keluar tanpa menyentuh database.
console.log(
  "add-categories dinonaktifkan: kategori dikelola statis di kode, tidak ada tabel public.categories."
);
process.exit(0);
