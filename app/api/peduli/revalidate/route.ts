import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getEditorialSession } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATHS = ["/peduli", "/kategori/peduli"];

/**
 * Panggil setelah baris peduli_events / peduli_photos berubah (opsional,
 * karena rute tulis sudah memanggil revalidatePath secara lokal).
 * Keputusan: admin-only agar endpoint ini tidak bisa dipakai publik
 * untuk membanjiri ISR revalidation.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { bucket: "peduli-revalidate", limit: 30, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const session = await getEditorialSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    for (const path of PATHS) {
      try {
        revalidatePath(path);
      } catch (err) {
        console.error(
          `[api/peduli/revalidate] gagal revalidate ${path}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    return NextResponse.json({ ok: true, paths: PATHS });
  } catch (err) {
    console.error(
      "[api/peduli/revalidate] kesalahan tak terduga:",
      err instanceof Error ? err.stack ?? err.message : err
    );
    return NextResponse.json({ error: "Terjadi kesalahan saat memperbarui cache" }, { status: 500 });
  }
}
