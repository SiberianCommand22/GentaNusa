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
  tags?: string[] | string | null;
  status?: string | null;
  user_id?: string | null;
};

export const ARTICLE_COLUMNS_BASE =
  "id,title,category,excerpt,content,lead,date,author,author_slug,author_role,image,image_caption,image_credit,tags,status";

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

  const run = async (withOwner: boolean) => {
    let query = c.client
      .from("articles")
      .select(withOwner ? ARTICLE_COLUMNS_WITH_OWNER : ARTICLE_COLUMNS_BASE)
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
  const first = await run(withOwner);
  let data = first.data as ArticleRow[] | null;
  let error = first.error as { code?: string; message?: string } | null;

  if (error && withOwner && isMissingOwnerColumn(error)) {
    // Skema belum punya kolom user_id — mundur permanen ke author_slug.
    ownerColumnAvailable = false;
    const retry = await run(false);
    data = retry.data as ArticleRow[] | null;
    error = retry.error as { code?: string; message?: string } | null;
  } else if (!error && withOwner) {
    ownerColumnAvailable = true;
  }

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
  const read = async (useOwner: boolean) => {
    const { data, error } = await c.client
      .from("articles")
      .select(useOwner ? ARTICLE_COLUMNS_WITH_OWNER : ARTICLE_COLUMNS_BASE)
      .eq("id", Number(id))
      .limit(1)
      .maybeSingle();
    return { data, error };
  };

  const first = await read(withOwner);
  let article = first.data as ArticleRow | null;
  let error = first.error as { code?: string; message?: string } | null;

  if (error && withOwner && isMissingOwnerColumn(error)) {
    ownerColumnAvailable = false;
    const retry = await read(false);
    article = retry.data as ArticleRow | null;
    error = retry.error as { code?: string; message?: string } | null;
  } else if (!error && withOwner) {
    ownerColumnAvailable = true;
  }

  if (error) return { ok: false, status: 500, error: error.message ?? "Gagal memuat artikel" };
  if (!article) return { ok: false, status: 404, error: "Artikel tidak ditemukan" };
  if (!canEditArticle(article, session)) {
    return { ok: false, status: 403, error: ACCESS_DENIED_EDIT };
  }
  return { ok: true, article };
}