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
  lead?: string;
  created_at?: string;
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
  lead?: string;
  created_at?: string;
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
    lead: a.lead ?? a.excerpt ?? undefined,
    created_at: a.created_at ?? a.date ?? undefined,
    content: Array.isArray(a.content) ? a.content : JSON.parse(a.content || "[]"),
    tags: Array.isArray(a.tags) ? a.tags : JSON.parse(a.tags || "[]"),
  };
}

async function fetchArticlesDb(): Promise<Article[] | null> {
  if (!supabaseAnon) return null;
  try {
    // Exclude rows still awaiting editorial review. Legacy auto-pipeline rows
    // carry a `staging-` author_slug prefix, so without this filter a draft
    // would appear on the public site. Publishing is 100% manual via /admin.
    const { data, error } = await supabaseAnon
      .from("articles")
      .select("*")
      .not("author_slug", "like", "staging-%")
      .order("date", { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) return data.map(mapRow);
  } catch (e) {
    console.warn("Supabase read gagal:", e);
  }
  return null;
}

async function fetchCategoriesDb(): Promise<Category[] | null> {
  if (!supabaseAnon) return null;
  try {
    const { data, error } = await supabaseAnon
      .from("categories")
      .select("slug, name");
    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (e) {
    console.warn("Supabase categories gagal:", e);
  }
  return null;
}

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
  const cached = cache.get("categories");
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data as Category[];

  const fromDb = await fetchCategoriesDb();
  const result = fromDb ?? [];
  cache.set("categories", { data: result, timestamp: Date.now() });
  return result;
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
        .not("author_slug", "like", "staging-%")
        .order("date", { ascending: false });
      if (!error && data) return data.map(mapRow);
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase category query gagal:", e);
    }
  }
  return (await getArticles()).filter(
    (a) => a.category.toLowerCase() === key.toLowerCase()
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