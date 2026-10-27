import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getEditorialSession } from "@/lib/auth";
import { rateLimit } from "@/app/api/rate-limit";

// Multipart/form-data WAJIB Node.js (bukan Edge): kuota paket lebih besar
// dan `node:crypto` hanya ada di Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "peduli";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 30;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
} as const;

type ImageType = keyof typeof EXTENSIONS;

type PhotoMeta = {
  caption?: string | null;
  alt?: string | null;
  handwritten_note?: string | null;
  photographer?: string | null;
  timestamp?: string | null;
  story_title?: string | null;
  story_description?: string | null;
  order_index?: number | null;
};

const PUBLIC_PATHS = ["/peduli", "/kategori/peduli"];

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
    console.error("[api/peduli/photos] Supabase belum siap:", ready.reason);
    return { ok: false, error: ready.reason };
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[api/peduli/photos] Missing Supabase Service Role Key");
    return { ok: false as const, error: "Konfigurasi server storage belum lengkap (Service Role Key hilang)" };
  }
  try {
    const lazy = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return { ok: true as const, client: lazy };
  } catch (err) {
    console.error("[api/peduli/photos] Gagal membuat admin client:", err instanceof Error ? err.message : err);
    return { ok: false as const, error: "Storage belum siap" };
  }
}

function describeStorageError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("bucket") && (m.includes("not found") || m.includes("does not exist") || m.includes("could not be found"))) {
    return "Bucket penyimpanan 'peduli' tidak ditemukan di Supabase Storage — buat bucket bernama 'peduli' (public) lalu coba lagi.";
  }
  if (m.includes("row-level security") || m.includes("rls") || m.includes("not authorized") || m.includes("permission")) {
    return "Upload ditolak oleh kebijakan keamanan penyimpanan. Hubungi administrator untuk memeriksa konfigurasi bucket.";
  }
  return "Gagal menyimpan foto. Coba lagi atau hubungi administrator.";
}

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
        `[api/peduli/photos] gagal revalidate ${path}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // 40/menit: cukup untuk 30 foto dipecah jadi 10 chunk (3 file/chunk) oleh admin.
    const limited = rateLimit(req, { bucket: "peduli-photos", limit: 40, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const session = await getEditorialSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = ensureClient();
    if (!client.ok) return NextResponse.json({ error: client.error }, { status: 503 });

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err) {
      console.error("[api/peduli/photos] formData gagal diparse:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "Format upload tidak valid" }, { status: 400 });
    }

    const eventId = String(formData.get("event_id") ?? "").trim();
    if (!UUID_RE.test(eventId)) {
      return NextResponse.json({ error: "Kegiatan tidak valid" }, { status: 400 });
    }

    const raw = formData.getAll("files");
    const files = raw.filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length === 0) {
      return NextResponse.json({ error: "Pilih minimal satu foto" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_FILES} foto per unggahan` },
        { status: 400 }
      );
    }

    let metas: PhotoMeta[] = [];
    const rawMeta = formData.get("meta");
    if (typeof rawMeta === "string" && rawMeta.trim()) {
      try {
        const parsed = JSON.parse(rawMeta);
        if (Array.isArray(parsed)) metas = parsed as PhotoMeta[];
      } catch {
        console.warn("[api/peduli/photos] meta tidak valid, diabaikan");
      }
    }

    const { data: eventRow, error: eventError } = await client.client
      .from("peduli_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();
    if (eventError) {
      console.error("[api/peduli/photos] gagal membaca kegiatan:", eventError.message);
      return NextResponse.json({ error: "Gagal memverifikasi kegiatan" }, { status: 500 });
    }
    if (!eventRow) {
      return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });
    }

    const uploadedPaths: string[] = [];
    const rows: Record<string, unknown>[] = [];
    const failures: { name: string; error: string }[] = [];

    // Resolusi Sharp sekali di awal; kalau gagal, seluruh batch memakai
    // berkas asli (sudah lolos magic-byte) agar fitur tidak mati total.
    type SharpFactory = (typeof import("sharp"))["default"];
    let sharpFactory: SharpFactory | null = null;
    try {
      sharpFactory = (await import("sharp")).default;
    } catch (err) {
      console.warn(
        "[api/peduli/photos] sharp tidak tersedia, memakai berkas asli:",
        err instanceof Error ? err.message : err
      );
    }

    // Proses berkas SEKUENSIAL (satu per satu, bukan Promise.all): baca →
    // kompresi Sharp → upload → lepas buffer sebelum berkas berikutnya.
    // Memori puncak hanya menampung satu foto, aman untuk batch hingga 30 foto.
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const meta = metas[i] ?? {};

      if (file.size > MAX_IMAGE_BYTES) {
        failures.push({ name: file.name, error: "Ukuran maksimal 4 MB" });
        continue;
      }

      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await file.arrayBuffer());
      } catch (err) {
        console.error("[api/peduli/photos] gagal membaca berkas:", err instanceof Error ? err.message : err);
        failures.push({ name: file.name, error: "Gagal membaca berkas" });
        continue;
      }

      const type = detectImage(bytes);
      if (!type) {
        failures.push({ name: file.name, error: "Hanya JPG, PNG, atau WebP" });
        continue;
      }

      // Normalisasi + buang metadata EXIF (orientasi diterapkan via .rotate()).
      let payload: Buffer = Buffer.from(bytes);
      let objectName = `${randomUUID()}${EXTENSIONS[type]}`;
      let contentType: ImageType = type;
      if (sharpFactory) {
        try {
          const compressed = await sharpFactory(payload)
            .rotate()
            .resize({ width: 1600, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          if (compressed.length > 0 && compressed.length <= MAX_IMAGE_BYTES) {
            payload = compressed;
            objectName = `${randomUUID()}.jpg`;
            contentType = "image/jpeg";
          }
        } catch (err) {
          console.warn(
            "[api/peduli/photos] kompresi gagal, memakai berkas asli:",
            err instanceof Error ? err.message : err
          );
        }
      }

      const storagePath = `peduli/${objectName}`;
      try {
        const res = await client.client.storage
          .from(BUCKET)
          .upload(storagePath, payload, {
            contentType,
            cacheControl: "public, max-age=31536000, immutable",
            upsert: false,
          });
        if (res.error) throw new Error(res.error.message);
        if (!res.data?.path) throw new Error("respons storage kosong");
        uploadedPaths.push(res.data.path);

        const { data: publicUrlData } = client.client.storage
          .from(BUCKET)
          .getPublicUrl(res.data.path);
        const src = publicUrlData?.publicUrl || "";
        if (!src) throw new Error("gagal membuat URL publik");

        rows.push({
          event_id: eventId,
          src,
          alt: cleanText(meta.alt) || cleanText(meta.caption) || cleanText(file.name),
          caption: cleanText(meta.caption),
          handwritten_note: cleanText(meta.handwritten_note),
          photographer: cleanText(meta.photographer),
          timestamp: cleanText(meta.timestamp),
          story_title: cleanText(meta.story_title),
          story_description: cleanText(meta.story_description),
          order_index:
            typeof meta.order_index === "number" && Number.isFinite(meta.order_index)
              ? Math.trunc(meta.order_index)
              : 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "kesalahan tak dikenal";
        console.error("[api/peduli/photos] upload gagal:", {
          message,
          bucket: BUCKET,
          storagePath,
          contentType,
          size: payload.length,
          uploader: session.email ?? session.userId ?? "unknown",
        });
        failures.push({ name: file.name, error: describeStorageError(message) });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: failures[0]?.error || "Tidak ada foto yang berhasil diunggah" },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await client.client
      .from("peduli_photos")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("[api/peduli/photos] insert gagal:", insertError.message);
      // Bersihkan objek yang sudah terlanjur terunggah agar tidak jadi sampah.
      try {
        await client.client.storage.from(BUCKET).remove(uploadedPaths);
      } catch (err) {
        console.error(
          "[api/peduli/photos] cleanup gagal:",
          err instanceof Error ? err.message : err
        );
      }
      return NextResponse.json(
        { error: "Gagal menyimpan data foto" },
        { status: 500 }
      );
    }

    revalidatePublicPaths();

    return NextResponse.json(
      {
        ok: true,
        photos: inserted ?? [],
        failed: failures,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(
      "[api/peduli/photos] kesalahan tak terduga:",
      err instanceof Error ? err.stack ?? err.message : err
    );
    return NextResponse.json({ error: "Terjadi kesalahan saat mengunggah foto" }, { status: 500 });
  }
}
