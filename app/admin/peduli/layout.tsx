import Link from "next/link";
import { redirect } from "next/navigation";
import { getEditorialSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Gerbang SERVER untuk /admin/peduli.
 *
 *  1. Belum login       -> redirect ke halaman login redaksi privat.
 *  2. Login tapi BUKAN Administrator (bukan admin/superadmin, bukan email
 *     master terverifikasi) -> 403 "Akses Ditolak" tanpa merender anak
 *     halaman apa pun.
 *
 * Pemeriksaan ini berlapis: sidebar menyembunyikan menu Peduli untuk editor
 * dan koordinator (app/admin/layout.tsx), tetapi mengetik URL langsung tetap
 * ditolak DI SINI di level server -- bukan sekadar menyembunyikan tautan.
 */
export default async function PeduliAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEditorialSession();
  if (!session) {
    redirect("/admin/login/gentanusa");
  }

  if (!session.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
        <div
          role="alert"
          className="max-w-md mx-auto mt-16 bg-rose-950/40 border border-rose-500/40 rounded-2xl p-8 text-center space-y-4"
        >
          <h1 className="text-xl font-bold text-white tracking-tight">
            403 Akses Ditolak
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Halaman Peduli khusus Administrator Utama. Anda masuk sebagai
            redaksi non-admin, sehingga tidak dapat mengelola kanal Peduli.
          </p>
          <Link
            href="/admin"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
