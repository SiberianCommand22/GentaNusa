import { NextResponse } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getCategories } from "@/lib/data";

export async function GET() {
  const localCategories = await getCategories();
  const localSlugs = localCategories.map((c) => c.slug);

  const result: Record<string, unknown> = {
    localCount: localSlugs.length,
    localSlugs,
  };

  if (isSupabaseReady()) {
    const client = adminClient!;
    const { data: dbCats, error: err } = await client
      .from("categories")
      .select("id, slug, name, color")
      .order("id", { ascending: true });

    if (err) {
      result.db = { error: err.message };
    } else {
      const dbSlugs = (dbCats || []).map((c) => c.slug);
      result.db = {
        count: (dbCats || []).length,
        dbSlugs,
        rows: dbCats,
        inLocalNotDb: localSlugs.filter((s) => !dbSlugs.includes(s)),
        inDbNotLocal: dbSlugs.filter((s) => !localSlugs.includes(s)),
      };
    }
  }

  return NextResponse.json(result, { status: 200 });
}