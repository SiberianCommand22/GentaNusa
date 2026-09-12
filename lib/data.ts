import fs from "fs";
import path from "path";

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

export function getArticles(): Article[] {
  const raw = fs.readFileSync(path.join(dataDir, "articles.json"), "utf-8");
  return JSON.parse(raw) as Article[];
}

export function getCategories(): Category[] {
  const raw = fs.readFileSync(path.join(dataDir, "categories.json"), "utf-8");
  return JSON.parse(raw) as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getCategories().find((c) => c.slug === slug);
}

export function getArticle(id: number): Article | undefined {
  return getArticles().find((a) => a.id === id);
}

export function getRelated(article: Article, count = 3): Article[] {
  const byCategory = getArticles().filter(
    (a) => a.id !== article.id && a.category === article.category
  );
  if (byCategory.length >= count) return sortByDate(byCategory).slice(0, count);
  const rest = getArticles().filter(
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

export function getArticlesByAuthor(slug: string): Article[] {
  return sortByDate(
    getArticles().filter((a) => (a.authorSlug ?? "redaksi-generic") === slug)
  );
}