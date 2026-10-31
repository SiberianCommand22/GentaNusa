import { redirect } from "next/navigation";
import { getEditorialSession } from "@/lib/auth";
import { canAccessAnalytics } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Gerbang SERVER untuk /admin/analitik-redaksi.
 *
 *  1. Belum login -> redirect ke halaman login redaksi privat.
 *  2. Bukan Administrator (admin/superadmin), bukan Koordinator Redaksi
 *     (app_metadata.role = "koordinator"), dan bukan email koordinator
 *     terverifikasi -> langsung redirect ke /admin.
 *
 * Redaktur/editor biasa yang mengetik URL ini secara MANUAL ditolak di
 * sini; sidebar memang tidak menampilkan menunya (app/admin/layout.tsx),
 * tetapi penyembunyian menu bukanlah otorisasi.
 */
export default async function AnalitikRedaksiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEditorialSession();
  if (!session) {
    redirect("/admin/login/gentanusa");
  }

  const allowed = canAccessAnalytics(
    session.appRole,
    session.emailVerified ? session.email : null
  );
  if (!allowed) {
    redirect("/admin");
  }

  return <>{children}</>;
}
