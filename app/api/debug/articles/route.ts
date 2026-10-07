import { NextResponse } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getEditorialSession } from "@/lib/auth";
import { getArticles, getCategories } from "@/lib/data";

export async function GET() {
  // Diagnostik internal — administrator saja.
  const session = await getEditorialSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak. Wajib login." }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Hanya Administrator." }, { status: 403 });
  }
  const localArticles = await getArticles();
  const localCategories = await getCategories();
  const localArticleIds = localArticles.map((a) => a.id).sort((a, b) => a - b);
  const localCategorySlugs = localCategories.map((c) => c.slug);

  let dbArticleIds: number[] = [];
  const dbCategorySlugs: string[] = [];
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
      dbArticleIds = (dbArticles || []).map((a) => a.id).sort((a: number, b: number) => a - b);
    }
    // Tidak ada tabel `public.categories` — kategori statis di kode.
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