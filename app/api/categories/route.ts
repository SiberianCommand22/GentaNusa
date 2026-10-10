import { NextResponse, type NextRequest } from "next/server";
import { getEditorialSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getEditorialSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Akses ditolak. Wajib login." }, { status: 401 }) };
  }
  if (!session.isAdmin) {
    return { error: NextResponse.json({ error: "Hanya Administrator." }, { status: 403 }) };
  }
  return { session };
}

// Kategori resmi GentaNusa — kanonis di kode (tidak ada tabel
// `public.categories` di Supabase, jadi rute ini tidak menyentuh DB).
const STATIC_CATEGORIES = [
  { slug: "nasional", name: "Nasional" },
  { slug: "pertahanan", name: "Pertahanan" },
  { slug: "politik", name: "Politik" },
  { slug: "ekonomi", name: "Ekonomi" },
  { slug: "dunia", name: "Dunia" },
  { slug: "sosial-budaya", name: "Sosial Budaya" },
  { slug: "kesehatan", name: "Kesehatan" },
  { slug: "olahraga", name: "Olahraga" },
  { slug: "keamanan", name: "Keamanan" },
];

// GET — daftar kategori (public, statis).
export async function GET() {
  return NextResponse.json(STATIC_CATEGORIES);
}

// POST — dinonaktifkan: daftar kanal bersifat tetap.
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  return NextResponse.json(
    { error: "Daftar kategori bersifat tetap dan dikelola di kode." },
    { status: 410 }
  );
}

// DELETE — dinonaktifkan: daftar kanal bersifat tetap.
export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  return NextResponse.json(
    { error: "Daftar kategori bersifat tetap dan dikelola di kode." },
    { status: 410 }
  );
}
