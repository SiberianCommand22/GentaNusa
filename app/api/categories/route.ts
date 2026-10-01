import { NextResponse, type NextRequest } from "next/server";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

// Kategori resmi GentaNusa — kanonis di kode (tidak ada tabel
// `public.categories` di Supabase, jadi rute ini tidak menyentuh DB).
const STATIC_CATEGORIES = [
  { slug: "nasional", name: "Nasional" },
  { slug: "pertahanan", name: "Pertahanan" },
  { slug: "politik", name: "Politik" },
  { slug: "ekonomi", name: "Ekonomi" },
  { slug: "dunia", name: "Dunia" },
];

// GET — daftar kategori (public, statis).
export async function GET() {
  return NextResponse.json(STATIC_CATEGORIES);
}

// POST — dinonaktifkan: daftar kanal bersifat tetap.
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Daftar kategori bersifat tetap dan dikelola di kode." },
    { status: 410 }
  );
}

// DELETE — dinonaktifkan: daftar kanal bersifat tetap.
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Daftar kategori bersifat tetap dan dikelola di kode." },
    { status: 410 }
  );
}
