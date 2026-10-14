/**
 * Aturan peran redaksi GentaNusa — TERPUSAT & EDGE-SAFE.
 *
 * Modul ini SENGAJA tidak mengimpor `next/headers` / `@supabase/*` agar bisa
 * dipakai di `middleware.ts` (Edge Runtime) maupun route handler Node.
 * Satu-satunya sumber kebenaran "boleh masuk /admin":
 *   - `app_metadata.role` / peran setara dalam {admin, superadmin,
 *     super_admin, administrator, editor}, ATAU
 *   - kecocokan email Administrator Utama (terverifikasi di sisi server).
 *
 * `user_metadata.role` TIDAK PERNAH memberi hak akses (bisa diubah user via
 * client SDK) — hanya dipakai sebagai label tampilan di lib/auth.ts.
 */

// Email Administrator Utama. Dapat dioverride lewat env untuk staging/offline.
export const MASTER_ADMIN_EMAIL = (
  process.env.MASTER_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "siberiantwotwo@gmail.com"
)
  .trim()
  .toLowerCase();

// Role berhak administrator penuh (lihat semua + hapus berita).
export const ADMIN_ROLES = new Set([
  "admin",
  "superadmin",
  "super_admin",
  "administrator",
]);

// Role berhak masuk area /admin (admin + editor + varian admin).
export const EDITORIAL_ROLES = new Set([...ADMIN_ROLES, "editor"]);

function normRole(role: unknown): string {
  return String(role ?? "").trim().toLowerCase();
}

function normEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}

export function isMasterEmail(email: unknown): boolean {
  const e = normEmail(email);
  return e.length > 0 && e === MASTER_ADMIN_EMAIL;
}

// Nama cookie sesi — string murni agar bisa dipakai middleware Edge tanpa
// mengimpor lib/auth.ts (yang bergantung pada `next/headers`).
export const ADMIN_FLAG_COOKIE = "genta_admin";
export const SESSION_COOKIE = "genta_session";
export const TOKEN_COOKIE = "genta_token";

/**
 * Satu-satunya sumber kebenaran "apakah ini Administrator?".
 * `role` WAJIB berasal dari `app_metadata` (ditulis backend via Service Role).
 */
export function isAdminIdentity(input: {
  role?: unknown;
  email?: unknown;
}): boolean {
  if (ADMIN_ROLES.has(normRole(input.role))) return true;
  return isMasterEmail(input.email);
}

/**
 * Gerbang area /admin — dipakai IDENTIK oleh `middleware.ts`,
 * `app/api/admin/login`, dan guard server lain. Mengizinkan email master,
 * `app_metadata.role` admin/editor, dan varian admin.
 */
export function canAccessAdminArea(role: unknown, email: unknown): boolean {
  if (EDITORIAL_ROLES.has(normRole(role))) return true;
  return isMasterEmail(email);
}
