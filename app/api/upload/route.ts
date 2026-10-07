import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getEditorialSession } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

export const dynamic = "force-dynamic";

// Endpoint dedikasi unggah sampul: multipart kecil (bukan Base64 di JSON)
// agar tidak menyentuh batas payload. Khusus editor CMS (cookie admin).
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

    const ready = isSupabaseReady();
    if (!ready.ok || !adminClient) {
      return NextResponse.json(
        { error: "Storage belum siap: kunci service Supabase belum terpasang" },
        { status: 500 }
      );
    }

    let formData: FormData | null = null;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Format upload tidak valid" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Berkas kosong" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran foto maksimal 5 MB — kecilkan dulu lalu coba lagi" },
        { status: 413 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImage(bytes);
    if (!type) {
      return NextResponse.json(
        { error: "Hanya JPG, PNG, atau WebP yang diterima" },
        { status: 415 }
      );
    }

    // Kompresi WhatsApp-friendly: maks lebar 1200px, JPEG kualitas 78
    // (target akhir 100–300 KB agar thumbnail selalu lolos scraper).
    let payload: Uint8Array = bytes;
    let objectName = `${randomUUID()}${EXTENSIONS[type]}`;
    let contentType: string = type;
    try {
      const compressed = await sharp(Buffer.from(bytes))
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 78 })
        .toBuffer();
      if (compressed.length > 0 && compressed.length <= MAX_IMAGE_BYTES) {
        payload = new Uint8Array(compressed);
        objectName = `${randomUUID()}.jpg`;
        contentType = "image/jpeg";
      }
    } catch {
      // sharp gagal (binding native hilang) → berkas asli yang sudah
      // lolos validasi magic-byte tetap diunggah apa adanya.
    }

    // Penamaan UUID agar lolos validator proksi /media/[name].
    const { error: uploadError } = await adminClient.storage
      .from("articles")
      .upload(`articles/${objectName}`, payload, {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Gagal upload storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // URL proksi lokal (relative — tanpa CORS, lolos validator /media).
    return NextResponse.json({ url: `/media/${objectName}` }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
