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

// Kolom slug/lead/cover_image/image_caption/image_credit ada bila migrasi
// scripts/migrate-articles.sql sudah dijalankan. Update dicoba LENGKAP dulu;
// bila DB belum dimigrasi, jatuh ke kolom inti agar edit TETAP tersimpan
// (zero data loss) tanpa error schema-cache. `status`/`updated_at` TIDAK
// dikirim — kolomnya tidak ada di skema (draft dikodekan via author_slug).
function isMissingColumnError(message: string): boolean {
  return /could not find the .* column|schema cache|column .* does not exist/i.test(
    message || ""
  );
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
  // penulis) lestari saat redaksi menerbitkan tanpa nilai eksplisit.
  const { data: existing } = await c.client
    .from("articles")
    .select("author_slug")
    .eq("id", id)
    .single();

  // status "draft" → kembalikan ke staging; "published" → terbitkan dengan
  // slug redaksi. Tanpa status: pertahankan perilaku lama (slug dari body).
  const isDraft = body.status === "draft";
  const authorSlug = isDraft
    ? `staging-${String(body.title || "artikel")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40)}-${Date.now().toString(36)}`
    : body.authorSlug ?? existing?.author_slug ?? "redaksi-generic";

  const fullUpdate: Record<string, unknown> = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt,
    lead: body.lead ?? body.excerpt,
    content: body.content,
    image: body.image ?? body.cover_image ?? null,
    cover_image: body.cover_image ?? body.image ?? null,
    image_caption: body.image_caption ?? "",
    image_credit: body.image_credit ?? "",
    tags: body.tags ?? [],
    author: body.author,
    author_slug: authorSlug,
    author_role: body.authorRole ?? null,
    date: body.date,
  };
  // Slug lama dipertahankan form; jangan timpa dengan nilai kosong.
  if (body.slug) fullUpdate.slug = body.slug;

  let { data, error } = await c.client
    .from("articles")
    .update(fullUpdate)
    .eq("id", id)
    .select()
    .single();

  // DB belum dimigrasi → ulangi dengan kolom inti saja, edit tetap tersimpan.
  if (error && isMissingColumnError(error.message)) {
    const { slug, lead, cover_image, image_caption, image_credit, ...baseUpdate } =
      fullUpdate;
    ({ data, error } = await c.client
      .from("articles")
      .update(baseUpdate)
      .eq("id", id)
      .select()
      .single());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
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