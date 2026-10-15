import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getEditorialSession } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

export const dynamic = "force-dynamic";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge.
export const runtime = 'nodejs';

// Endpoint dedikasi unggah sampul: multipart kecil (bukan Base64 di JSON)
// agar tidak menyentuh batas payload. Khusus editor CMS (cookie admin).
// Batas server 4 MB: mencegah crash memori serverless Vercel (limit ~4.5 MB).
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

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
      return NextResponse.json({ url: "", error: "Akses ditolak. Wajib login." }, { status: 401 });
    }

    const ready = isSupabaseReady();
    if (!ready.ok || !adminClient) {
      // Fallback tangguh Service Role Key: Vercel memakai
      // SUPABASE_SERVICE_ROLE_KEY, lokal memakai SUPABASE_SERVICE_KEY.
      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_KEY;
      if (!serviceKey) {
        console.error("Missing Supabase Service Role Key");
        return NextResponse.json(
          { url: "", error: "Konfigurasi server storage belum lengkap (Service Role Key hilang)" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { url: "", error: "Storage belum siap: kunci service Supabase belum terpasang" },
        { status: 500 }
      );
    }

    let formData: FormData | null = null;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ url: "", error: "Format upload tidak valid" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ url: "", error: "Tidak ada file yang diunggah" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ url: "", error: "Berkas kosong" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { url: "", error: "Ukuran foto maksimal 4 MB — kecilkan dulu lalu coba lagi" },
        { status: 413 }
      );
    }

    // Validasi server-side ketat: HANYA jpeg/png/webp. Tolak SVG/HTML/EXE/dll.
    // Dobel-lapis: cek deklarasi MIME klien + verifikasi magic-byte isi berkas.
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { url: "", error: "Hanya JPG, PNG, atau WebP yang diterima" },
        { status: 400 }
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImage(bytes);
    if (!type) {
      return NextResponse.json(
        { url: "", error: "Hanya JPG, PNG, atau WebP yang diterima" },
        { status: 400 }
      );
    }

    // Nama file unik & aman via crypto.randomUUID() + ekstensi tervalidasi:
    // menutup path traversal (`../`) dan mencegah penimpaan berkas lama
    // (upsert: false di bawah menolak tabrakan nama).
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
      const rawMsg = uploadError.message || "kesalahan tak dikenal";
      const lowered = rawMsg.toLowerCase();
      console.error("[api/upload] storage.upload gagal:", {
        message: rawMsg,
        bucket: "articles",
        objectName,
        contentType,
        size: payload.length,
        uploader: session.email ?? session.userId ?? "unknown",
      });
      const friendly =
        lowered.includes("bucket") && (lowered.includes("not found") || lowered.includes("does not exist") || lowered.includes("could not be found"))
          ? "Bucket penyimpanan 'articles' tidak ditemukan di Supabase Storage — buat bucket bernama 'articles' (public) lalu coba lagi."
          : `Gagal upload storage: ${rawMsg}`;
      return NextResponse.json(
        { url: "", error: friendly },
        { status: 500 }
      );
    }

    // Sukses: respon JSON terstruktur { url } + status 200.
    return NextResponse.json({ url: `/media/${objectName}` }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan upload";
    console.error("[api/upload] kesalahan tak terduga:", err instanceof Error ? (err.stack ?? err.message) : err);
    return NextResponse.json({ url: "", error: message }, { status: 500 });
  }
}
