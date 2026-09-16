import { NextResponse } from "next/server";
import { getArticles, getCategories } from "@/lib/data";

// Debug: cek data lokal
export async function GET() {
  const articles = await getArticles();
  const categories = await getCategories();
  return NextResponse.json({
    articlesInJson: articles.length,
    categoriesInJson: categories.length,
    articles,
    categories,
  });
}