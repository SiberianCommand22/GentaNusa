-- =============================================================================
-- GentaNusa — Aktivasi definitif Row Level Security (RLS)
-- Jalankan via Supabase Dashboard > SQL Editor (idempotent, aman diulang).
-- Prasyarat RBAC: klaim JWT `app_metadata.role = 'admin'` ditetapkan lewat
-- Supabase Admin API, lihat scripts/assign-admin-role.ts. Jangan pernah
-- menulis role admin ke `user_metadata` (bisa diubah user via client SDK).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabel articles — baca publik hanya yang published, tulis hanya admin.
--    (CMS memakai Service Role Key server-side sehingga tidak terdampak RLS.)
-- ---------------------------------------------------------------------------
ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published articles" ON "public"."articles";
CREATE POLICY "Public read published articles"
  ON "public"."articles" FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admin full access articles" ON "public"."articles";
CREATE POLICY "Admin full access articles"
  ON "public"."articles" FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- 2. Tabel sources — hanya admin (dibaca/tulis server-side via service key).
-- ---------------------------------------------------------------------------
ALTER TABLE "public"."sources" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin only sources" ON "public"."sources";
CREATE POLICY "Admin only sources"
  ON "public"."sources" FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- 3. Bucket analytics-events — TERKUNCI PENUH untuk anon/authenticated.
--    Aplikasi membaca/menulis bucket ini SELALU dengan Service Role Key
--    server-side (lib/analytics-server.ts) yang melewati RLS, sehingga tidak
--    ada policy baca/tulis publik yang diperlukan. Hapus policy permisif bila
--    pernah ada.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow anon insert analytics" ON storage.objects;
DROP POLICY IF EXISTS "Public read analytics bucket" ON storage.objects;
-- (Sengaja tidak ada CREATE POLICY untuk analytics-events: default-deny.)

-- ---------------------------------------------------------------------------
-- 4. Bucket articles — baca publik (gambar artikel + kartu OG diakses
--    scraper tanpa auth), tulis/hapus hanya admin. Upload CMS lewat
--    /api/upload yang memakai service key + sesi terverifikasi.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read articles bucket" ON storage.objects;
CREATE POLICY "Public read articles bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'articles');

DROP POLICY IF EXISTS "Admin write articles bucket" ON storage.objects;
CREATE POLICY "Admin write articles bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'articles' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin delete articles bucket" ON storage.objects;
CREATE POLICY "Admin delete articles bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'articles' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin update articles bucket" ON storage.objects;
CREATE POLICY "Admin update articles bucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'articles' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (bucket_id = 'articles' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
