import { NextResponse } from "next/server";
import { getCategories } from "@/lib/data";

export async function GET() {
  // Tidak ada tabel `public.categories` di Supabase — kategori bersifat
  // statis di kode, jadi endpoint debug ini hanya melaporkan daftar kanonis.
  const localCategories = await getCategories();
  const localSlugs = localCategories.map((c) => c.slug);

  return NextResponse.json(
    {
      localCount: localSlugs.length,
      localSlugs,
      db: { source: "static" },
    },
    { status: 200 }
  );
}
