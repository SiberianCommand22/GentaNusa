/**
 * Seed jurnalis tambahan GentaNusa ke Supabase Auth (idempoten).
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

type NewUser = {
  name: string;
  email: string;
  password: string;
  slug: string;
  /** Peran redaksi; default "editor". Ditulis ke app_metadata.role. */
  role?: "editor" | "admin";
};

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
  {
    name: "Fakhri Putra",
    email: "fakhri.putra@gentanusa.id",
    password: "GentaNusa2026!Fakhri#Secure",
    slug: "fakhri-putra",
  },
  {
    name: "Muh. Dafa Putra Anindito",
    email: "dafa.anindito@gentanusa.id",
    password: "GentaNusa2026!Dafa#Secure",
    slug: "muh-dafa-putra-anindito",
  },
  {
    name: "Devan Nizar",
    email: "devan.nizar@gentanusa.id",
    password: "GentaNusa2026!Devan#Secure",
    slug: "devan-nizar",
  },
  {
    name: "Thaqif Sahama",
    email: "thaqif.sahama30@gentanusa.id",
    password: "GentaNusa2026!Thaqif#Secure",
    slug: "thaqif-sahama",
  },
  {
    name: "Hanaya Cahyani",
    email: "hanaya.cahyani@gentanusa.id",
    password: "GentaNusa2026!Hanaya#Secure",
    slug: "hanaya-cahyani",
  },
  {
    name: "Tika",
    email: "tika@gentanusa.id",
    password: "GentaNusa2026!Tika#Secure",
    slug: "tika",
  },
  {
    name: "Adyuta Dhaniswara",
    email: "adyuta.dhaniswara@gentanusa.id",
    password: "GentaNusa2026!Adyuta#Secure",
    slug: "adyuta-dhaniswara",
  },
  {
    name: "Dimas Arrizki",
    email: "dimas.arrizki@gentanusa.id",
    password: "GentaNusa2026!Dimas#Secure",
    slug: "dimas-arrizki",
    role: "editor",
  },
  {
    name: "Adhira Bachtiar",
    email: "adhira.bachtiar@gentanusa.id",
    password: "GentaNusa2026!Adhira#Secure",
    slug: "adhira-bachtiar",
    role: "editor",
  },
  {
    name: "Chelsea Aulya",
    email: "chelsea.aulya@gentanusa.id",
    password: "GentaNusa2026!Chelsea#Secure",
    slug: "chelsea-aulya",
    role: "editor",
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

async function findUserIdByEmail(email: string): Promise<string | null> {
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error || !data?.users) return null;
    const found = data.users.find(
      (u) => (u.email ?? "").trim().toLowerCase() === email.toLowerCase()
    );
    if (found) return found.id;
    if (data.users.length < 100) return null;
    page++;
    if (page > 100) return null;
  }
}

// Peran redaksi WAJIB di app_metadata (dibaca middleware + login API).
// user_metadata.role hanya label tampilan — tidak pernah memberi hak akses.
async function ensureEditorAppRole(
  email: string,
  role: "editor" | "admin" = "editor"
): Promise<boolean> {
  const userId = await findUserIdByEmail(email);
  if (!userId) return false;
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { ...(data?.user?.app_metadata ?? {}), role },
    user_metadata: { ...(data?.user?.user_metadata ?? {}), role },
  });
  return !error;
}

async function seed(): Promise<void> {
  console.log("Mendaftarkan jurnalis tambahan GentaNusa...");
  for (const user of users) {
    const role = user.role ?? "editor";
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      // AKAR BUG LOGIN EDITOR: versi lama hanya menulis user_metadata.role
      // (bisa diubah user, diabaikan middleware) sehingga akun jurnalis
      // selalu ditolak gerbang /admin dan mental ke beranda `/`.
      // app_metadata.role di bawah inilah yang dibaca middleware + login API.
      app_metadata: { role },
      user_metadata: {
        full_name: user.name,
        role,
        author_slug: user.slug,
        author_role: "Redaktur GentaNusa",
      },
    });
    if (error) {
      if (isAlreadyRegistered(error.message)) {
        // Akun lama (pra-perbaikan) tidak punya app_metadata.role — perbaiki
        // agar bisa masuk /admin tanpa redirect ke `/`.
        const fixed = await ensureEditorAppRole(user.email, role);
        console.warn(
          `[SKIP / TERDAFTAR] ${user.email}: sudah ada` +
            (fixed ? ` — app_metadata.role=${role} dipastikan.` : " — GAGAL menanam app_metadata.role, jalankan scripts/backfill-editor-roles.ts --apply.")
        );
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
