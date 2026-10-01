import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { adminClient, isSupabaseReady } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

function ensureClient() {
  const r = isSupabaseReady();
  if (!r.ok) return { ok: false as const, error: r.reason };
  if (!adminClient) return { ok: false as const, error: "Service key belum di-set" };
  return { ok: true as const, client: adminClient };
}

// Skema resmi mencakup kolom `status` TEXT ('published' | 'draft').
// Update dikirim lengkap; setiap kolom yang ditolak schema-cache dibuang
// satu per satu lalu diulang (zero data loss, toleran antar-lingkungan).
function isMissingColumnError(message: string): { column: string } | null {
  const m = /Could not find the '([^']+)' column/i.exec(message || "");
  return m ? { column: m[1] } : null;
}

async function updateTolerant(
  client: { from: (t: string) => any },
  id: string,
  values: Record<string, unknown>
) {
  const pending: Record<string, unknown> = { ...values };
  let lastError: { message: string } | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await client
      .from("articles")
      .update(pending)
      .eq("id", id)
      .select()
      .single();
    if (!error) return { data, error: null };
    const miss = isMissingColumnError(error.message);
    if (!miss || !(miss.column in pending)) return { data: null, error };
    delete pending[miss.column];
    lastError = error;
  }
  return { data: null, error: lastError };
}

async function getArticle(id: string) {
  const c = ensureClient();
  if (!c.ok) return null;
  const { data } = await c.client.from("articles").select("*").eq("id", id).single();
  return data;
}

// GET /api/articles/[id] — satu artikel (public).
// Mendukung slug SEO maupun ID numerik lawas.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Jalur cepat: ID numerik via service_role.
  if (/^\d+$/.test(String(id).trim())) {
    const data = await getArticle(String(Number(id)));
    if (data) return NextResponse.json(data);
  }
  // Fallback: cocokkan slug turunan (tanpa perlu kolom slug di DB).
  const { getArticleBySlugOrId } = await import("@/lib/data");
  const bySlug = await getArticleBySlugOrId(id);
  if (bySlug) return NextResponse.json(bySlug);
  return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
}

// PUT /api/articles/[id] — update artikel (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body kosong" }, { status: 400 });

  // Baris lama dibaca dulu agar author_slug yang sudah mapan (mis. nama
  // penulis) lestari saat redaksi menyimpan tanpa nilai eksplisit.
  const { data: existing } = await c.client
    .from("articles")
    .select("author_slug")
    .eq("id", id)
    .single();

  // FIX transisi draf→publikasi: status ditulis eksplisit apa adanya
  // ('draft' tetap draft, 'published' terbit) — TANPA pengacakan author_slug
  // staging. Inilah akar bug lama: update ke published menimpa author_slug
  // dengan prefix staging- sehingga baris tak pernah lolos filter publik.
  const status = body.status === "draft" ? "draft" : "published";
  const authorSlug = body.authorSlug ?? body.author_slug ?? existing?.author_slug ?? "redaksi-generic";

  const fullUpdate: Record<string, unknown> = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt,
    content: body.content,
    image: body.image ?? body.cover_image ?? null,
    tags: body.tags ?? [],
    author: body.author,
    author_slug: authorSlug,
    author_role: body.authorRole ?? body.author_role ?? null,
    date: body.date,
    image_caption: body.image_caption ?? "",
    image_credit: body.image_credit ?? "",
    lead: body.lead ?? body.excerpt,
    status,
  };

  let { data, error } = await updateTolerant(c.client, id, fullUpdate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/penulis/[slug]", "page");
  revalidatePath("/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  return NextResponse.json(data);
}

// DELETE /api/articles/[id] — hapus artikel (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });

  const { id } = await params;
  // Permanent delete via service_role (bypass RLS) — admin only (dicek di atas).
  const { error } = await c.client.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  return NextResponse.json({ ok: true });
}