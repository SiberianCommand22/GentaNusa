import { NextResponse } from "next/server";
import { getEditorialSession } from "@/lib/auth";

/**
 * GET /api/admin/check — apakah sesi redaksi aktif, dan apa perannya?
 *
 * Membaca ulang peran dari server (cookie + verifikasi Supabase Auth bila
 * access token tersedia). Client CMS memakainya untuk decides:
 *  - merender tombol "Hapus" HANYA ketika is_admin === true,
 *  - menampilkan banner "mode penulis" ketika is_admin === false.
 */
export async function GET() {
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ authed: false }, { status: 401 });
  }
  return NextResponse.json({
    authed: true,
    is_admin: session.isAdmin,
    user_id: session.userId,
    email: session.email,
    role: session.role,
    display_name: session.fullName,
    author_slug: session.authorSlug,
  });
}