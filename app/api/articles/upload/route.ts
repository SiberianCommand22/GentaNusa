import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getEditorialSession } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge
// (batas 1 MB paket Hobby + `node:crypto` hanya ada di Node).
// Rute multipart/form-data WAJIB Node.js agar tidak timeout di Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
} as const;

type ImageType = keyof typeof EXTENSIONS;

function detectImage(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
    bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
    bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 &&
    bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

function ensureClient(): { ok: true; client: SupabaseClient } | { ok: false; error: string } {
  if (adminClient) return { ok: true, client: adminClient };
  const ready = isSupabaseReady();
  if (!ready.ok) {
    console.error("[articles/upload] Supabase belum siap:", ready.reason);
    return { ok: false as const, error: ready.reason };
  }
  // Fallback eksplisit: Vercel memakai SUPABASE_SERVICE_ROLE_KEY,
  // lokal memakai SUPABASE_SERVICE_KEY. WAJIB Service Role Key
  // (bukan anon key) agar tulis ke bucket storage diizinkan.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[articles/upload] Missing Supabase Service Role Key");
    return { ok: false as const, error: "Konfigurasi server storage belum lengkap (Service Role Key hilang)" };
  }
  try {
    const lazy = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return { ok: true as const, client: lazy };
  } catch (err) {
    console.error("[articles/upload] Gagal membuat admin client:", err instanceof Error ? err.message : err);
    return { ok: false as const, error: "Storage belum siap" };
  }
}

function describeStorageError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("bucket") && (m.includes("not found") || m.includes("does not exist") || m.includes("could not be found"))) {
    return "Bucket penyimpanan 'articles' tidak ditemukan di Supabase Storage — buat bucket bernama 'articles' (public) lalu coba lagi.";
  }
  if (m.includes("row-level security") || m.includes("rls") || m.includes("not authorized") || m.includes("permission")) {
    return `Upload ditolak kebijakan storage (RLS): ${message}. Pastikan Service Role Key dipakai server dan policy bucket mengizinkan tulis service_role.`;
  }
  return `Gagal menyimpan foto: ${message}`;
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req);
    if (!limited.ok) return limited.response;

    // Wajib sesi redaksi terverifikasi (Supabase Auth) — flag cookie mentah
    // tidak pernah cukup untuk endpoint tulis.
    const session = await getEditorialSession();
    if (!session) {
      return NextResponse.json({ error: "Akses ditolak. Wajib login." }, { status: 401 });
    }

    const client = ensureClient();
    if (!client.ok) return NextResponse.json({ error: client.error }, { status: 503 });

    let formData: FormData | null = null;
    try {
      formData = await req.formData();
    } catch (err) {
      console.error("[articles/upload] formData gagal diparse:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "Format upload tidak valid" }, { status: 400 });
    }

    // Terima `image` (kontrak rute ini) maupun `file` (alias form artikel
    // /api/upload) agar handler frontend tidak gagal karena nama field.
    const raw = formData.get("image") ?? formData.get("file");
    const uploaded = raw instanceof File ? raw : null;
    if (!uploaded) {
      return NextResponse.json({ error: "Foto wajib dipilih" }, { status: 400 });
    }
    if (uploaded.size === 0 || uploaded.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Ukuran foto maksimal 4 MB" }, { status: 400 });
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await uploaded.arrayBuffer());
    } catch (err) {
      console.error("[articles/upload] gagal membaca berkas:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "Gagal membaca berkas foto" }, { status: 400 });
    }
    const type = detectImage(bytes);
    if (!type) {
      return NextResponse.json({ error: "Hanya JPG, PNG, atau WebP yang diterima" }, { status: 400 });
    }

    const objectName = `${randomUUID()}${EXTENSIONS[type]}`;
    let data: { path: string } | null = null;
    try {
      const res = await client.client.storage
        .from("articles")
        .upload(`articles/${objectName}`, Buffer.from(bytes), {
          contentType: type,
          cacheControl: "public, max-age=31536000, immutable",
          upsert: false,
        });
      if (res.error) throw new Error(res.error.message);
      data = res.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "kesalahan tak dikenal";
      console.error("[articles/upload] storage.upload gagal:", {
        message,
        bucket: "articles",
        objectName,
        contentType: type,
        size: bytes.length,
        uploader: session.email ?? session.userId ?? "unknown",
      });
      return NextResponse.json({ error: describeStorageError(message) }, { status: 500 });
    }

    if (!data?.path) {
      console.error("[articles/upload] storage.upload tanpa path:", { objectName });
      return NextResponse.json({ error: "Gagal menyimpan foto: respons storage kosong" }, { status: 500 });
    }

    // Kembalikan `url` (kontrak /api/upload yang dipakai post-editor)
    // sekaligus `path` (kontrak lama rute ini) agar kedua konsumen jalan.
    const publicPath = `/media/${data.path.replace(/^articles\//, "")}`;
    return NextResponse.json({
      ok: true,
      url: publicPath,
      path: publicPath,
    }, { status: 201 });
  } catch (err) {
    console.error("[articles/upload] kesalahan tak terduga:", err instanceof Error ? err.stack ?? err.message : err);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengunggah foto" }, { status: 500 });
  }
}
