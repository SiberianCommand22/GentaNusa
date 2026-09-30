/**
 * Seed 20 akun editor resmi GentaNusa ke Supabase Auth.
 *
 * Env yang dibaca (server-only, tidak pernah di-expose ke client):
 *   SUPABASE_SERVICE_ROLE_KEY  (disarankan)
 *   SUPABASE_SERVICE_KEY       (fallback)
 *   NEXT_PUBLIC_SUPABASE_URL  (opsional bila SUPABASE_URL terisi)
 *   SUPABASE_URL              (opsional)
 *
 * Aturan:
 *   - Idempotent: akun yang sudah ada di-skip, bukan di-error.
 *   - Semua akun dibuat dengan email_confirm: true.
 *   - user_metadata menyimpan full_name dan role untuk layer CMS.
 *
 * Jalankan: npm run seed  (node scripts/seed-users.js)
 */

const fs = require("node:fs");
const path = require("node:path");

const users = [
  { name: 'Arka Aditama', email: 'arka.aditama@gentanusa.id', password: 'Genta#Arka2026!' },
  { name: 'Hypatia Dorothy', email: 'hypatia.dorothy@gentanusa.id', password: 'Genta#Hypatia2026!' },
  { name: 'Bintang Kurnia T', email: 'bintang.kurnia@gentanusa.id', password: 'Genta#BintangK2026!' },
  { name: 'Ewing Nanda Kharisma', email: 'ewing.nanda@gentanusa.id', password: 'Genta#Ewing2026!' },
  { name: 'Rhaka Harun', email: 'rhaka.harun@gentanusa.id', password: 'Genta#Rhaka2026!' },
  { name: 'Raga Palinggih', email: 'raga.palinggih@gentanusa.id', password: 'Genta#Raga2026!' },
  { name: 'Muhammad Rizky Tritama', email: 'rizky.tritama@gentanusa.id', password: 'Genta#Rizky2026!' },
  { name: 'Duta Prasetya', email: 'duta.prasetya@gentanusa.id', password: 'Genta#Duta2026!' },
  { name: 'Rangga Pratama Adinata', email: 'rangga.pratama@gentanusa.id', password: 'Genta#Rangga2026!' },
  { name: 'Andreas Wicaksono', email: 'andreas.w@gentanusa.id', password: 'Genta#Andreas2026!' },
  { name: 'Eliam Bimasakti', email: 'eliam.bima@gentanusa.id', password: 'Genta#Eliam2026!' },
  { name: 'Alam Widodo', email: 'alam.widodo@gentanusa.id', password: 'Genta#Alam2026!' },
  { name: 'Farreli Aryatama Rozi', email: 'farreli.rozi@gentanusa.id', password: 'Genta#Farreli2026!' },
  { name: 'Felix Adikara', email: 'felix.adikara@gentanusa.id', password: 'Genta#Felix2026!' },
  { name: 'Faizal Adha', email: 'faizal.adha@gentanusa.id', password: 'Genta#Faizal2026!' },
  { name: 'Maiza Wira Mukti', email: 'maiza.wira@gentanusa.id', password: 'Genta#Maiza2026!' },
  { name: 'Bintang Firdaus', email: 'bintang.firdaus@gentanusa.id', password: 'Genta#BintangF2026!' },
  { name: 'Farhan Mahardika', email: 'farhan.mahardika@gentanusa.id', password: 'Genta#Farhan2026!' },
  { name: 'Muhammad Fazil', email: 'muhammad.fazil@gentanusa.id', password: 'Genta#Fazil2026!' },
  { name: 'Novan Hikmal', email: 'novan.hikmal@gentanusa.id', password: 'Genta#Novan2026!' },
];

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://dxysjpuisahujjacwvua.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY belum terkonfigurasi di environment!");
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  console.log("Mendaftarkan 20 editor resmi GentaNusa...");
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name, role: 'editor' }
    });
    if (error) {
      console.warn(`[SKIP / SUDAH ADA] ${u.email}: ${error.message}`);
    } else {
      console.log(`[SUKSES] Akun aktif: ${u.name} (${u.email})`);
    }
  }
  console.log("Pendaftaran 20 akun redaksi selesai.");
}

seed();
