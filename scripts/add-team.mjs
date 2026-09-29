// Daftarkan akun Tim Redaksi GentaNusa (@gentanusa.id) ke Supabase Auth.
//
//   node scripts/add-team.mjs
//
// Membaca NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY dari environment
// (fallback: .env.local). Untuk setiap nama di TEAM: buat email resmi
// (mis. "Aldiansar" -> "aldiansar@gentanusa.id"), password awal default,
// dan user_metadata { name, role: "editor" } agar lolos login CMS.
// Menampilkan rekap akun (Nama, Email, Password) di console.
//
// Tambah/ubah nama di array TEAM, lalu jalankan ulang. Akun yang email-nya
// sudah terdaftar akan dilewati (ditandai EXISTS).
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// ---- Daftar tim: tambah nama di sini ----
const TEAM = ["Aldiansar", "Reza Pratama"];

// ---- Password awal default untuk semua akun baru ----
const DEFAULT_PASSWORD = "GentaNusa2026!";

const DOMAIN = "gentanusa.id";

function loadDotEnvLocal() {
  const env = {};
  try {
    const p = path.join(process.cwd(), ".env.local");
    if (!fs.existsSync(p)) return env;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // abaikan — pakai process.env saja
  }
  return env;
}

// "Reza Pratama" -> "rezapratama"; "Aldi-Ansar" -> "aldiansar"
function slugifyName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const fileEnv = loadDotEnvLocal();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || fileEnv.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("ERROR: butuh NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_KEY (env atau .env.local).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const recap = [];
for (const fullName of TEAM) {
  const slug = slugifyName(fullName);
  if (!slug) {
    console.warn(`SKIP: nama "${fullName}" tidak menghasilkan slug email.`);
    continue;
  }
  const email = `${slug}@${DOMAIN}`;
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name: fullName, role: "editor" },
    });
    if (error) {
      const exists = /already|exists|registered|duplicate/i.test(error.message);
      console.log(`${exists ? "EXISTS" : "FAIL"}  ${fullName} <${email}>${exists ? "" : ` — ${error.message}`}`);
      recap.push({ Nama: fullName, Email: email, Password: exists ? "(sudah terdaftar)" : `GAGAL: ${error.message}` });
      continue;
    }
    console.log(`OK     ${fullName} <${email}> (id: ${data.user?.id ?? "-"})`);
    recap.push({ Nama: fullName, Email: email, Password: DEFAULT_PASSWORD });
  } catch (e) {
    console.log(`FAIL   ${fullName} <${email}> — ${String(e)}`);
    recap.push({ Nama: fullName, Email: email, Password: `GAGAL: ${String(e)}` });
  }
}

console.log("\n=== Rekap Akun Redaksi ===");
console.table(recap);
console.log("Bagikan password awal secara aman; minta setiap redaksi menggantinya setelah login pertama.");
