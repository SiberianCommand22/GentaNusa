import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getEditorialSession } from "@/lib/auth";
import {
  ACCESS_DENIED_DELETE,
  ARTICLE_COLUMNS_BASE,
  ARTICLE_COLUMNS_WITH_OWNER,
  ensureSupabaseServiceClient,
  fetchArticleForSession,
  type ArticleRow,
} from "@/lib/editorial-articles";

function slugify(value: string): string {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "penulis"
  );
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

async function getArticle(id: string): Promise<ArticleRow | null> {
  const c = ensureSupabaseServiceClient();
  if (!c.ok) return null;
  const first = await c.client
    .from("articles")
    .select(ARTICLE_COLUMNS_WITH_OWNER)
    .eq("id", id)
    .maybeSingle();
  if (first.error && /user_id/i.test(first.error.message || "")) {
    const retry = await c.client
      .from("articles")
      .select(ARTICLE_COLUMNS_BASE)
      .eq("id", id)
      .maybeSingle();
    return (retry.data as ArticleRow | null) ?? null;
  }
  return (first.data as ArticleRow | null) ?? null;
}

// GET /api/articles/[id] — satu artikel (publik).
// ?scope=edit — mode editor: MENJAGA KEPEMILIKAN (penulis lain → 403).
// Mendukung slug SEO maupun ID numerik lawas.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const raw = String(id).trim();
  const wantsEditScope = req.nextUrl.searchParams.get("scope") === "edit";

  if (wantsEditScope) {
    const session = await getEditorialSession();
    if (!session) {
      return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
    }
    const result = await fetchArticleForSession(session, raw);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.article);
  }

  // Jalur cepat: ID numerik via service_role.
  if (/^\d+$/.test(raw)) {
    const data = await getArticle(String(Number(raw)));
    if (data) return NextResponse.json(data);
  }
  // Fallback: cocokkan slug turunan (tanpa perlu kolom slug di DB).
  const { getArticleBySlugOrId } = await import("@/lib/data");
  const bySlug = await getArticleBySlugOrId(id);
  if (bySlug) return NextResponse.json(bySlug);
  return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
}

// PUT /api/articles/[id] — update artikel.
// Administrators: bebas. Penulis biasa: HANYA artikel miliknya sendiri
// (403 "Akses Ditolak: ..." bila ID milik penulis lain).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
  }
  const c = ensureSupabaseServiceClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });

  const { id } = await params;

  // Penjagaan kepemilikan ditebak SEBELUM menulis apa pun.
  const owned = await fetchArticleForSession(session, id);
  if (!owned.ok) {
    return NextResponse.json({ error: owned.error }, { status: owned.status });
  }
  const existing = owned.article;

  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body kosong" }, { status: 400 });
  }

  // FIX transisi draf->publikasi: status ditulis eksplisit apa adanya
  // ('draft' tetap draft, 'published' terbit) — TANPA pengacakan author_slug
  // staging. Inilah akar bug lama: update ke published menimpa author_slug
  // dengan prefix staging- sehingga baris tak pernah lolos filter publik.
  const status = body.status === "draft" ? "draft" : "published";
  const requestedSlug =
    typeof body.author_slug === "string"
      ? body.author_slug.trim()
      : typeof body.authorSlug === "string"
        ? body.authorSlug.trim()
        : "";
  const requestedAuthor = typeof body.author === "string" ? body.author.trim() : "";
  const fallbackAuthor =
    session.fullName || String(existing.author || "").trim() || "Redaksi GentaNusa";

  // Penulis biasa terkunci ke identitas akunnya; administrator tetap bebas
  // menetapkan nama penulis tampilan.
  const author = session.isAdmin
    ? requestedAuthor || fallbackAuthor
    : fallbackAuthor;
  const authorSlug = session.isAdmin
    ? requestedSlug || String(existing.author_slug ?? "") || slugify(author)
    : session.authorSlug || String(existing.author_slug ?? "") || slugify(author);

  const fullUpdate: Record<string, unknown> = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt,
    content: body.content,
    image: body.image ?? body.cover_image ?? null,
    tags: body.tags ?? [],
    author,
    author_slug: authorSlug,
    author_role:
      (typeof body.author_role === "string" && body.author_role) ||
      (typeof body.authorRole === "string" && body.authorRole) ||
      existing.author_role ||
      null,
    date: body.date,
    image_caption: body.image_caption ?? "",
    image_credit: body.image_credit ?? "",
    lead: body.lead ?? body.excerpt,
    status,
    // `user_id` SENGAJA tidak ditulis di sini: kepemilikan artikel bersifat
    // permanen sejak baris pertama dibuat (tidak bisa dialihkan-ecak oleh
    // admin saat menyunting, termasuk lewat payload klien).
  };

  const { data, error } = await updateTolerant(c.client, id, fullUpdate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/penulis/[slug]", "page");
  revalidatePath("/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  return NextResponse.json(data);
}

// DELETE /api/articles/[id] — hapus artikel.
// HAK EKSKLUSIF ADMINISTRATOR: selain itu 403 Forbidden, tidak ada pengecualian.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: ACCESS_DENIED_DELETE }, { status: 403 });
  }
  const c = ensureSupabaseServiceClient();
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