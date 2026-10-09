-- MODUL 2: Sanitasi permanen spasi naskah lama di Supabase.
-- Jalankan via Supabase SQL Editor. Idempotent: aman dijalankan ulang.
-- Membersihkan: spasi tak terlihat/NBSP, spasi ganda, spasi liar
-- sebelum tanda baca. Render runtime (sanitizeEditorialText) tetap
-- menjadi pertahanan lapis kedua untuk baris yang belum dibersihkan.
-- Catatan: pola kelas karakter di bawah memakai escape unicode Postgres
-- (U&'...'); bila editor SQL tidak mendukung sintaks U&, ganti dengan
-- karakter literal yang sama dalam file UTF-8.
UPDATE "public"."articles"
SET "content" = regexp_replace(
  regexp_replace(
    regexp_replace("content", U&'[\00A0\1680\180e\2000-\200a\202f\205f\3000\feff]', ' ', 'g'),
    '[ \t]+', ' ', 'g'
  ),
  ' +([,\.!?:;])', '\1', 'g'
)
WHERE "content" IS NOT NULL;
