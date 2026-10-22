import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/app/api/rate-limit";
// RINGAN KUOTA: impor data HANYA dari fetch-REST murni (tanpa supabase-js
// ±215 KB) agar bundel fungsi tetap di bawah batas 1 MB paket Hobby.
import {
  ACCESS_DENIED_DELETE_OWN,
  canDeleteArticleRest,
  deleteArticleById,
  ensureRestClient,
  fetchArticlesForSessionRest as fetchArticlesForSession,
  getArticleByIdLite,
  getEditorialSessionRest as getEditorialSession,
  getPublicArticlesLite as getArticles,
  insertArticleTolerant,
  resolveAuthorNameRest as resolveAuthorName,
  sanitizeSlugRest as sanitizeSlug,
} from "@/lib/supabase-rest";
// Sanitizer backend regex-murni (`lib/sanitize-server`, NOL jsdom/DOM)
// dimuat malas di dalam handler tulis saja — tidak ada impor DOM di bundle
// serverless, sehingga ERR_REQUIRE_ESM tidak mungkin terjadi.

// Selalu dinamis: jangan pernah diprerender statis (baca cookie sesi +
// searchParams per request). Mencegah 500 kosong dari prerender-prod.
export const dynamic = "force-dynamic";

// Kunci runtime Node.js Serverless (kuota 50 MB) — JANGAN pakai Edge
// (batas 1 MB paket Hobby): rute ini memakai fetch PostgREST + JSON besar.
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

// GET — daftar artikel.
//   (tanpa scope)     : publik, hanya published, tanpa field sensitif.
//   ?scope=all        : SEMUA baris — KHUSUS Administrator.
//   ?scope=mine       : baris milik penulis yang sedang login (semua role).
//   ?scope=draft      : baris draft milik sesi berjalan.
export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");

  // Cabang privat TIDAK boleh pernah masuk cache mana pun (config headers
  // tidak mencakup path persis /api/articles — feed publik yang dikendalikan
  // handler), jadi no-store dipasang EKSPLISIT di sini.
  const noStore = { headers: { "Cache-Control": "no-store" } } as const;

  if (scope === "all" || scope === "mine" || scope === "draft") {
    // getEditorialSession dibungkus try/catch: kegagalan tak terduga WAJIB
    // menjawab JSON (401/500 ber-body), bukan crash 500 tanpa body yang
    // ditelan halaman admin menjadi tabel kosong "0 berita".
    let session;
    try {
      session = await getEditorialSession(req.headers.get("cookie"));
    } catch {
      return NextResponse.json(
        { error: "Gagal memeriksa sesi. Coba muat ulang halaman." },
        { status: 500, ...noStore }
      );
    }
    if (!session) {
      return NextResponse.json(
        { error: "Butuh login redaksi" },
        { status: 401, ...noStore }
      );
    }
    // Isolasi data: penulis biasa tidak pernah boleh melihat seluruh repo.
    if (scope === "all" && !session.isAdmin) {
      return NextResponse.json(
        { error: "Hanya Administrator yang dapat melihat seluruh berita." },
        { status: 403, ...noStore }
      );
    }
    const result = await fetchArticlesForSession(session, {
      draftsOnly: scope === "draft",
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, ...noStore }
      );
    }
    return NextResponse.json(result.data, noStore);
  }

  const c = ensureRestClient();
  if (!c.ok) {
    return NextResponse.json({ error: c.error }, { status: 503, ...noStore });
  }
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
      })),
      {
        headers: {
          // Feed publik TIDAK membaca cookie sehingga aman disimpan CDN edge
          // selama 60 detik (nol Function Invocation di bawa pembaca). Cabang
          // scope=all/mine/draft tidak memakai header ini — tetap no-store.
          // Catatan: invalidasi revalidatePath menarget halaman ISR HTML;
          // feed JSON ini boleh basi maksimal 60 detik setelah publikasi.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat artikel" },
      { status: 500, ...noStore }
    );
  }
}

