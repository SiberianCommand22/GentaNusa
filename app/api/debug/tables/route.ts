import { NextResponse } from "next/server";
import { getCategories } from "@/lib/data";

export async function GET() {
  // Tabel `public.categories` tidak ada di Supabase — kategori bersifat
  // statis di kode, jadi endpoint debug ini hanya melaporkan daftar kanonis.
  const localCategories = await getCategories();
  return NextResponse.json({
    table: "categories",
    source: "static",
    rowCount: localCategories.length,
    error: null,
  });
}
