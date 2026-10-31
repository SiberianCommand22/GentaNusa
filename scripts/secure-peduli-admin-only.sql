-- =============================================================================
-- LOCKDOWN: Kanal Peduli — Administrator / Superadmin ONLY
-- =============================================================================
-- Tujuan: membatasi akses tulis (INSERT/UPDATE/DELETE) tabel peduli_events
-- dan peduli_photos HANYA untuk peran admin (app_metadata.role).
--
-- Catatan pembacaan (SELECT) publik TETAP dibuka agar halaman publik
-- /peduli dan /kategori/peduli tidak rusak — keduanya membaca via
-- service-role yang melewati RLS, jadi kebijakan SELECT di sini hanya
-- relevan untuk klien anon/authenticated biasa. Menyimpan SELECT publik
-- adalah pilihan sadar agar tidak ada perubahan perilaku publik.
--
-- Sumber kebenaran peran: auth.jwt() -> 'app_metadata' ->> 'role'.
-- user_metadata TIDAK dipakai (bisa diubah user = celah eskalasi).
--
-- Jalankan di SQL Editor Supabase (postgres). Idempoten.
-- =============================================================================

-- Aktifkan RLS pada kedua tabel modul Peduli.
ALTER TABLE public.peduli_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peduli_photos ENABLE ROW LEVEL SECURITY;

-- Hapus seluruh kebijakan lama (termasuk "FOR ALL TO authenticated USING (true)"
-- yang terlalu longgar) agar benar-benar bersih & idempoten.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('peduli_events', 'peduli_photos')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                   pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- peduli_events
-- ---------------------------------------------------------------------------

-- SELECT publik: halaman publik /peduli & /kategori/peduli tetap terbaca.
CREATE POLICY peduli_events_select_public ON public.peduli_events
  FOR SELECT USING (true);

-- INSERT: hanya admin (app_metadata.role).
CREATE POLICY peduli_events_insert_admin ON public.peduli_events
  FOR INSERT TO authenticated
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
      IN ('admin', 'superadmin', 'super_admin', 'administrator')
  );

-- UPDATE: hanya admin.
CREATE POLICY peduli_events_update_admin ON public.peduli_events
  FOR UPDATE TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
      IN ('admin', 'superadmin', 'super_admin', 'administrator')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
      IN ('admin', 'superadmin', 'super_admin', 'administrator')
  );

-- DELETE: hanya admin.
CREATE POLICY peduli_events_delete_admin ON public.peduli_events
  FOR DELETE TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
      IN ('admin', 'superadmin', 'super_admin', 'administrator')
  );

-- ---------------------------------------------------------------------------
-- peduli_photos
-- ---------------------------------------------------------------------------

CREATE POLICY peduli_photos_select_public ON public.peduli_photos
  FOR SELECT USING (true);

CREATE POLICY peduli_photos_insert_admin ON public.peduli_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
      IN ('admin', 'superadmin', 'super_admin', 'administrator')
  );

CREATE POLICY peduli_photos_update_admin ON public.peduli_photos
  FOR UPDATE TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
      IN ('admin', 'superadmin', 'super_admin', 'administrator')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
      IN ('admin', 'superadmin', 'super_admin', 'administrator')
  );

CREATE POLICY peduli_photos_delete_admin ON public.peduli_photos
  FOR DELETE TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
      IN ('admin', 'superadmin', 'super_admin', 'administrator')
  );

-- Muat ulang skema PostgREST agar kebijakan baru langsung aktif.
NOTIFY pgrst, 'reload schema';
