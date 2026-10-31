import { NextResponse } from "next/server";
import { getEditorialSession } from "@/lib/auth";
import { canAccessAdminArea, canAccessAnalytics } from "@/lib/roles";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge.
export const runtime = 'nodejs';

/**
 * GET /api/admin/check — apakah sesi redaksi aktif, dan apa perannya?
 *
 * Membaca ulang peran dari server (cookie + verifikasi Supabase Auth bila
 * access token tersedia). Client CMS memakainya untuk decides:
 *  - merender tombol "Hapus" HANYA ketika is_admin === true,
 *  - menampilkan banner "mode penulis" ketika is_admin === false.
 *
 * Selaras dengan middleware: sesi valid tapi BUKAN peran redaksi
 * (app_metadata.role di luar EDITORIAL_ROLES dan bukan email master
 * terverifikasi) dijawab 403 — bukan 200 — agar guard client-side di
 * app/admin/layout.tsx melempar ke halaman login, bukan menampilkan dasbor.
 */
export async function GET() {
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ authed: false }, { status: 401 });
  }
  if (
    !canAccessAdminArea(
      session.appRole,
      session.emailVerified ? session.email : null
    )
  ) {
    return NextResponse.json({ authed: false }, { status: 403 });
  }
  return NextResponse.json({
    authed: true,
    is_admin: session.isAdmin,
    user_id: session.userId,
    email: session.email,
    role: session.role,
    display_name: session.fullName,
    author_slug: session.authorSlug,
    // Dipakai sidebar untuk menampilkan/menyembunyikan menu Analitik Redaksi
    // (hanya admin + koordinator). Nilai dari app_metadata, bukan user_metadata.
    can_analytics: canAccessAnalytics(
      session.appRole,
      session.emailVerified ? session.email : null
    ),
  });
}