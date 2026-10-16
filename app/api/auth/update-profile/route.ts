import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getEditorialSession, TOKEN_COOKIE } from "@/lib/auth";
import {
  sanitizeDisplayNameRest,
  updateAuthUserDisplayName,
} from "@/lib/supabase-rest";
import { rateLimit } from "@/app/api/rate-limit";

export const dynamic = "force-dynamic";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge.
export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readDisplayName(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const b = body as Record<string, unknown>;
  const raw =
    b.displayName ?? b.display_name ?? b.full_name ?? b.fullName ?? b.name;
  return typeof raw === "string" ? raw : "";
}

/**
 * Cermin nama ke tabel profil bila proyek memilikinya (`profiles` / `authors`).
 * Best-effort: tabel tidak ada / kolom beda = diabaikan, BUKAN kegagalan
 * request. Sumber kebenaran tetap Supabase Auth `user_metadata`.
 */
async function bestEffortProfileMirror(
  userId: string,
  clean: string
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  // Tabel `profiles` (id = UUID auth) bila ada.
  try {
    await fetch(
      `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          full_name: clean,
          display_name: clean,
          name: clean,
        }),
      }
    );
  } catch {
    // abaikan — tabel opsional
  }
  // Tabel `authors` (user_id = UUID auth) bila ada.
  try {
    await fetch(
      `${url}/rest/v1/authors?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: clean, full_name: clean }),
      }
    );
  } catch {
    // abaikan — tabel opsional
  }
}

// POST|PATCH /api/auth/update-profile — perbarui nama tampilan pena.
//
// HAK AKSES: seluruh akun redaksi (Admin, Editor, Author, Jurnalis) yang
// memiliki sesi valid BOLEH memperbarui nama profil MILIKNYA SENDIRI.
// TIDAK ada pembatasan isAdmin. Admin tetap berhak penuh: bila body memuat
// `userId` UUID lain, admin dapat memperbarui profil user tersebut.
//
// VALIDASI NAMA: bebas, TIDAK terikat format username email. "Fidel Apta"
// untuk fidel.moreno@gentanusa.id adalah VALID. Hanya: trim, lipat
// whitespace, buang karakter kontrol/berbahaya, panjang 2–60 karakter.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req);
  if (!limited.ok) return limited.response;

  const session = await getEditorialSession();
  if (!session || !session.userId) {
    return NextResponse.json(
      { ok: false, success: false, error: "Wajib login." },
      { status: 401 }
    );
  }
  // HAK AKSES: endpoint ini SENGAJA tidak membatasi hanya untuk admin
  // (isAdmin). Setiap sesi redaksi valid (getEditorialSession non-null)
  // BOLEH memperbarui profil MILIKNYA SENDIRI (targetUserId === session.userId
  // → 200 OK). Hanya bila body menunjuk userId milik orang lain, user
  // non-admin ditolak 403; admin memiliki izin penuh atas akun mana pun.
  // (Tidak ada gerbang canAccessAdminArea di sini agar akun redaksi dengan
  // peran apa pun tidak pernah mendapat "Gagal memperbarui nama" saat
  // menyimpan namanya sendiri.)

  const body = await req.json().catch(() => null);
  const clean = sanitizeDisplayNameRest(readDisplayName(body));

  if (clean.length < 2 || clean.length > 60) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "Nama tampilan wajib 2–60 karakter.",
      },
      { status: 400 }
    );
  }

  // Target update: diri sendiri; admin boleh menunjuk user lain.
  let targetId = session.userId;
  const requestedTarget =
    body && typeof body === "object"
      ? ((body as Record<string, unknown>).userId ??
        (body as Record<string, unknown>).user_id ??
        (body as Record<string, unknown>).id)
      : null;
  if (
    typeof requestedTarget === "string" &&
    requestedTarget.trim() &&
    requestedTarget.trim() !== session.userId
  ) {
    if (!session.isAdmin) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "Anda hanya dapat mengubah nama profil milik sendiri.",
        },
        { status: 403 }
      );
    }
    if (!UUID_RE.test(requestedTarget.trim())) {
      return NextResponse.json(
        { ok: false, success: false, error: "userId tidak valid." },
        { status: 400 }
      );
    }
    targetId = requestedTarget.trim();
  }

  // Jalur utama: Admin REST API via service_role — permanen di Supabase
  // (PUT /auth/v1/admin/users/:id, user_metadata full_name + display_name).
  // Tidak bergantung pada token user yang bisa kedaluwarsa.
  const adminRes = await updateAuthUserDisplayName(targetId, clean);
  if (adminRes.ok) {
    await bestEffortProfileMirror(targetId, clean);
    const meta = (adminRes.user.user_metadata ?? {}) as Record<string, unknown>;
    const saved =
      (typeof meta.full_name === "string" && meta.full_name.trim()) ||
      (typeof meta.display_name === "string" && meta.display_name.trim()) ||
      (typeof meta.name === "string" && meta.name.trim()) ||
      clean;
    return NextResponse.json(
      {
        ok: true,
        success: true,
        message: "Nama penulis berhasil diperbarui",
        user: {
          display_name: saved.trim(),
          email: adminRes.user.email ?? session.email,
        },
      },
      { status: 200 }
    );
  }

  // Fallback: service key belum dikonfigurasi (503) + target diri sendiri —
  // tulis via token sesi milik user (cakupan tepat akun sendiri).
  if (adminRes.status === 503 && targetId === session.userId) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const token = (await cookies()).get(TOKEN_COOKIE)?.value;
    if (!url || !anonKey || !token) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "Sesi tidak valid. Login ulang.",
        },
        { status: 401 }
      );
    }
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await userClient.auth.updateUser({
      data: { full_name: clean, display_name: clean, name: clean },
    });
    if (error || !data?.user) {
      const expired = /expired|invalid|jwt/i.test(error?.message ?? "");
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: expired
            ? "Sesi kedaluwarsa. Login ulang."
            : "Gagal memperbarui nama.",
        },
        { status: expired ? 401 : 400 }
      );
    }
    const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const saved =
      (typeof meta.full_name === "string" && meta.full_name.trim()) ||
      (typeof meta.display_name === "string" && meta.display_name.trim()) ||
      clean;
    await bestEffortProfileMirror(targetId, clean);
    return NextResponse.json(
      {
        ok: true,
        success: true,
        message: "Nama penulis berhasil diperbarui",
        user: {
          display_name: saved.trim(),
          email: data.user.email ?? session.email,
        },
      },
      { status: 200 }
    );
  }

  const expired = /expired|invalid|jwt/i.test(adminRes.error);
  return NextResponse.json(
    { ok: false, success: false, error: adminRes.error || "Gagal memperbarui nama." },
    { status: expired ? 401 : adminRes.status || 400 }
  );
}

export const PATCH = POST;
