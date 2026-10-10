import { NextResponse } from "next/server";
import { getEditorialSession } from "@/lib/auth";
import { getCategories } from "@/lib/data";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak. Wajib login." }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Hanya Administrator." }, { status: 403 });
  }
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