// POST — tambah artikel (semua penulis redaksi yang sudah login).
// Kepemilikan dikunci permanen: user_id diisi dari SESI server, bukan dari
// payload klien, sehingga artikel tidak bisa "dipinjam" penulis lain.
export async function POST(req: NextRequest) {
  // Anti-abuse mutasi: bucket terpisah dari unggahan gambar agar kuota
  // publikasi redaksi tidak tergerus endpoint lain. 30/menit/IP cukup
  // longgar untuk kerja redaksi normal, tetapi memutus skrip massal.
  const limited = rateLimit(req, { bucket: "articles:write", limit: 30 });
  if (!limited.ok) return limited.response;

  try {
    const session = await getEditorialSession(req.headers.get("cookie"));
    if (!session) {
      return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
    }
    const c = ensureRestClient();
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

    // Skema resmi: kolom `status` TEXT ('published' | 'draft') ADA di DB.
    // Nilai divalidasi ketat — selain 'draft' selalu menjadi 'published'.
    const status = body.status === "draft" ? "draft" : "published";

    // Aturan validasi dipisah: draf fleksibel, publikasi ketat standar redaksi.
    if (status === "draft") {
      // Draf: hanya judul yang wajib agar jurnalis bisa menyimpan progresif.
      // `excerpt` (Kutipan/Lead) TIDAK BOLEH WAJIB untuk draf.
      const titleDraft = typeof body.title === "string" ? body.title.trim() : "";
      if (!titleDraft) {
        return NextResponse.json({ error: "title wajib" }, { status: 400 });
      }
    } else {
      const required = ["title", "category", "excerpt", "content", "tags"];
      for (const field of required) {
        const v = body[field];
        const empty =
          v === undefined ||
          v === null ||
          (typeof v === "string" && !v.trim()) ||
          (Array.isArray(v) && v.length === 0);
        if (empty || !v) {
          return NextResponse.json({ error: `${field} wajib` }, { status: 400 });
        }
      }
    }

    // Fallback excerpt draf: "" atau 150 karakter pertama content/judul agar
    // kolom NOT NULL di Supabase tidak menolak penyimpanan draf.
    function excerptFallback(): string {
      const raw =
        typeof body.excerpt === "string" && body.excerpt.trim()
          ? body.excerpt.trim()
          : typeof body.lead === "string" && body.lead.trim()
            ? body.lead.trim()
            : "";
      if (raw) return raw;
      if (status === "published") return raw;
      const titlePart = typeof body.title === "string" ? body.title.trim() : "";
      let textPart = "";
      const c = body.content;
      if (typeof c === "string") {
        textPart = c
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        // Bila content berupa JSON string array blok, coba parse dulu.
        if (textPart.startsWith("[") && textPart.endsWith("]")) {
          try {
            const parsed: unknown = JSON.parse(c);
            if (Array.isArray(parsed)) {
              textPart = parsed
                .filter((x): x is string => typeof x === "string")
                .map((s) => s.replace(/<[^>]*>/g, " "))
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();
            }
          } catch {
            // abaikan — pakai textPart apa adanya
          }
        }
      } else if (Array.isArray(c)) {
        textPart = c
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.replace(/<[^>]*>/g, " "))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      }
      const combined = textPart || titlePart;
      return combined.slice(0, 150);
    }
    const excerptFinal = excerptFallback();
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
    // Penulis boleh memakai nama pena/byline kustom (allowCustomByline);
    // kepemilikan tetap murni user_id server dan nama bot tetap dinetralkan.
    const author = resolveAuthorName(session, requestedAuthor, "Redaksi GentaNusa", true);
    const cleanRequestedSlug = sanitizeSlug(requestedSlug);
    const authorSlug = session.isAdmin
      ? cleanRequestedSlug || slugify(author)
      : slugify(author);

    // Sanitasi backend regex-murni (TANPA jsdom/DOM — anti ERR_REQUIRE_ESM
    // di Vercel Serverless). Modul server-only, dimuat malas di jalur tulis.
    const { sanitizeContentInputServer } = await import("@/lib/sanitize-server");
    const allowedPayload: Record<string, unknown> = {
      title: typeof body.title === "string" ? body.title.trim() : body.title,
      category:
        typeof body.category === "string" && body.category.trim()
          ? body.category
          : status === "draft"
            ? "Nasional"
            : body.category,
      excerpt: excerptFinal,
      content: sanitizeContentInputServer(body.content ?? []) ?? [],
      image: body.image ?? body.cover_image ?? null,
      tags: body.tags ?? [],
      author,
      author_slug: authorSlug,
      author_role:
        (typeof body.author_role === "string" && body.author_role) ||
        (typeof body.authorRole === "string" && body.authorRole) ||
        "Redaktur GentaNusa",
      date: body.date || todayWIB,
      image_caption: body.image_caption ?? "",
      image_credit: body.image_credit ?? "",
      lead:
        typeof body.lead === "string" && body.lead.trim()
          ? body.lead
          : excerptFinal,
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

    // Insert toleran skema via PostgREST murni (kolom yang belum ada di DB
    // dikupas otomatis, maks 8x — zero data loss antar-lingkungan).
    const { data, error } = await insertArticleTolerant({ ...allowedPayload });

    if (error) {
      console.error("[POST /api/articles] insert gagal:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan internal pada server" },
        { status: 500 }
      );
    }
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
    // Jalur konkret artikel baru (rute publik memakai /<slug>, bukan /berita/).
    if (data && typeof data === "object") {
      const row = data as { slug?: unknown; id?: unknown };
      const slug = String(row.slug || "").trim() || String(row.id ?? "").trim();
      if (slug) revalidatePath(`/${slug}`);
    }
    revalidatePath("/admin");
    revalidatePath("/admin/posts");
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/articles] unhandled error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}

// DELETE — hapus artikel.
// Administrator: akses penuh ke artikel mana pun.
// Editor/penulis redaksi: HANYA boleh menghapus artikel miliknya sendiri
// (article.user_id === session.userId); milik orang lain → 403.
export async function DELETE(req: NextRequest) {
  const session = await getEditorialSession(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Butuh login redaksi" }, { status: 401 });
  }
  const c = ensureRestClient();
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 503 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) {
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  }
  // Penjagaan kepemilikan: ambil dulu baris target, lalu cek user_id.
  // Baris lawas tanpa user_id hanya boleh dihapus admin (fail-closed).
  if (!session.isAdmin) {
    const target = await getArticleByIdLite(String(numId), false);
    if (!target) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }
    if (!canDeleteArticleRest(target, session)) {
      return NextResponse.json({ error: ACCESS_DENIED_DELETE_OWN }, { status: 403 });
    }
  }
  const { error } = await deleteArticleById(numId);
  if (error) {
    console.error("[DELETE /api/articles] hapus gagal:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
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