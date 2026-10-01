import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getArticles } from "@/lib/data";

function isAdmin(req: NextRequest) {
  return req.cookies.get("genta_admin")?.value === "1";
}

function ensureClient() {
  const r = isSupabaseReady();
  if (!r.ok) return { ok: false as const, error: r.reason };
  if (!adminClient) return { ok: false as const, error: "Service key belum di-set" };
  return { ok: true as const, client: adminClient };
}

// Slug unik untuk draft — prefix `staging-` disembunyikan dari situs publik
// oleh filter di lib/data.ts hingga redaksi mempublikasikannya.
function draftSlug(title: string): string {
  const base =
    String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "artikel";
  return `staging-${base}-${Date.now().toString(36)}`;
}

// GET — daftar artikel (public, hanya published) — tanpa field sensitif
// GET ?scope=all — seluruh baris incl. draft (admin saja, untuk CMS)
// GET ?scope=draft — baris draft (admin saja, untuk metrik CMS)
export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");
  if (scope === "draft" || scope === "all") {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
    }
    const c = ensureClient();
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
    let query = c.client
      .from("articles")
      .select("id,title,category,excerpt,date,author,author_slug,image,tags,status")
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (scope === "draft") query = query.eq("status", "draft");
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }
  const c = ensureClient();
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
  } catch (e) {
    return NextResponse.json({ error: "Gagal memuat artikel" }, { status: 500 });
  }
}

// POST — tambah artikel (admin)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const c = ensureClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });

  let body;
  try {
    body = await req.json();
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

  const allowedPayload: Record<string, unknown> = {
    title: body.title,
    category: body.category,
    excerpt: body.excerpt,
    content: body.content,
    image: body.image ?? body.cover_image ?? null,
    tags: body.tags,
    author: body.author || "Redaksi GentaNusa",
    author_slug: body.authorSlug || body.author_slug || "redaksi-generic",
    author_role: body.authorRole || body.author_role || "Redaktur GentaNusa",
    date: body.date || todayWIB,
    image_caption: body.image_caption ?? "",
    image_credit: body.image_credit ?? "",
    lead: body.lead ?? body.excerpt,
    status,
  };

  const pending: Record<string, unknown> = { ...allowedPayload };
  let data = null;
  let error = null;
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

// DELETE — hapus artikel (admin)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Butuh login admin" }, { status: 401 });
  }
  const c = ensureClient();
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