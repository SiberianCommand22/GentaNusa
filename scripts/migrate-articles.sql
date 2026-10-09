-- Migrasi kolom tambahan tabel articles (jalankan via Supabase SQL Editor).
-- Idempotent: aman dijalankan ulang bila kolom sudah ada.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_caption TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS lead TEXT;
-- Foto Tambahan / Foto Kedua (Tipe 2: dual-mode editorial).
-- `optional_image` = nama kanonis spesifikasi CMS; `secondary_image*` =
-- alias kompatibel-mundur yang sudah dipakai editor & halaman pembaca.
-- Kedua nama dipertahankan agar baris lama tidak rusak.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS optional_image TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS optional_image_caption TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS secondary_image TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS secondary_image_caption TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS secondary_image_credit TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Isolasi data penulis (multi-author isolation).
-- `user_id` = UUID akun Supabase Auth pemilik artikel. Diisi server dari sesi
-- saat artikel dibuat dan TIDAK PERNAH diubah saat artikel disunting.
-- Pembacaan CMS memfilter dengan `.or("user_id.eq.<uuid>,author_slug.eq.<slug>")`
-- sehingga penulis tidak pernah melihat berita penulis lain.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS user_id UUID;

-- Backfill-tetap: baris lama yang sudah punya author_slug tetap dapat diakses
-- lewat filter author_slug, jadi tidak ada data yang hilang.
CREATE INDEX IF NOT EXISTS articles_user_id_idx ON articles (user_id);
CREATE INDEX IF NOT EXISTS articles_author_slug_idx ON articles (author_slug);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status);

-- Menandai artikel milik Administrator Utama (role admin) sebagai milik admin.
-- Jalankan setelah kolom di atas siap, lalu sesuaikan UUID di bawah.
-- UPDATE articles SET user_id = '<uuid-admin>' WHERE author_slug = 'redaksi-generic';