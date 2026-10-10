/**
 * scripts/assign-admin-role.ts
 *
 * Tetapkan role admin via Supabase Admin API (menulis `app_metadata`,
 * yang tidak bisa dimutasi user biasa via client SDK).
 *
 * Pemakaian (di terminal, dari root repo):
 *   npx tsx scripts/assign-admin-role.ts <EMAIL_ATAU_UUID> [role]
 *
 *   Contoh:
 *     npx tsx scripts/assign-admin-role.ts siberiantwotwo@gmail.com admin
 *     npx tsx scripts/assign-admin-role.ts 3fa85f64-... superadmin
 *
 * Alternatif via environment (tanpa argumen target):
 *   ADMIN_EMAIL=siberiantwotwo@gmail.com ADMIN_ROLE=admin npx tsx scripts/assign-admin-role.ts
 *
 * Prasyarat env (dibaca dari process.env / .env.local bila memakai dotenv):
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY
 *
 * Tanpa tsx, padanannya dengan ts-node:
 *   npx ts-node scripts/assign-admin-role.ts <EMAIL_ADMIN>
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = new Set(["admin", "superadmin", "editor"]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function printUsage(): void {
  console.error(`Tetapkan app_metadata.role user Supabase Auth (hak Administrator GentaNusa).

Pemakaian:
  npx tsx scripts/assign-admin-role.ts <EMAIL_ATAU_UUID> [role]
  npx ts-node scripts/assign-admin-role.ts <EMAIL_ADMIN>

Contoh:
  npx tsx scripts/assign-admin-role.ts siberiantwotwo@gmail.com admin
  npx tsx scripts/assign-admin-role.ts 3fa85f64-5717-4562-b3fc-2c963f66afa6 superadmin

Alternatif env:
  ADMIN_EMAIL=<email-atau-uuid> [ADMIN_ROLE=<role>] npx tsx scripts/assign-admin-role.ts

Role valid: ${[...ALLOWED_ROLES].join(", ")} (default: admin)
Wajib ada env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY`);
}

async function resolveUserId(
  supabaseAdmin: SupabaseClient,
  target: string
): Promise<string | null> {
  if (UUID_RE.test(target)) return target;
  const email = target.trim().toLowerCase();
  // Paginasi daftar user hingga ketemu (Admin API tidak punya lookup by email).
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users) return null;
    const found = data.users.find(
      (u) => (u.email ?? "").trim().toLowerCase() === email
    );
    if (found) return found.id;
    if (data.users.length < 100) return null;
    page++;
    if (page > 100) return null; // pengaman paginasi
  }
}

async function main() {
  const target = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim();
  const role = (process.argv[3] || process.env.ADMIN_ROLE || "admin").trim().toLowerCase();

  if (!target) {
    printUsage();
    process.exit(1);
  }
  if (!ALLOWED_ROLES.has(role)) {
    console.error(`Role tidak dikenal: ${role}. Pilih: ${[...ALLOWED_ROLES].join(", ")}`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    console.error("Env belum lengkap: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY wajib ada.");
    process.exit(1);
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userId = await resolveUserId(supabaseAdmin, target);
  if (!userId) {
    console.error(`User tidak ditemukan untuk: ${target}`);
    process.exit(1);
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (error || !data?.user) {
    console.error(`Gagal menetapkan role: ${error?.message ?? "unknown error"}`);
    process.exit(1);
  }

  console.log(`OK: ${data.user.email ?? userId} -> app_metadata.role = "${role}"`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
