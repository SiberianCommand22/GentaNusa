import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getEditorialSession } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "peduli";
const PUBLIC_PATHS = ["/peduli", "/kategori/peduli"];

/** Kolom boleh-diubah lewat PATCH (whitelist — tanpa interpolasi payload). */
const PATCHABLE = [
  "alt",
  "caption",
  "handwritten_note",
  "photographer",
  "timestamp",
  "story_title",
  "story_description",
  "quote_text",
  "quote_author",
  "rotation_deg",
  "order_index",
] as const;

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 500);
  return trimmed.length > 0 ? trimmed : null;
}

function revalidatePublicPaths() {
  for (const path of PUBLIC_PATHS) {
    try {
      revalidatePath(path);
    } catch (err) {
      console.error(
        `[api/peduli/photos/${path}] gagal revalidate:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

/** Ekstrak path objek storage dari URL publik /storage/v1/object/public/peduli/<path>. */
function storagePathFromSrc(src: string): string | null {
  const marker = "/object/public/peduli/";
  const at = src.indexOf(marker);
  if (at === -1) return null;
  const path = src.slice(at + marker.length);
  if (!path || path.includes("..")) return null;
  return path;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = rateLimit(req, { bucket: "peduli-photo-edit", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const session = await getEditorialSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseReady().ok || !adminClient) {
      return NextResponse.json({ error: "Storage belum siap" }, { status: 503 });
    }

    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const patch: Record<string, unknown> = {};
    for (const key of PATCHABLE) {
      if (!(key in body)) continue;
      const value = body[key];
      if (key === "rotation_deg" || key === "order_index") {
        const num = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(num)) continue;
        patch[key] = key === "order_index" ? Math.trunc(num) : num;
      } else {
        const text = cleanText(value);
        patch[key] = text;
      }
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from("peduli_photos")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("[api/peduli/photos] update gagal:", error?.message || "tidak ditemukan");
      return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
    }

    revalidatePublicPaths();
    return NextResponse.json(data);
  } catch (err) {
    console.error(
      "[api/peduli/photos] PATCH tak terduga:",
      err instanceof Error ? err.stack ?? err.message : err
    );
    return NextResponse.json({ error: "Terjadi kesalahan saat memperbarui foto" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getEditorialSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseReady().ok || !adminClient) {
      return NextResponse.json({ error: "Storage belum siap" }, { status: 503 });
    }

    const { id } = await params;

    const { data: row, error: readError } = await adminClient
      .from("peduli_photos")
      .select("id, src")
      .eq("id", id)
      .maybeSingle();
    if (readError) {
      console.error("[api/peduli/photos] gagal membaca foto:", readError.message);
      return NextResponse.json({ error: "Gagal membaca foto" }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
    }

    const { error } = await adminClient.from("peduli_photos").delete().eq("id", id);
    if (error) {
      console.error("[api/peduli/photos] hapus baris gagal:", error.message);
      return NextResponse.json({ error: "Gagal menghapus foto" }, { status: 500 });
    }

    // Hapus objek storage best-effort (baris sudah terhapus lebih dulu).
    const storagePath = storagePathFromSrc(String(row.src || ""));
    if (storagePath) {
      try {
        const res = await adminClient.storage.from(BUCKET).remove([storagePath]);
        if (res.error) throw new Error(res.error.message);
      } catch (err) {
        console.error(
          "[api/peduli/photos] gagal menghapus objek storage:",
          err instanceof Error ? err.message : err
        );
      }
    }

    revalidatePublicPaths();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[api/peduli/photos] DELETE tak terduga:",
      err instanceof Error ? err.stack ?? err.message : err
    );
    return NextResponse.json({ error: "Terjadi kesalahan saat menghapus foto" }, { status: 500 });
  }
}
