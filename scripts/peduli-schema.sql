-- Peduli (Aksi Kemanusiaan) schema for GentaNusa
-- Run this in Supabase SQL editor to create required tables, bucket, and RLS.

-- 1) Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('peduli', 'peduli', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket policies: public read, authenticated upload/update/delete
DROP POLICY IF EXISTS "Public read access for peduli" ON storage.objects;
CREATE POLICY "Public read access for peduli"
ON storage.objects FOR SELECT
USING (bucket_id = 'peduli');

DROP POLICY IF EXISTS "Authenticated upload for peduli" ON storage.objects;
CREATE POLICY "Authenticated upload for peduli"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'peduli'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated update for peduli" ON storage.objects;
CREATE POLICY "Authenticated update for peduli"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'peduli'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'peduli'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated delete for peduli" ON storage.objects;
CREATE POLICY "Authenticated delete for peduli"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'peduli'
  AND auth.role() = 'authenticated'
);

-- 2) Tables
CREATE TABLE IF NOT EXISTS peduli_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label text NOT NULL,
  orphanage_name text NOT NULL,
  location_city text NOT NULL,
  headline text NOT NULL,
  summary text NOT NULL,
  children_count int DEFAULT 0,
  volunteers_count int DEFAULT 0,
  packages_distributed int DEFAULT 0,
  legal_number text,
  head_name text,
  phone text,
  address text,
  urgent_needs jsonb DEFAULT '[]'::jsonb,
  bank_accounts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS peduli_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES peduli_events(id) ON DELETE CASCADE,
  src text NOT NULL,
  alt text,
  caption text,
  handwritten_note text,
  photographer text,
  timestamp text,
  rotation_deg real DEFAULT 0,
  story_title text,
  story_description text,
  quote_text text,
  quote_author text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peduli_photos_event_id ON peduli_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_peduli_photos_order ON peduli_photos(event_id, order_index);

-- 3) RLS
ALTER TABLE peduli_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE peduli_photos ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Public read peduli_events" ON peduli_events;
CREATE POLICY "Public read peduli_events"
ON peduli_events FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public read peduli_photos" ON peduli_photos;
CREATE POLICY "Public read peduli_photos"
ON peduli_photos FOR SELECT
USING (true);

-- Authenticated with editorial/admin role can write
DROP POLICY IF EXISTS "Editorial insert peduli_events" ON peduli_events;
CREATE POLICY "Editorial insert peduli_events"
ON peduli_events FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'super_admin', 'administrator')
  )
);

DROP POLICY IF EXISTS "Editorial update peduli_events" ON peduli_events;
CREATE POLICY "Editorial update peduli_events"
ON peduli_events FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'super_admin', 'administrator')
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'super_admin', 'administrator')
  )
);

DROP POLICY IF EXISTS "Editorial delete peduli_events" ON peduli_events;
CREATE POLICY "Editorial delete peduli_events"
ON peduli_events FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'super_admin', 'administrator')
  )
);

DROP POLICY IF EXISTS "Editorial insert peduli_photos" ON peduli_photos;
CREATE POLICY "Editorial insert peduli_photos"
ON peduli_photos FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'super_admin', 'administrator')
  )
);

DROP POLICY IF EXISTS "Editorial update peduli_photos" ON peduli_photos;
CREATE POLICY "Editorial update peduli_photos"
ON peduli_photos FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'super_admin', 'administrator')
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'super_admin', 'administrator')
  )
);

DROP POLICY IF EXISTS "Editorial delete peduli_photos" ON peduli_photos;
CREATE POLICY "Editorial delete peduli_photos"
ON peduli_photos FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'editor')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'super_admin', 'administrator')
  )
);
