import { NextResponse, type NextRequest } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";

const IMAGE_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

type ImageExtension = keyof typeof IMAGE_TYPES;

function isImageName(name: string): name is `${string}.${ImageExtension}` {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp)$/i.test(name);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const ready = isSupabaseReady();
  if (!ready.ok || !adminClient) {
    return NextResponse.json({ error: "Storage belum siap" }, { status: 503 });
  }

  const { name } = await params;
  if (!isImageName(name)) {
    return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await adminClient.storage
    .from("articles")
    .download(`articles/${name}`);

  if (error || !data) {
    return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
  }

  const extension = name.split(".").pop()?.toLowerCase() as ImageExtension;
  return new NextResponse(data, {
    headers: {
      "Content-Type": IMAGE_TYPES[extension],
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
