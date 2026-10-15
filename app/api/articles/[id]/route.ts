import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
// RINGAN KUOTA: impor data HANYA dari fetch-REST murni (tanpa supabase-js
// ±215 KB) agar bundel fungsi tetap di bawah batas 1 MB paket Hobby.
import {
  ACCESS_DENIED_DELETE,
  deleteArticleById,
  ensureRestClient,
  fetchArticleForSessionRest as fetchArticleForSession,
  getArticleByIdLite as getArticle,
  getArticleBySlugOrIdLite,
  getEditorialSessionRest as getEditorialSession,
  resolveAuthorNameRest as resolveAuthorName,
  sanitizeSlugRest as sanitizeSlug,
  updateArticleTolerant,
} from "@/lib/supabase-rest";
// Sanitizer backend regex-murni (`lib/sanitize-server`, NOL jsdom/DOM)
// dimuat malas di dalam handler tulis saja — tidak ada impor DOM di bundle
// serverless, sehingga ERR_REQUIRE_ESM tidak mungkin terjadi.

// Selalu dinamis: baca cookie sesi + searchParams per request.
export const dynamic = "force-dynamic";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge
// (batas 1 MB paket Hobby).
export const runtime = "nodejs";

function slugify(value: string): string {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "penulis"
  );
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
    const session = await getEditorialSession(req.headers.get("cookie"));
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
    const session = await getEditorialSession(req.headers.get("cookie"));
    if (session?.isAdmin) {
      const data = await getArticle(String(Number(raw)), false);
      if (data) return NextResponse.json(data);
    }
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
  // Fallback: cocokkan slug turunan (tanpa perlu kolom slug di DB).
  const bySlug = await getArticleBySlugOrIdLite(id);
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
  const session = await getEditorialSession(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
  }
  const c = ensureRestClient();
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

  // Sanitasi backend regex-murni (TANPA jsdom/DOM — anti ERR_REQUIRE_ESM
  // di Vercel Serverless). Modul server-only, dimuat malas di jalur tulis.
  const { sanitizeContentInputServer } = await import("@/lib/sanitize-server");
  const fullUpdate: Record<string, unknown> = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt,
    content: sanitizeContentInputServer(body.content) ?? [],
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

  const { data, error } = await updateArticleTolerant(id, fullUpdate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/kategori");
  // Halaman root-level kanal lama (route terpisah, bukan di bawah /kategori).
  revalidatePath("/nasional");
  revalidatePath("/pertahanan");
  revalidatePath("/politik");
  revalidatePath("/ekonomi");
  revalidatePath("/dunia");
  revalidatePath("/peduli");
  revalidatePath("/penulis/[slug]", "page");
  revalidatePath("/[slug]", "page");
  // Feed & sitemap statis (disajikan dari cache CDN hingga direvalidasi).
  revalidatePath("/sitemap.xml");
  revalidatePath("/news-sitemap.xml");
  revalidatePath("/feed.xml");
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
  const session = await getEditorialSession(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: ACCESS_DENIED_DELETE }, { status: 403 });
  }
  const c = ensureRestClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });

  const { id } = await params;
  // Permanent delete via service_role (bypass RLS) — admin only (dicek di atas).
  const { error } = await deleteArticleById(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/kategori");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/nasional");
  revalidatePath("/pertahanan");
  revalidatePath("/politik");
  revalidatePath("/ekonomi");
  revalidatePath("/dunia");
  revalidatePath("/peduli");
  revalidatePath("/[slug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/news-sitemap.xml");
  revalidatePath("/feed.xml");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  return NextResponse.json({ ok: true });
}