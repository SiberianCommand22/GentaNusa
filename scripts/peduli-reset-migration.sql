-- Peduli: reset kredensial akun redaksi + perbaiki schema-cache relasi FK.
-- Jalankan di Supabase SQL Editor (peran `postgres`). Idempoten — aman dijalankan ulang.

-- 0) Pastikan pgcrypto tersedia (untuk crypt()/gen_salt())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Reset password akun Administrator Utama
--    Email: dimas.arrizki@gentanusa.id
--    Password baru: GentaNusa2026!#Dimas
UPDATE auth.users
SET encrypted_password = crypt('GentaNusa2026!#Dimas', gen_salt('bf'))
WHERE email = 'dimas.arrizki@gentanusa.id';

-- 2) Pasang ulang FK peduli_photos.event_id dengan ON DELETE CASCADE.
--    Nama lama (jika ada) dibuang lebih dulu supaya tidak ganda.
ALTER TABLE peduli_photos DROP CONSTRAINT IF EXISTS fk_peduli_photos_event;
ALTER TABLE peduli_photos DROP CONSTRAINT IF EXISTS peduli_photos_event_id_fkey;

ALTER TABLE peduli_photos
  ADD CONSTRAINT fk_peduli_photos_event
  FOREIGN KEY (event_id)
  REFERENCES peduli_events (id)
  ON DELETE CASCADE;

-- 3) Paksa PostgREST me-reload schema cache agar relasi tampil di OpenAPI
NOTIFY pgrst, 'reload schema';
