import { NextRequest, NextResponse } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getArticles, getCategories } from "@/lib/data";

// Debug: cek koneksi DB dan data
export async function GET() {
  const localArticles = await getArticles();
  const localCategories = await getCategories();

  const result: Record<string, unknown> = {
    localArticles: localArticles.length,
    localCategories: localCategories.length,
    localArticleIds: localArticles.map((a) => a.id).sort((a, b) => a - b),
    localCategorySlugs: localCategories.map((c) => c.slug),
  };

  if (isSupabaseReady()) {
    const client = adminClient!;
    const { data: dbArticles, error: err1 } = await client
      .from("articles")
      .select("id")
      .order("id", { ascending: true });

    if (err1) {
      result.dbArticles = { error: err1.message };
    } else {
      result.dbArticles = {
        count: (dbArticles || []).length,
        ids: (dbArticles || []).map((a) => a.id).sort((a: number, b: number) => a - b),
      };
    }

    // Tidak ada tabel `public.categories` di Supabase — kategori statis.
    result.dbCategories = { source: "static", count: localCategories.length };
  } else {
    result.db = "Supabase tidak terkoneksi (dev mode atau env vars hilang)";
  }

  return NextResponse.json(result, { status: 200 });
}