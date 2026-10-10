import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getEditorialSession, resolveAuthorName } from "@/lib/auth";
import {
  ACCESS_DENIED_DELETE,
  ARTICLE_COLUMNS_BASE,
  ARTICLE_COLUMNS_WITH_OWNER,
  ensureSupabaseServiceClient,
  fetchArticleForSession,
  sanitizeSlug,
  type ArticleRow,
} from "@/lib/editorial-articles";
import { sanitizeContentInput } from "@/lib/sanitize-html";

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

async function getArticle(id: string, publishedOnly: boolean): Promise<ArticleRow | null> {
  const c = ensureSupabaseServiceClient();
  if (!c.ok) return null;
  let columns = ARTICLE_COLUMNS_WITH_OWNER;
  for (let attempt = 0; attempt < 8; attempt++) {
    let query = c.client
      .from("articles")
      .select(columns)
      .eq("id", id);
    // HIGH-1: pemanggil tanpa sesi admin TIDAK BOLEH menerima draf —
    // filter di sisi query, bukan di JS pasca-baca.
    if (publishedOnly) query = query.eq("status", "published");
    const res = await query.maybeSingle();
    if (!res.error) return (res.data as ArticleRow | null) ?? null;
    const m = /Could not find the '([^']+)' column/i.exec(res.error.message || "");
    if (!m) {
      // Skema tanpa kolom `status`: ambil tanpa filter lalu tegakkan di JS
      // (fail-closed — baris non-published tetap ditolak).
      if (publishedOnly) {
        const fallback = await getArticle(id, false);
        return fallback && fallback.status === "published" ? fallback : null;
      }
      return null;
    }
    const parts = columns.split(",").map((s) => s.trim()).filter(Boolean);
    const kept = parts.filter((p) => p !== m[1]);
    if (kept.length === parts.length) return null;
    columns = kept.join(",");
  }
  return null;
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

  // Jalur cepat: ID numerik. Anonim/non-admin HANYA boleh menerima baris
  // published; draf/archived wajib sesi admin terverifikasi. Non-admin
  // mendapat 404 (bukan 403) agar keberadaan draf tidak terkonfirmasi.
  if (/^\d+$/.test(raw)) {
    const pub = await getArticle(String(Number(raw)), true);
    if (pub) return NextResponse.json(pub);
    const session = await getEditorialSession();
    if (session?.isAdmin) {
      const data = await getArticle(String(Number(raw)), false);
      if (data) return NextResponse.json(data);
    }
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
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

  // Penulis biasa terkunci ke identitas sesi loginnya (auth.getUser());
  // administrator tetap bebas menetapkan nama penulis tampilan.
  // Nama bot otomatisasi selalu dinetralkan di kedua peran.
  // Slug non-admin DIABAIKAN dari payload: dipertahankan dari baris
  // existing (kontinuitas arsip) atau diturunkan server dari nama —
  // tidak pernah dari klaim klien, agar tak bisa pindah arsip orang lain.
  const author = resolveAuthorName(session, requestedAuthor, fallbackAuthor, true);
  const cleanRequestedSlug = sanitizeSlug(requestedSlug);
  const existingSlug = sanitizeSlug(existing.author_slug ?? "");
  const authorSlug = session.isAdmin
    ? cleanRequestedSlug || existingSlug || slugify(author)
    : existingSlug || slugify(author);

  const fullUpdate: Record<string, unknown> = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt,
    content: sanitizeContentInput(body.content) ?? [],
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

  // MODUL 1 — Foto Tambahan dual-mode (kanonis `optional_image*` +
  // alias `secondary_image*`); kosong → null.
  const normImg = (v: unknown): string | null => {
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s : null;
  };
  const optionalImage = normImg(
    body.optional_image ?? body.secondary_image ?? null
  );
  const optionalCaption = normImg(
    body.optional_image_caption ?? body.secondary_image_caption ?? null
  );
  fullUpdate.optional_image = optionalImage;
  fullUpdate.optional_image_caption = optionalCaption;
  fullUpdate.secondary_image = normImg(
    body.secondary_image ?? body.optional_image ?? null
  );
  fullUpdate.secondary_image_caption = normImg(
    body.secondary_image_caption ?? body.optional_image_caption ?? null
  );
  fullUpdate.secondary_image_credit = normImg(
    body.secondary_image_credit ??
      (typeof body.optional_image_credit === "string"
        ? body.optional_image_credit
        : null)
  );

  const { data, error } = await updateTolerant(c.client, id, fullUpdate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/kategori");
  revalidatePath("/penulis/[slug]", "page");
  revalidatePath("/[slug]", "page");
  // Jalur konkret artikel revisi (rute publik memakai /<slug>).
  if (data && typeof data === "object") {
    const row = data as { slug?: unknown; id?: unknown };
    const slug = String(row.slug || "").trim() || String(row.id ?? id).trim();
    if (slug) revalidatePath(`/${slug}`);
  }
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