/**
 * Seed 4 jurnalis tambahan GentaNusa ke Supabase Auth (idempoten).
 *
 * Env (server-only):
 *   SUPABASE_SERVICE_ROLE_KEY (disarankan) / SUPABASE_SERVICE_KEY (fallback)
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL
 *
 * Jalankan: npx tsx scripts/seed-additional-users.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type NewUser = { name: string; email: string; password: string; slug: string };

const users: NewUser[] = [
  {
    name: "Satria Mahanta",
    email: "satria.mahanta@gentanusa.id",
    password: "Genta#Satria2026!",
    slug: "satria-mahanta",
  },
  {
    name: "Muhammad Ahsyad Raihan Al Aziz",
    email: "ahsyad.raihan@gentanusa.id",
    password: "Genta#Ahsyad2026!",
    slug: "muhammad-ahsyad-raihan-al-aziz",
  },
  {
    name: "Afrizal Berampu",
    email: "afrizal.berampu@gentanusa.id",
    password: "Genta#Afrizal2026!",
    slug: "afrizal-berampu",
  },
  {
    name: "Ahmad Lu'luil",
    email: "ahmad.luluil@gentanusa.id",
    password: "Genta#Luluil2026!",
    slug: "ahmad-luluil",
  },
];

function loadEnvLocal(): void {
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
  "https://dxysjpuisahujjacwvua.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY belum terkonfigurasi di environment!");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isAlreadyRegistered(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already") ||
    m.includes("registered") ||
    m.includes("exists") ||
    m.includes("duplicate") ||
    m.includes("unique")
  );
}

async function seed(): Promise<void> {
  console.log("Mendaftarkan 4 jurnalis tambahan GentaNusa...");
  for (const user of users) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.name,
        role: "editor",
        author_slug: user.slug,
        author_role: "Redaktur GentaNusa",
      },
    });
    if (error) {
      if (isAlreadyRegistered(error.message)) {
        console.warn(`[SKIP / TERDAFTAR] ${user.email}: sudah ada`);
        continue;
      }
      console.warn(`[GAGAL] ${user.email}: ${error.message}`);
      continue;
    }
    console.log(`[SUKSES] Akun aktif: ${user.name} (${user.email})`);
  }
  console.log("Proses registrasi selesai.");
}

seed().catch((e) => {
  console.error("Seeder gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
