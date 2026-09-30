-- Migrasi kolom tambahan tabel articles (jalankan via Supabase SQL Editor).
-- Idempotent: aman dijalankan ulang bila kolom sudah ada.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_caption TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS lead TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
