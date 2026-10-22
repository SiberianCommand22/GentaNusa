import { NextRequest, NextResponse } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";
import {
  sessionFromSupabaseUser,
  ADMIN_FLAG_COOKIE,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  sessionCookieFlags,
  TOKEN_COOKIE,
  type EditorialSession,
} from "@/lib/auth";
import { canAccessAdminArea, isMasterEmail } from "@/lib/roles";
import { getClientIp } from "@/lib/get-client-ip";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge.
export const runtime = 'nodejs';

// Rate limit per IP+email (in-memory per instance; dilapisi Cloudflare WAF,
// lihat SECURITY.md). Kunci gabungan mencegah satu IP mengunci seluruh
// pengguna dan mencegah satu email mengunci banyak IP di serverless Vercel.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // 10 percobaan gagal
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // jendela 5 menit (300 detik)
// Batas keras ukuran map: penyerang bisa menyemprot email unik tanpa henti,
// sehingga entri kedaluwarsa WAJIB dibersihkan dan map dibatasi agar memori
// instance serverless tidak tumbuh tanpa batas (anti memory-exhaustion DoS).
const RATE_LIMIT_MAX_KEYS = 10_000;

// Panjang maksimum input — ditolak sebelum menyentuh Supabase Auth.
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_PASSWORD_LENGTH = 200;

function pruneRateLimit(now: number): void {
  for (const [k, v] of rateLimitMap) {
    if (now >= v.resetAt) rateLimitMap.delete(k);
  }
  if (rateLimitMap.size <= RATE_LIMIT_MAX_KEYS) return;
  const overflow = rateLimitMap.size - RATE_LIMIT_MAX_KEYS;
  let removed = 0;
  for (const k of rateLimitMap.keys()) {
    rateLimitMap.delete(k);
    if (++removed >= overflow) break;
  }
}

// Resolusi IP TUNGGAL lewat getClientIp (cf-connecting-ip -> x-real-ip ->
// x-forwarded-for) agar tidak berbeda dari pembatas laju rute lain.
function getRateLimitIp(req: NextRequest): string {
  return getClientIp(req);
}

function getRetryAfterSeconds(entry: { resetAt: number }): number {
  return Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000));
}

// Bentuk ringkasan sesi yang disimpan di cookie httpOnly `genta_session`.
// PERINGATAN: cookie ini hanya petunjuk tampilan — lib/auth.ts TIDAK PERNAH
// memakainya untuk otentikasi. `user_id` adalah kunci kepemilikan artikel
// (Pilar 3); `author_slug` hanya petunjuk tampilan, bukan bukti milik.
type SessionPayload = {
  email: string;
  role: string;
  display_name: string;
  user_id: string | null;
  author_slug: string | null;
  is_admin: boolean;
};

