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

-- BACKFILL KEPEMILIKAN (wajib pasca-remediasi HIGH-2): CMS hanya mengakui
-- `user_id` sebagai bukti milik. Baris lawas dengan user_id NULL hanya
-- terlihat admin sampai di-backfill. Untuk tiap penulis, isi UUID akun
-- Supabase Auth-nya (Dashboard > Authentication > Users) per author_slug:
--   UPDATE articles SET user_id = '<uuid-penulis-1>' WHERE author_slug = '<slug-penulis-1>' AND user_id IS NULL;
--   UPDATE articles SET user_id = '<uuid-penulis-2>' WHERE author_slug = '<slug-penulis-2>' AND user_id IS NULL;
-- Verifikasi sisa yatim: SELECT id, author_slug FROM articles WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS articles_user_id_idx ON articles (user_id);
CREATE INDEX IF NOT EXISTS articles_author_slug_idx ON articles (author_slug);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status);

-- Menandai artikel milik Administrator Utama (role admin) sebagai milik admin.
-- Jalankan setelah kolom di atas siap, lalu sesuaikan UUID di bawah.
-- UPDATE articles SET user_id = '<uuid-admin>' WHERE author_slug = 'redaksi-generic';