import { supabaseAnon } from "./supabase";

export type Article = {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  authorSlug?: string;
  authorRole?: string;
  image?: string;
  cover_image?: string;
  image_caption?: string;
  image_credit?: string;
  secondary_image?: string;
  secondary_image_caption?: string;
  secondary_image_credit?: string;
  optional_image?: string;
  optional_image_caption?: string;
  optional_image_credit?: string;
  lead?: string;
  created_at?: string;
  status?: string;
  content: string[];
  tags: string[];
};

export type Author = {
  slug: string;
  name: string;
  role: string;
  bio: string;
};

export type Category = {
  slug: string;
  name: string;
};

// Cache per-process: fetch sekali, reuse semua request. TTL 30 detik.
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000;

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function sortByDate(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Waktu relatif ala portal berita ("1 jam yang lalu"). Memakai created_at
// bila tersedia (presisi jam), mundur ke kolom date (presisi hari).
export function formatRelative(dateStr: string, createdAt?: string): string {
  const t = createdAt ? new Date(createdAt) : new Date(dateStr + "T00:00:00Z");
  if (isNaN(t.getTime())) return formatDate(dateStr);
  const diffMs = Date.now() - t.getTime();
  if (diffMs < 0) return formatDate(dateStr);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari yang lalu`;
  return formatDate(dateStr);
}

// Slug SEO turunan dari judul. Tabel Supabase belum punya kolom `slug`
// (API mengabaikannya saat insert), jadi slug dihitung deterministik di
// sini agar URL /<slug> stabil tanpa migrasi DB.
export function slugifyTitle(title: string): string {
  const slug = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug || "artikel";
}

export function articleSlug(a: { slug?: string; title: string }): string {
  const s = String(a.slug || "").trim();
  if (s) return s;
  return slugifyTitle(a.title);
}

export function articleUrl(a: { slug?: string; id: number; title: string }): string {
  const slug = articleSlug(a) || a.id.toString();
  return `/${slug}`;
}

type DbArticle = {
  id: number;
  slug?: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  author_slug?: string;
  author_role?: string;
  image?: string;
  cover_image?: string;
  image_caption?: string;
  image_credit?: string;
  secondary_image?: string;
  secondary_image_caption?: string;
  secondary_image_credit?: string;
  optional_image?: string;
  optional_image_caption?: string;
  optional_image_credit?: string;
  lead?: string;
  created_at?: string;
  status?: string;
  content?: string[];
  tags?: string[];
};

function mapRow(a: DbArticle): Article {
  return {
    id: a.id,
    slug: String(a.slug || "").trim() || slugifyTitle(a.title),
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    date: a.date,
    author: a.author,
    authorSlug: a.author_slug ?? "redaksi-generic",
    authorRole: a.author_role ?? undefined,
    image: a.image ?? undefined,
    cover_image: a.cover_image ?? a.image ?? undefined,
    image_caption: a.image_caption ?? undefined,
    image_credit: a.image_credit ?? undefined,
    // Dual-mode: `optional_image*` = nama kanonis spesifikasi CMS,
    // `secondary_image*` = alias kompatibel-mundur. Keduanya dibaca
    // silang agar Tipe 1/2 terdeteksi apa pun kolom yang ada di DB.
    secondary_image: a.secondary_image ?? a.optional_image ?? undefined,
    secondary_image_caption:
      a.secondary_image_caption ?? a.optional_image_caption ?? undefined,
    secondary_image_credit:
      a.secondary_image_credit ?? a.optional_image_credit ?? undefined,
    optional_image: a.optional_image ?? a.secondary_image ?? undefined,
    optional_image_caption:
      a.optional_image_caption ?? a.secondary_image_caption ?? undefined,
    optional_image_credit:
      a.optional_image_credit ?? a.secondary_image_credit ?? undefined,
    lead: a.lead ?? a.excerpt ?? undefined,
    created_at: a.created_at ?? a.date ?? undefined,
    status: a.status ?? "published",
    content: Array.isArray(a.content) ? a.content : JSON.parse(a.content || "[]"),
    tags: Array.isArray(a.tags) ? a.tags : JSON.parse(a.tags || "[]"),
  };
}

async function fetchArticlesDb(): Promise<Article[] | null> {
  if (!supabaseAnon) return null;
  try {
    // Feed publik: HANYA artikel berstatus published. Baris draft dan
    // baris staging lawas (prefix author_slug staging-) tidak pernah bocor.
    const { data, error } = await supabaseAnon
      .from("articles")
      .select("*")
      .eq("status", "published")
      .not("author_slug", "like", "staging-%")
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapRow);
  } catch (e) {
    console.warn("Supabase read gagal:", e);
  }
  return null;
}

// Semua baris tanpa filter status — HANYA untuk kebutuhan redaksi
// (pratinjau draf admin, pencocokan slug sitemap internal). Jangan dipakai
// untuk render publik.
async function fetchAllArticlesDb(): Promise<Article[] | null> {
  if (!supabaseAnon) return null;
  try {
    const { data, error } = await supabaseAnon
      .from("articles")
      .select("*")
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapRow);
  } catch (e) {
    console.warn("Supabase read (semua) gagal:", e);
  }
  return null;
}

// Kategori resmi GentaNusa — didefinisikan di kode (bukan tabel DB).
// Tabel `public.categories` tidak ada di Supabase, jadi TIDAK ada query
// ke tabel itu di mana pun agar tidak menimbulkan log PGRST205.
const STATIC_CATEGORIES: Category[] = [
  { slug: "nasional", name: "Nasional" },
  { slug: "pertahanan", name: "Pertahanan" },
  { slug: "politik", name: "Politik" },
  { slug: "ekonomi", name: "Ekonomi" },
  { slug: "dunia", name: "Dunia" },
  { slug: "sosial-budaya", name: "Sosial Budaya" },
  { slug: "kesehatan", name: "Kesehatan" },
  { slug: "olahraga", name: "Olahraga" },
  { slug: "keamanan", name: "Keamanan" },
];

// Baca artikel: dari Supabase (cached). Tanpa fallback array — bila database
// kosong / tidak terjangkau, kembalikan [] agar halaman tampil empty state.
export async function getArticles(): Promise<Article[]> {
  const cached = cache.get("articles");
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data as Article[];

  const fromDb = await fetchArticlesDb();
  const result = fromDb ?? [];
  cache.set("articles", { data: result, timestamp: Date.now() });
  return result;
}

export async function getCategories(): Promise<Category[]> {
  return [...STATIC_CATEGORIES];
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}

// Query per kategori di sisi database (ilike, case-insensitive) alih-alih
// memfilter hasil getArticles() di memori. Bila Supabase tidak terjangkau,
// jatuh kembali ke filter lokal supaya halaman tetap merender empty state.
export async function getArticlesByCategory(slug: string): Promise<Article[]> {
  const key = String(slug || "").trim();
  if (!key) return [];
  if (supabaseAnon) {
    try {
      const { data, error } = await supabaseAnon
        .from("articles")
        .select("*")
        .ilike("category", key)
        .eq("status", "published")
        .not("author_slug", "like", "staging-%")
        .order("date", { ascending: false })
        .order("id", { ascending: false });
      if (!error && data) return data.map(mapRow);
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase category query gagal:", e);
    }
  }
  return (await getArticles()).filter(
    (a) => a.category.toLowerCase() === key.toLowerCase() && a.status === "published"
  );
}

export async function getArticle(id: number): Promise<Article | undefined> {
  return (await getArticles()).find((a) => a.id === id);
}

// Cari artikel berdasarkan slug SEO, dengan fallback ID numerik untuk
// tautan lama /<id>. Pencocokan slug juga mentolerir akhiran
// "-<id>" bila kelak slug dibuat unik per baris.
export async function getArticleBySlugOrId(slugOrId: string): Promise<Article | undefined> {
  const key = String(slugOrId || "").trim();
  if (!key) return undefined;
  const all = await getArticles();
  const direct = all.find((a) => a.slug === key);
  if (direct) return direct;
  if (!isNaN(Number(key))) {
    const byId = all.find((a) => a.id === Number(key));
    if (byId) return byId;
  }
  const suffixed = all.find((a) => key === `${a.slug}-${a.id}`);
  return suffixed;
}

// Varian redaksi: cocokkan slug/ID di SELURUH baris termasuk draft.
// Dipakai halaman detail untuk pratinjau admin; publik tetap di-gate
// (draft → notFound bagi non-admin).
export async function getArticleAnyBySlugOrId(slugOrId: string): Promise<Article | undefined> {
  const key = String(slugOrId || "").trim();
  if (!key) return undefined;
  const cached = cache.get("articles-all");
  let all: Article[];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    all = cached.data as Article[];
  } else {
    const fromDb = await fetchAllArticlesDb();
    all = fromDb ?? [];
    cache.set("articles-all", { data: all, timestamp: Date.now() });
  }
  const direct = all.find((a) => a.slug === key);
  if (direct) return direct;
  if (!isNaN(Number(key))) {
    const byId = all.find((a) => a.id === Number(key));
    if (byId) return byId;
  }
  return all.find((a) => key === `${a.slug}-${a.id}`);
}

export async function getRelated(article: Article, count = 3): Promise<Article[]> {
  const all = await getArticles();
  const byCategory = all.filter(
    (a) => a.id !== article.id && a.category === article.category
  );
  if (byCategory.length >= count) return sortByDate(byCategory).slice(0, count);
  const rest = all.filter(
    (a) => a.id !== article.id && a.category !== article.category
  );
  return sortByDate([...byCategory, ...rest]).slice(0, count);
}

// Authors are derived from the article rows, not a hardcoded list. The DB already
// stores the real bylines (Andreas Wicaksono, Hypatia Dorothy, Adripa Dwitama,
// Redaksi GentaNusa); keeping a separate static list here is what left
// /penulis/<byline-slug> returning 404 for every real author.
type AuthorRow = { name: string; slug: string };

async function fetchAuthorRows(): Promise<AuthorRow[]> {
  if (!supabaseAnon) return [];
  try {
    const { data, error } = await supabaseAnon
      .from("articles")
      .select("author,author_slug")
      .eq("status", "published")
      .not("author_slug", "like", "staging-%")
      .not("author", "is", null);
    if (error) throw error;
    const seen = new Map<string, AuthorRow>();
    for (const row of data ?? []) {
      const slug = String(row.author_slug ?? "").trim();
      const name = String(row.author ?? "").trim();
      if (slug && name && !seen.has(slug)) seen.set(slug, { name, slug });
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
  } catch (e) {
    console.warn("Supabase authors gagal:", e);
    return [];
  }
}

function bioFor(name: string): string {
  return `${name} menulis untuk GentaNusa — portal berita politik, ekonomi, dan nasional Indonesia.`;
}

export async function getAuthors(): Promise<Author[]> {
  const cached = cache.get("authors");
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data as Author[];

  const rows = await fetchAuthorRows();
  const list: Author[] = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    role: "Jurnalis GentaNusa",
    bio: bioFor(r.name),
  }));
  cache.set("authors", { data: list, timestamp: Date.now() });
  return list;
}

export async function getAuthor(slug: string): Promise<Author | undefined> {
  return (await getAuthors()).find((a) => a.slug === slug);
}

export async function getArticlesByAuthor(slug: string): Promise<Article[]> {
  return sortByDate(
    (await getArticles()).filter((a) => (a.authorSlug ?? "redaksi-generic") === slug)
  );
}