// Flag cookie sesi ditetapkan TUNGGAL di `sessionCookieFlags` (lib/auth.ts):
// SameSite=Lax, Path=/, HttpOnly, Secure pada produksi — atribut yang
// diterima Safari ITP dan konsisten dengan penghapusan di /api/admin/logout.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { email, password } = (body ?? {}) as {
      email?: unknown;
      password?: unknown;
    };

    // Validasi tipe + panjang SEBELUM apa pun: body non-string (objek/array)
    // bisa memicu `[object Object]` dan body raksasa membebani Supabase Auth.
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { ok: false, error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }
    if (!email.trim() || !password) {
      return NextResponse.json(
        { ok: false, error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }
    if (email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { ok: false, error: "Email atau kata sandi tidak valid." },
        { status: 400 }
      );
    }

    // Rate limiting per IP+email: 10x gagal / 5 menit. Kunci gabungan agar
    // tidak ada kunci global/statis yang mengunci seluruh pengguna Vercel.
    const ip = getRateLimitIp(request);
    const now = Date.now();
    pruneRateLimit(now);
    const key = `${ip}:${email.toLowerCase()}`;
    const entry = rateLimitMap.get(key);
    if (entry && now < entry.resetAt) {
      if (entry.count >= RATE_LIMIT_MAX) {
        const retryAfter = getRetryAfterSeconds(entry);
        return NextResponse.json(
          {
            ok: false,
            error: `Terlalu banyak percobaan gagal. Silakan coba lagi dalam ${retryAfter} detik.`,
          },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    } else if (entry) {
      // Jendela kedaluwarsa — mulai hitung ulang.
      rateLimitMap.delete(key);
    }

    // Seluruh autentikasi lewat Supabase Auth — tidak ada kredensial
    // hardcoded / jalur pintas master di kode sumber. Administrator Utama
    // wajib memiliki akun Supabase Auth dengan email MASTER_ADMIN_EMAIL
    // (hak admin diberi via kecocokan email terverifikasi atau app_metadata,
    // lihat scripts/assign-admin-role.ts).
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json(
        { ok: false, error: "Layanan autentikasi belum dikonfigurasi." },
        { status: 500 }
      );
    }
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Klien admin (Service Role) untuk self-healing akun master.
    // Fallback env: Vercel memakai SUPABASE_SERVICE_ROLE_KEY,
    // lokal memakai SUPABASE_SERVICE_KEY.
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const supabaseAdmin = serviceKey
      ? createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

    async function healMasterAccount(masterEmail: string): Promise<boolean> {
      // Konfirmasi email + pastikan role admin di app_metadata & user_metadata.
      if (!supabaseAdmin) return false;
      try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error || !data?.users) return false;
        const target = data.users.find(
          (u) => String(u.email ?? "").toLowerCase() === masterEmail.toLowerCase()
        );
        if (!target) return false;
        const appMeta = { ...(target.app_metadata ?? {}), role: "admin" };
        const userMeta = { ...(target.user_metadata ?? {}), role: "admin" };
        const { error: upErr } =
          await supabaseAdmin.auth.admin.updateUserById(target.id, {
            email_confirm: true,
            app_metadata: appMeta,
            user_metadata: userMeta,
          });
        return !upErr;
      } catch {
        return false;
      }
    }

    let authUser: User | null = null;
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    const first = await supabase.auth.signInWithPassword({ email, password });
    if (!first.error && first.data.user && first.data.session) {
      authUser = first.data.user;
      accessToken = first.data.session.access_token;
      refreshToken = first.data.session.refresh_token;
    } else {
      const msg = String(first.error?.message ?? "");
      // SELF-HEALING MASTER ADMIN: bila Supabase menolak karena email belum
      // terkonfirmasi, konfirmasi + tanam role admin lalu ulangi sign-in
      // otomatis satu kali. (Master saat ini sudah confirmed — jalur ini
      // menjadi pengaman bila status berubah di masa depan.)
      if (/email not confirmed/i.test(msg) && isMasterEmail(email)) {
        const healed = await healMasterAccount(String(email));
        if (healed) {
          const retry = await supabase.auth.signInWithPassword({ email, password });
          if (!retry.error && retry.data.user && retry.data.session) {
            authUser = retry.data.user;
            accessToken = retry.data.session.access_token;
            refreshToken = retry.data.session.refresh_token;
          }
        }
        if (!authUser) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Akun administrator belum terkonfirmasi. Hubungi Administrator Utama atau coba lagi dalam beberapa saat.",
            },
            { status: 403 }
          );
        }
      } else {
        // Catat hanya kegagalan autentikasi — bukan setiap request.
        const prev = rateLimitMap.get(key);
        if (prev && Date.now() < prev.resetAt) {
          prev.count += 1;
        } else {
          rateLimitMap.set(key, { count: 1, resetAt: Date.now() + RATE_LIMIT_WINDOW_MS });
        }
        // Jangan bocorkan apakah email terdaftar — pesan generik.
        const hint = /email not confirmed/i.test(msg)
          ? "Akun belum terverifikasi. Periksa email konfirmasi Anda."
          : "Email atau kata sandi tidak valid.";
        return NextResponse.json({ ok: false, error: hint }, { status: 401 });
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    // Kredensial benar — reset catatan gagal agar tidak terkunci.
    rateLimitMap.delete(key);

    // Sinkronisasi peran master: pastikan app_metadata.role = 'admin' selalu
    // tertanam agar seluruh pemeriksaan downstream konsisten.
    if (isMasterEmail(authUser.email)) {
      const currentRole = String(
        ((authUser.app_metadata ?? {}) as Record<string, unknown>).role ?? ""
      )
        .trim()
        .toLowerCase();
      if (currentRole !== "admin" && supabaseAdmin) {
        try {
          const patched = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            app_metadata: { ...(authUser.app_metadata ?? {}), role: "admin" },
            user_metadata: { ...(authUser.user_metadata ?? {}), role: "admin" },
          });
          if (!patched.error && patched.data?.user) authUser = patched.data.user;
        } catch {
          // patch gagal — lanjutkan dengan sesi apa adanya (jalur email
          // master di middleware/lib tetap mengizinkan akses)
        }
      }
    }

    // GERBANG REDAKSI (anti mental-ke-"/" diam-diam): kredensial benar
    // saja TIDAK cukup — app_metadata.role wajib termasuk EDITORIAL_ROLES
    // (admin + varian editor/author/penulis/jurnalis/...) atau email master
    // terverifikasi. Tanpa ini, middleware akan melempar sesi ke beranda `/`
    // tepat setelah login sukses. Tolak di sini dengan 403 + pesan jelas
    // agar mis-provisioning langsung terlihat, bukan menjadi redirect misterius.
    const appRole = String(
      ((authUser.app_metadata ?? {}) as Record<string, unknown>).role ?? ""
    );
    const loginEmailVerified = Boolean(
      (authUser as { email_confirmed_at?: string | null }).email_confirmed_at ||
        (authUser as { confirmed_at?: string | null }).confirmed_at
    );
    if (
      !canAccessAdminArea(
        appRole,
        loginEmailVerified ? authUser.email : null
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Akun ini belum memiliki peran redaksi (admin/editor/penulis/jurnalis). Hubungi Administrator Utama untuk mengaktifkan akses.",
        },
        { status: 403 }
      );
    }

    const identity: EditorialSession = sessionFromSupabaseUser(authUser);
    const fallbackName = (authUser.email ?? String(email)).split("@")[0];
    const session: SessionPayload = {
      email: identity.email ?? email,
      role: identity.role,
      display_name: identity.fullName ?? fallbackName,
      user_id: identity.userId,
      author_slug: identity.authorSlug,
      is_admin: identity.isAdmin,
    };
    const accessTokenChecked = accessToken;
    if (!accessTokenChecked || !authUser) {
      return NextResponse.json(
        { ok: false, error: "Gagal membuat sesi. Coba lagi." },
        { status: 500 }
      );
    }

    // Set sesi: flag admin (kompatibel dgn seluruh guard API) + ringkasan sesi.
    // supabaseSession dikembalikan agar browser juga bisa menyinkronkan sesi
    // Supabase client-side (setSession) — anti redirect-loop di /admin.
    // Atribut cookie: `sessionCookieFlags` (SameSite=Lax, Path=/, HttpOnly,
    // Secure di produksi) — konsisten dengan /api/admin/logout.
    const res = NextResponse.json({
      ok: true,
      admin: true,
      message: "Berhasil masuk",
      session,
      role: identity.role,
      user: { id: identity.userId, email: identity.email },
      supabaseSession: refreshToken
        ? { access_token: accessTokenChecked, refresh_token: refreshToken }
        : { access_token: accessTokenChecked },
    });

    const flags = sessionCookieFlags(SESSION_COOKIE_MAX_AGE_SECONDS);
    res.cookies.set(ADMIN_FLAG_COOKIE, "1", flags);
    res.cookies.set(SESSION_COOKIE, JSON.stringify(session), flags);
    // Access token Supabase disimpan httpOnly agar `auth.getUser()` bisa
    // memverifikasi ulang peran di setiap permintaan (anti pemalsuan cookie).
    // Middleware membaca cookie ini sebagai fallback (lihat proxy.ts).
    res.cookies.set(TOKEN_COOKIE, accessTokenChecked, flags);

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
