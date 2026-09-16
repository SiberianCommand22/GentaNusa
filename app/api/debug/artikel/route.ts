import { NextResponse } from "next/server";
import { getArticles } from "@/lib/data";

// Debug: cek apakah 121 ada di data
export async function GET() {
  const articles = await getArticles();
  const found = articles.find((a) => a.id === 121);
  const byTitle = articles.filter((a) =>
    a.title.includes("Emas") || a.title.includes("Antam")
  );
  return NextResponse.json({
    totalArticles: articles.length,
    article121: found || null,
    emasArticles: byTitle,
    allIds: articles.map((a) => `${a.id}:${a.title.slice(0, 30)}`),
  });
}