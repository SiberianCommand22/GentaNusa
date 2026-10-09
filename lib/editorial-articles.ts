import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import type { EditorialSession } from "@/lib/auth";

/**
 * Isolasi data penulis (multi-author isolation).
 *
 * Semua pembacaan tabel `articles` untuk keperluan redaksi harus lewat helper
 * di berkas ini supaya aturan kepemilikan tidak bisa dilewati oleh rute baru:
 *
 *  - Administrator  -> seluruh baris (lihat semua berita).
 *  - Penulis biasa   -> HANYA baris miliknya sendiri, difilter di sisi server
 *                      lewat `.or("user_id.eq.<uuid>,author_slug.eq.<slug>")`.
 *
 * Kolom `user_id` bersifat opsional: bila migrasi SQL belum dijalankan,
 * helper otomatis mundur ke filter `author_slug` (lihat OWNER COLUMN cache).
 */

export type ArticleRow = {
  id: number;
  slug?: string | null;
  title: string;
  category: string;
  excerpt?: string | null;
  content?: string[] | string | null;
  lead?: string | null;
  date: string;
  author: string;
  author_slug?: string | null;
  author_role?: string | null;
  image?: string | null;
  cover_image?: string | null;
  image_caption?: string | null;
  image_credit?: string | null;
  secondary_image?: string | null;
  secondary_image_caption?: string | null;
  secondary_image_credit?: string | null;
  optional_image?: string | null;
  optional_image_caption?: string | null;
  optional_image_credit?: string | null;
  tags?: string[] | string | null;
  status?: string | null;
  user_id?: string | null;
};

export const ARTICLE_COLUMNS_BASE =
  "id,slug,title,category,excerpt,content,lead,date,author,author_slug,author_role,image,cover_image,image_caption,image_credit,secondary_image,secondary_image_caption,secondary_image_credit,optional_image,optional_image_caption,tags,status,created_at";

export const ARTICLE_COLUMNS_WITH_OWNER = `${ARTICLE_COLUMNS_BASE},user_id`;

/** Pesan error kanonik saat penulis mencoba menyentuh artikel milik orang lain. */
export const ACCESS_DENIED_EDIT =
  "Akses Ditolak: Anda tidak memiliki izin mengedit artikel ini.";

/** Pesan error kanonik saat penulis biasa mencoba menghapus berita. */
export const ACCESS_DENIED_DELETE =
  "Hanya Administrator Utama yang berhak menghapus berita.";

/**
 * Cache proses: null = belum diketahui, true = kolom ada, false = kolom belum
 * ada di skema. Setelah ketahuan tidak ada, query berhenti menebak kolom.
 */
let ownerColumnAvailable: boolean | null = null;

export function ensureSupabaseServiceClient():
  | { ok: true; client: SupabaseClient }
  | { ok: false; error: string } {
  const ready = isSupabaseReady();
  if (!ready.ok) return { ok: false, error: ready.reason };
  if (!adminClient) return { ok: false, error: "Service key belum di-set" };
  return { ok: true, client: adminClient };
}

function isMissingOwnerColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /user_id/i.test(error.message || "");
}

function extractMissingColumn(error: { message?: string } | null): string | null {
  const m = /Could not find the '([^']+)' column/i.exec(error?.message || "");
  return m ? m[1] : null;
}

/** Baris dianggap milik sesi bila UUID atau author_slug cocok. */
export function ownsArticle(
  article: { user_id?: string | null; author_slug?: string | null } | null,
  session: EditorialSession | null
): boolean {
  if (!article || !session) return false;
  if (article.user_id && session.userId && article.user_id === session.userId) return true;
  const slug = String(article.author_slug ?? "").trim();
  const mine = String(session.authorSlug ?? "").trim();
  return Boolean(slug && mine && slug === mine);
}

/** Administrator boleh mengedit apa pun; selain itu harus pemilik artikel. */
export function canEditArticle(
  article: { user_id?: string | null; author_slug?: string | null } | null,
  session: EditorialSession | null
): boolean {
  if (!session) return false;
  if (session.isAdmin) return true;
  return ownsArticle(article, session);
}

export type ArticleListResult =
  | { ok: true; data: ArticleRow[] }
  | { ok: false; status: number; error: string };

/**
 * Daftar artikel untuk ruang kerja redaksi.
 * - Administrator: seluruh baris.
 * - Penulis biasa: hanya baris miliknya.
 */
