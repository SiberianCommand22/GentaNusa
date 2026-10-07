import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getEditorialSession } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

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

function ensureClient() {
  const ready = isSupabaseReady();
  if (!ready.ok) return { ok: false as const, error: ready.reason };
  if (!adminClient) return { ok: false as const, error: "Storage belum siap" };
  return { ok: true as const, client: adminClient };
}

export async function POST(req: NextRequest) {
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
  } catch {
    return NextResponse.json({ error: "Format upload tidak valid" }, { status: 400 });
  }

  const uploaded = formData.get("image");
  if (!(uploaded instanceof File)) {
    return NextResponse.json({ error: "Foto wajib dipilih" }, { status: 400 });
  }
  if (uploaded.size === 0 || uploaded.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Ukuran foto maksimal 5 MB" }, { status: 413 });
  }

  const bytes = new Uint8Array(await uploaded.arrayBuffer());
  const type = detectImage(bytes);
  if (!type) {
    return NextResponse.json({ error: "Hanya JPG, PNG, atau WebP yang diterima" }, { status: 415 });
  }

  const objectName = `${randomUUID()}${EXTENSIONS[type]}`;
  const { data, error } = await client.client.storage
    .from("articles")
    .upload(`articles/${objectName}`, uploaded, {
      contentType: type,
      cacheControl: "public, max-age=31536000, immutable",
      upsert: false,
    });

  if (error || !data?.path) {
    return NextResponse.json({ error: "Gagal menyimpan foto" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    path: `/media/${data.path.replace(/^articles\//, "")}`,
  }, { status: 201 });
}
