import fs from "fs";
import path from "path";

export type Article = {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  image?: string;
  content: string[];
  tags: string[];
};

export type Category = {
  slug: string;
  name: string;
  color: string;
};

const dataDir = path.join(process.cwd(), "lib", "data");

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
  return getArticles()
    .filter((a) => a.id !== article.id && a.category === article.category)
    .concat(getArticles().filter((a) => a.id !== article.id && a.category !== article.category))
    .slice(0, count);
}