export async function fetchArticlesForSession(
  session: EditorialSession,
  options: { draftsOnly?: boolean } = {}
): Promise<ArticleListResult> {
  const c = ensureSupabaseServiceClient();
  if (!c.ok) return { ok: false, status: 503, error: c.error };

  const authorSlug = String(session.authorSlug ?? "").trim();

  const run = async (withOwner: boolean, columns: string) => {
    let query = c.client
      .from("articles")
      .select(columns)
      .order("date", { ascending: false })
      .order("id", { ascending: false });

    if (options.draftsOnly) query = query.eq("status", "draft");

    if (!session.isAdmin) {
      const filters: string[] = [];
      if (withOwner && session.userId) filters.push(`user_id.eq.${session.userId}`);
      if (authorSlug) filters.push(`author_slug.eq.${authorSlug}`);
      // Tanpa identitasApa pun yang bisa difilter — jangan bocorkan baris
      // siapa pun; kembalikan kosong.
      if (filters.length === 0) {
        return { data: [] as ArticleRow[], error: null };
      }
      query = query.or(filters.join(","));
    }

    return query;
  };

  const withOwner = ownerColumnAvailable !== false;
  let columns = withOwner ? ARTICLE_COLUMNS_WITH_OWNER : ARTICLE_COLUMNS_BASE;
  let useOwner = withOwner;
  let first = await run(useOwner, columns);
  let data = first.data as ArticleRow[] | null;
  let error = first.error as { code?: string; message?: string } | null;

  // Toleran skema: kupas kolom yang belum ada satu per satu (mis.
  // optional_image / secondary_image di DB lama) lalu ulangi query.
  for (let attempt = 0; attempt < 8 && error; attempt++) {
    const missing = extractMissingColumn(error);
    if (!missing) break;
    if (/^user_id$/i.test(missing)) {
      ownerColumnAvailable = false;
      useOwner = false;
      columns = ARTICLE_COLUMNS_BASE;
    } else {
      // Buang kolom hilang dari daftar select (cocok persis / substring).
      const parts = columns.split(",").map((s) => s.trim()).filter(Boolean);
      const kept = parts.filter((p) => p !== missing);
      if (kept.length === parts.length) break;
      columns = kept.join(",");
    }
    const retry = await run(useOwner, columns);
    data = retry.data as ArticleRow[] | null;
    error = retry.error as { code?: string; message?: string } | null;
  }
  if (!error && useOwner) ownerColumnAvailable = true;

  if (error) return { ok: false, status: 500, error: error.message ?? "Gagal memuat artikel" };
  return { ok: true, data: data ?? [] };
}

export type ArticleFetchResult =
  | { ok: true; article: ArticleRow }
  | { ok: false; status: number; error: string };

/**
 * Ambil satu artikel untuk diedit — dengan PENJAGAAN KEPEMILIKAN.
 * Penulis biasa hanya boleh membuka ID yang dia miliki; selain itu 403.
 */
export async function fetchArticleForSession(
  session: EditorialSession,
  rawId: string | number
): Promise<ArticleFetchResult> {
  const c = ensureSupabaseServiceClient();
  if (!c.ok) return { ok: false, status: 503, error: c.error };

  const id = String(rawId).trim();
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return { ok: false, status: 400, error: "id tidak valid" };
  }

  const withOwner = ownerColumnAvailable !== false;
  let selColumns = withOwner ? ARTICLE_COLUMNS_WITH_OWNER : ARTICLE_COLUMNS_BASE;
  let selOwner = withOwner;
  const read = async (useOwner: boolean, columns: string) => {
    const { data, error } = await c.client
      .from("articles")
      .select(columns)
      .eq("id", Number(id))
      .limit(1)
      .maybeSingle();
    return { data, error };
  };

  const first = await read(selOwner, selColumns);
  let article = first.data as ArticleRow | null;
  let error = first.error as { code?: string; message?: string } | null;

  for (let attempt = 0; attempt < 8 && error; attempt++) {
    const missing = extractMissingColumn(error);
    if (!missing) break;
    if (/^user_id$/i.test(missing)) {
      ownerColumnAvailable = false;
      selOwner = false;
      selColumns = ARTICLE_COLUMNS_BASE;
    } else {
      const parts = selColumns.split(",").map((s) => s.trim()).filter(Boolean);
      const kept = parts.filter((p) => p !== missing);
      if (kept.length === parts.length) break;
      selColumns = kept.join(",");
    }
    const retry = await read(selOwner, selColumns);
    article = retry.data as ArticleRow | null;
    error = retry.error as { code?: string; message?: string } | null;
  }
  if (!error && selOwner) ownerColumnAvailable = true;

  if (error) return { ok: false, status: 500, error: error.message ?? "Gagal memuat artikel" };
  if (!article) return { ok: false, status: 404, error: "Artikel tidak ditemukan" };
  if (!canEditArticle(article, session)) {
    return { ok: false, status: 403, error: ACCESS_DENIED_EDIT };
  }
  return { ok: true, article };
}