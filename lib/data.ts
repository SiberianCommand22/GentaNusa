import fs from "fs";
import path from "path";
import { supabaseAnon } from "./supabase";

export type Article = {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  authorSlug?: string;
  authorRole?: string;
  image?: string;
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
  color: string;
};

const dataDir = path.join(process.cwd(), "lib", "data");

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+07:00");
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function sortByDate(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8"));
}

type DbArticle = {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  author_slug?: string;
  author_role?: string;
  image?: string;
  content?: string[];
  tags?: string[];
};

function mapRow(a: DbArticle): Article {
  return {
    id: a.id,
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    date: a.date,
    author: a.author,
    authorSlug: a.author_slug ?? "redaksi-generic",
    authorRole: a.author_role ?? undefined,
    image: a.image ?? undefined,
    content: Array.isArray(a.content) ? a.content : JSON.parse(a.content || "[]"),
    tags: Array.isArray(a.tags) ? a.tags : JSON.parse(a.tags || "[]"),
  };
}

// Baca artikel: dari Supabase (live) — fallback ke JSON kalau DB nggak bisa
export async function getArticles(): Promise<Article[]> {
  if (supabaseAnon) {
    try {
      const { data, error } = await supabaseAnon
        .from("articles")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) return data.map(mapRow);
    } catch (e) {
      console.warn("Supabase read gagal, fallback JSON:", e);
    }
  }
  return sortByDate(readJson("articles.json"));
}

export async function getCategories(): Promise<Category[]> {
  if (supabaseAnon) {
    try {
      const { data, error } = await supabaseAnon
        .from("categories")
        .select("*");
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((c) => ({ slug: c.slug, name: c.name, color: c.color }));
      }
    } catch (e) {
      console.warn("Supabase read gagal, fallback JSON:", e);
    }
  }
  return readJson("categories.json");
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}

export async function getArticle(id: number): Promise<Article | undefined> {
  return (await getArticles()).find((a) => a.id === id);
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

const authors: Author[] = [
  {
    slug: "redaksi-generic",
    name: "Redaksi",
    role: "Redaktur GentaNusa",
    bio: "Tim redaksi GentaNusa menyajikan berita politik, ekonomi, dan nasional secara akurat, cepat, dan terpercaya.",
  },
];

export function getAuthor(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}

export function getAuthors(): Author[] {
  return authors;
}

export async function getArticlesByAuthor(slug: string): Promise<Article[]> {
  return sortByDate(
    (await getArticles()).filter((a) => (a.authorSlug ?? "redaksi-generic") === slug)
  );
}