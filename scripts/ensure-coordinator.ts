/**
 * scripts/ensure-coordinator.ts
 *
 * Pastikan akun Koordinator Redaksi ada dan memegang `app_metadata.role =
 * "koordinator"` (hak: masuk /admin + dasbor analitik /admin/analitik-redaksi,
 * TANPA hak hapus / kelola semua berita).
 *
 * Idempoten: bila akun sudah ada, hanya sinkron role-nya. Bila belum ada,
 * akun dibuat (email terkonfirmasi) dengan kredensial default di bawah —
 * ganti password segera setelah login pertama lewat /admin/settings.
 *
 * Pemakaian (di terminal, dari root repo):
 *   npx tsx scripts/ensure-coordinator.ts
 *
 * Opsional via env:
 *   COORDINATOR_EMAIL=ahmad.luluil@gentanusa.id
 *   COORDINATOR_NAME="Ahmad Lu'luil"
 *   COORDINATOR_SLUG=ahmad-luluil
 *   COORDINATOR_PASSWORD=<kata-sandi>   (hanya dipakai saat membuat akun baru)
 *
 * Prasyarat env (dibaca dari process.env / .env.local bila memakai dotenv):
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Kredensial default Koordinator Redaksi — SELARAS dengan akun di
// scripts/seed-additional-users.ts (email + nama + slug sama). Password di
// sini HANYA dipakai bila akun belum ada; setelah ada, perubahan password
// dilakukan lewat /admin/settings (atau reset email Supabase).
const DEFAULT_EMAIL = "ahmad.luluil@gentanusa.id";
const DEFAULT_NAME = "Ahmad Lu'luil";
const DEFAULT_SLUG = "ahmad-luluil";
const DEFAULT_PASSWORD = "Genta#Ahmad2026!";

const ROLE = "koordinator";

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
  console.error("SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY belum terkonfigurasi!");
  process.exit(1);
}

const COORDINATOR_EMAIL = (process.env.COORDINATOR_EMAIL || DEFAULT_EMAIL)
  .trim()
  .toLowerCase();
const COORDINATOR_NAME = (process.env.COORDINATOR_NAME || DEFAULT_NAME).trim();
const COORDINATOR_SLUG = (process.env.COORDINATOR_SLUG || DEFAULT_SLUG).trim();
const COORDINATOR_PASSWORD = process.env.COORDINATOR_PASSWORD || DEFAULT_PASSWORD;

const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

async function main(): Promise<void> {
  console.log(`Memastikan Koordinator Redaksi: ${COORDINATOR_EMAIL} (role=${ROLE})`);

  const userId = await findUserIdByEmail(COORDINATOR_EMAIL);

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: COORDINATOR_EMAIL,
      password: COORDINATOR_PASSWORD,
      email_confirm: true,
      // app_metadata.role = sumber gerbang /admin + analitik (bukan user_metadata).
      app_metadata: { role: ROLE },
      user_metadata: {
        full_name: COORDINATOR_NAME,
        role: ROLE,
        author_slug: COORDINATOR_SLUG,
        author_role: "Koordinator Redaksi",
      },
    });
    if (error || !data?.user) {
      console.error(
        `Gagal membuat akun koordinator: ${error?.message ?? "unknown error"}`
      );
      process.exit(1);
    }
    console.log(
      `[SUKSES] Akun baru dibuat: ${data.user.email} (id=${data.user.id}), role=${ROLE}.`
    );
    console.log(
      "Catatan: segera ganti password default lewat /admin/settings atau reset email Supabase."
    );
    return;
  }

  const { data: before } = await supabaseAdmin.auth.admin.getUserById(userId);
  const beforeRole = String(
    (before?.user?.app_metadata as Record<string, unknown> | undefined)?.role ?? ""
  )
    .trim()
    .toLowerCase();

  if (beforeRole === ROLE) {
    console.log(`OK (sudah sinkron): ${COORDINATOR_EMAIL} -> app_metadata.role = "${ROLE}"`);
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(before?.user?.app_metadata ?? {}),
      role: ROLE,
    },
  });
  if (error || !data?.user) {
    console.error(`Gagal sinkron role: ${error?.message ?? "unknown error"}`);
    process.exit(1);
  }
  console.log(
    `[SINKRON] ${data.user.email ?? COORDINATOR_EMAIL}: app_metadata.role "${beforeRole || "(kosong)"}" -> "${ROLE}"`
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
