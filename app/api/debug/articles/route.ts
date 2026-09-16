import { NextResponse } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getArticles, getCategories } from "@/lib/data";

export async function GET() {
  const localArticles = await getArticles();
  const localCategories = await getCategories();
  const localArticleIds = localArticles.map((a) => a.id).sort((a, b) => a - b);
  const localCategorySlugs = localCategories.map((c) => c.slug);

  let dbArticleIds: number[] = [];
  let dbCategorySlugs: string[] = [];
  let dbError: string | null = null;
  let dbSource = "not-connected";

  if (isSupabaseReady()) {
    dbSource = "connected";
    const client = adminClient!;

    const { data: dbArticles, error: err1 } = await client
      .from("articles")
      .select("id")
      .order("id", { ascending: true });
    if (err1) {
      dbError = `articles: ${err1.message}`;
    } else {
      dbArticleIds = (dbArticles || []).map((a: any) => a.id).sort((a: number, b: number) => a - b);
    }

    const { data: dbCats, error: err2 } = await client
      .from("categories")
      .select("id, slug, name, color")
      .order("id", { ascending: true });
    if (err2) {
      dbError = dbError ? `${dbError}; categories: ${err2.message}` : `categories: ${err2.message}`;
    } else {
      dbCategorySlugs = (dbCats || []).map((c: any) => c.slug);
    }
  }

  const a121 = localArticles.find((a) => a.id === 121);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    localArticleIds,
    dbArticleIds,
    articleMismatch: {
      inLocalNotDb: localArticleIds.filter((id) => !dbArticleIds.includes(id)),
      inDbNotLocal: dbArticleIds.filter((id) => !localArticleIds.includes(id)),
    },
    localCategorySlugs,
    dbCategorySlugs,
    categoryMismatch: {
      inLocalNotDb: localCategorySlugs.filter((s) => !dbCategorySlugs.includes(s)),
      inDbNotLocal: dbCategorySlugs.filter((s) => !localCategorySlugs.includes(s)),
    },
    article121: a121 || null,
    dbSource,
    dbError,
  });
}