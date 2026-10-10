import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Lapisan RBAC redaksi GentaNusa (pasca-remediasi keamanan Okt 2026).
 *
 * Aturan keras:
 *  1. Sesi HANYA valid bila access token di cookie `genta_token` berhasil
 *     diverifikasi langsung ke Supabase Auth (`auth.getUser(token)`).
 *  2. Cookie `genta_session` TIDAK PERNAH dipercaya untuk otentikasi — isinya
 *     hanya petunjuk tampilan (display hints) yang ditulis saat login.
 *     Tidak ada fallback ke klaim cookie bila token hilang/tidak valid.
 *  3. Status administrator HANYA dibaca dari `app_metadata.role` (yang hanya
 *     bisa dimutasi backend via Service Role Key) atau dari kecocokan email
 *     Administrator Utama pada identitas TERVERIFIKASI. `user_metadata`
 *     tidak pernah menentukan hak admin karena bisa diubah user via client SDK.
 *
 * Cookie httpOnly (7 hari):
 *   - genta_admin : flag "sudah masuk ruang kerja" (early-exit murah).
 *   - genta_session : ringkasan tampilan, TIDAK DIAKUI sebagai bukti sesi.
 *   - genta_token : access token Supabase Auth (sumber kebenaran sesi).
 */

// Email Administrator Utama. Dapat dioverride lewat env untuk staging/offline.
export const MASTER_ADMIN_EMAIL = (
  process.env.MASTER_ADMIN_EMAIL || "siberiantwotwo@gmail.com"
)
  .trim()
  .toLowerCase();

// Role yang punya hak administrator: melihat semua berita + menghapus berita.
const ADMIN_ROLES = new Set(["admin", "superadmin", "super_admin", "administrator"]);

export const ADMIN_FLAG_COOKIE = "genta_admin";
/** @deprecated Hanya petunjuk tampilan — jangan pernah dipakai untuk otorisasi. */
export const SESSION_COOKIE = "genta_session";
export const TOKEN_COOKIE = "genta_token";

export type EditorialSession = {
  /** UUID akun Supabase Auth pemilik artikel. */
  userId: string | null;
  email: string | null;
  role: string;
  /** true = Administrator (lihat semua + hapus), false = Penulis/Editor biasa. */
  isAdmin: boolean;
  fullName: string | null;
  authorSlug: string | null;
};

type SupaUserLike = {
  id: string;
  email?: string | null;
  /** Wajib terisi untuk jalur admin via kecocokan email master. */
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  /** Hanya backend (Service Role) yang boleh menulis bagian ini. */
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Satu-satunya sumber kebenaran "apakah ini Administrator?".
 *
 * `role` WAJIB berasal dari `app_metadata` (atau email master yang sudah
 * terverifikasi via Supabase Auth). Meneruskan nilai dari `user_metadata`
 * ke parameter ini adalah pelanggaran keamanan.
 */
export function isAdminIdentity(input: {
  role?: unknown;
  email?: unknown;
}): boolean {
  const role = String(input.role ?? "")
    .trim()
    .toLowerCase();
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  if (ADMIN_ROLES.has(role)) return true;
  return email.length > 0 && email === MASTER_ADMIN_EMAIL;
}

/**
 * Bangun EditorialSession dari user Supabase Auth TERVERIFIKASI.
 * Role admin diambil dari `app_metadata`; `user_metadata` hanya dipakai
 * untuk atribut tampilan (nama, author_slug) — tidak pernah untuk hak akses.
 */
export function sessionFromSupabaseUser(user: SupaUserLike): EditorialSession {
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const adminRole = String(appMeta.role ?? "")
    .trim()
    .toLowerCase();
  const displayRole =
    adminRole || String(userMeta.role ?? "").trim().toLowerCase() || "editor";
  const email = readString(user.email);
  // Jalur email master HANYA untuk identitas TERVERIFIKASI: tanpa
  // email_confirmed_at, kecocokan email tidak memberi hak admin.
  // (Jalur app_metadata.role tidak terpengaruh — ditulis backend.)
  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
  return {
    userId: user.id || null,
    email,
    role: displayRole,
    isAdmin: isAdminIdentity({ role: adminRole, email: emailVerified ? email : null }),
    fullName:
      readString(userMeta.full_name) ??
      readString(userMeta.name) ??
      readString(userMeta.display_name),
    authorSlug: readString(userMeta.author_slug),
  };
}

async function verifySupabaseToken(token: string): Promise<EditorialSession | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return sessionFromSupabaseUser(data.user);
  } catch {
    return null;
  }
}

/**
 * Sesi redaksi aktif, atau null bila belum login.
 * AMAN dipanggil dari route handler, Server Component, dan server action.
 *
 * Tidak ada jalur pintas: tanpa token Supabase yang valid, hasilnya null —
 * cookie `genta_session` yang tidak ditandatangani tidak pernah diterima.
 */
export async function getEditorialSession(): Promise<EditorialSession | null> {
  const store = await cookies();
  if (store.get(ADMIN_FLAG_COOKIE)?.value !== "1") return null;

  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  // Satu-satunya jalan: verifikasi ke Supabase Auth. Gagal = tidak login.
  return verifySupabaseToken(token);
}

// Nama byline otomatisasi/bot yang dilarang tampil sebagai penulis artikel.
// Dinormalisasi (huruf kecil, alfanumerik saja) sebelum dibandingkan.
const BLOCKED_AUTHOR_NAMES = new Set([
  "redaksigenta",
  "hermes",
  "bot",
  "autobot",
  "scraper",
  "autopost",
  "autoposter",
]);

function normalizeAuthorName(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (BLOCKED_AUTHOR_NAMES.has(key)) return "";
  return s;
}

/**
 * Nama penulis tampilan untuk tulis/update artikel.
 *
 * - Administrator: boleh menetapkan nama tampilan, kecuali nama bot.
 * - Penulis biasa: bila `allowCustomByline` true, input klien yang lolos
 *   filter (bukan nama bot, maks 80 karakter) dipakai — memungkinkan nama
 *   pena / "Tim Liputan". Bila false (default), SELALU identitas sesi login.
 *   Kepemilikan artikel TIDAK pernah mengikuti byline (murni `user_id`).
 */
export function resolveAuthorName(
  session: EditorialSession,
  requested: unknown,
  fallback = "Redaksi GentaNusa",
  allowCustomByline = false
): string {
  const clean = normalizeAuthorName(requested).slice(0, 80);
  if (session.isAdmin) {
    return clean || session.fullName || fallback;
  }
  if (allowCustomByline && clean) {
    return clean;
  }
  return session.fullName || clean || fallback;
}
