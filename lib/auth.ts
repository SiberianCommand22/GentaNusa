import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Lapisan RBAC redaksi GentaNusa.
 *
 * Sesi redaksi tersusun atas tiga cookie httpOnly:
 *   - genta_admin    : flag "sudah masuk ruang kerja" (guard waris kompatibilitas)
 *   - genta_session  : ringkasan klaim (role, email, user_id, author_slug)
 *   - genta_token    : access token Supabase Auth (verifikasi ulang ke IdP)
 *
 * Bila `genta_token` ada, identitas SEJAHRAJA diambil ulang lewat
 * `supabase.auth.getUser(token)` sehingga role/user_id di cookie tidak pernah
 * dipercaya buta. Bila token sudah kedaluwarsa, klaim cookie tetap dipakai
 * (fallback) supaya sesi redaksi tidak terlempar keluar saat token rotasi.
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
  user_metadata?: Record<string, unknown> | null;
};

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Satu-satunya sumber kebenaran "apakah ini Administrator?".
 * Genesis: `user_metadata.role === 'admin'` ATAU email Administrator Utama.
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

/** Bangun EditorialSession dari user Supabase Auth (metadata = sumber role). */
export function sessionFromSupabaseUser(user: SupaUserLike): EditorialSession {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const role = String(meta.role ?? "")
    .trim()
    .toLowerCase();
  const email = readString(user.email);
  return {
    userId: user.id || null,
    email,
    role: role || "editor",
    isAdmin: isAdminIdentity({ role, email }),
    fullName:
      readString(meta.full_name) ??
      readString(meta.name) ??
      readString(meta.display_name),
    authorSlug: readString(meta.author_slug),
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
 */
export async function getEditorialSession(): Promise<EditorialSession | null> {
  const store = await cookies();
  if (store.get(ADMIN_FLAG_COOKIE)?.value !== "1") return null;

  let claims: Record<string, unknown> = {};
  const rawSession = store.get(SESSION_COOKIE)?.value;
  if (rawSession) {
    try {
      const parsed: unknown = JSON.parse(rawSession);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        claims = parsed as Record<string, unknown>;
      }
    } catch {
      claims = {};
    }
  }

  const token = store.get(TOKEN_COOKIE)?.value;
  if (token) {
    const verified = await verifySupabaseToken(token);
    if (verified) return verified;
    // Token basi/tidak valid — jatuh ke klaim cookie (fallback kompatibilitas).
  }

  const role = String(claims.role ?? "")
    .trim()
    .toLowerCase();
  const email = readString(claims.email);
  if (!role && !email) return null;

  return {
    userId: readString(claims.user_id),
    email,
    role: role || "editor",
    isAdmin: isAdminIdentity({ role, email }),
    fullName: readString(claims.display_name),
    authorSlug: readString(claims.author_slug),
  };
}