import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getEditorialSession, resolveAuthorName } from "@/lib/auth";
import { getArticles } from "@/lib/data";
import {
  ACCESS_DENIED_DELETE,
  ensureSupabaseServiceClient,
  fetchArticlesForSession,
  sanitizeSlug,
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

// GET — daftar artikel.
//   (tanpa scope)     : publik, hanya published, tanpa field sensitif.
//   ?scope=all        : SEMUA baris — KHUSUS Administrator.
//   ?scope=mine       : baris milik penulis yang sedang login (semua role).
//   ?scope=draft      : baris draft milik sesi berjalan.
export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");

  if (scope === "all" || scope === "mine" || scope === "draft") {
    const session = await getEditorialSession();
    if (!session) {
      return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
    }
    // Isolasi data: penulis biasa tidak pernah boleh melihat seluruh repo.
    if (scope === "all" && !session.isAdmin) {
      return NextResponse.json(
        { error: "Hanya Administrator yang dapat melihat seluruh berita." },
        { status: 403 }
      );
    }
    const result = await fetchArticlesForSession(session, {
      draftsOnly: scope === "draft",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.data);
  }

  const c = ensureSupabaseServiceClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  try {
    const articles = await getArticles();
    return NextResponse.json(
      articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        category: a.category,
        excerpt: a.excerpt,
        date: a.date,
        author: a.author,
        image: a.image,
        tags: a.tags,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Gagal memuat artikel" }, { status: 500 });
  }
}

// POST — tambah artikel (semua penulis redaksi yang sudah login).
// Kepemilikan dikunci permanen: user_id diisi dari SESI server, bukan dari
// payload klien, sehingga artikel tidak bisa "dipinjam" penulis lain.
export async function POST(req: NextRequest) {
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
  }
  const c = ensureSupabaseServiceClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const required = ["title", "category", "excerpt", "content", "tags"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} wajib` }, { status: 400 });
    }
  }

  // Skema resmi: kolom `status` TEXT ('published' | 'draft') ADA di DB.
  // Nilai divalidasi ketat — selain 'draft' selalu menjadi 'published'.
  const status = body.status === "draft" ? "draft" : "published";
  const todayWIB = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

  const requestedAuthor = typeof body.author === "string" ? body.author.trim() : "";
  const requestedSlug =
    typeof body.author_slug === "string"
      ? body.author_slug.trim()
      : typeof body.authorSlug === "string"
        ? body.authorSlug.trim()
        : "";

  // Penulis biasa: nama dikunci ke identitas sesi login (auth.getUser()),
  // bukan input klien dan bukan nama bot. Slug atribusi diturunkan server
  // dari nama terverifikasi — klaim slug kustom non-admin DIABAIKAN agar
  // artikel tidak bisa disusupkan ke arsip penulis lain. Administrator
  // tetap bebas menetapkan nama penulis tampilan (kecuali nama bot).
  const author = resolveAuthorName(session, requestedAuthor);
  const cleanRequestedSlug = sanitizeSlug(requestedSlug);
  const authorSlug = session.isAdmin
    ? cleanRequestedSlug || slugify(author)
    : slugify(author);

  const allowedPayload: Record<string, unknown> = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt,
    content: sanitizeContentInput(body.content) ?? [],
    image: body.image ?? body.cover_image ?? null,
    tags: body.tags,
    author,
    author_slug: authorSlug,
    author_role:
      (typeof body.author_role === "string" && body.author_role) ||
      (typeof body.authorRole === "string" && body.authorRole) ||
      "Redaktur GentaNusa",
    date: body.date || todayWIB,
    image_caption: body.image_caption ?? "",
    image_credit: body.image_credit ?? "",
    lead: body.lead ?? body.excerpt,
    status,
    // Kunci kepemilikan (Pilar 3.4). Null bila migrasi kolom belum jalan —
    // helper pemBACAan sudah tolerate hal ini via author_slug.
    user_id: session.userId ?? null,
  };

  // MODUL 1 — Foto Tambahan / Foto Kedua (dual-mode editorial).
  // Terima NAMA KANONIK `optional_image*` maupun alias lawas
  // `secondary_image*`; kosong → null (jangan string kosong / error).
  // Loop insert toleran di bawah otomatis membuang kolom yang belum ada
  // di skema Supabase (zero data loss antar-lingkungan).
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
  const secondaryImage = normImg(
    body.secondary_image ?? body.optional_image ?? null
  );
  const secondaryCaption = normImg(
    body.secondary_image_caption ?? body.optional_image_caption ?? null
  );
  const secondaryCredit = normImg(
    body.secondary_image_credit ??
      (typeof body.optional_image_credit === "string"
        ? body.optional_image_credit
        : null)
  );
  allowedPayload.optional_image = optionalImage;
  allowedPayload.optional_image_caption = optionalCaption;
  allowedPayload.secondary_image = secondaryImage;
  allowedPayload.secondary_image_caption = secondaryCaption;
  allowedPayload.secondary_image_credit = secondaryCredit;

  const pending: Record<string, unknown> = { ...allowedPayload };
  let data = null;
  let error: { message?: string } | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await c.client.from("articles").insert([pending]).select().single();
    data = res.data;
    error = res.error;
    if (!error) break;
    const m = /Could not find the '([^']+)' column/i.exec(error.message || "");
    if (!m || !(m[1] in pending)) break;
    delete pending[m[1]];
    error = null;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/penulis/[slug]", "page");
  revalidatePath("/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  return NextResponse.json(data, { status: 201 });
}

// DELETE — hapus artikel. HAK EKSKLUSIF ADMINISTRATOR.
// Penulis biasa: 403 Forbidden, apa pun status sesinya.
export async function DELETE(req: NextRequest) {
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: ACCESS_DENIED_DELETE }, { status: 403 });
  }
  const c = ensureSupabaseServiceClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) {
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  }
  const { error } = await c.client.from("articles").delete().eq("id", numId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  return NextResponse.json({ ok: true });
}