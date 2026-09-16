import { NextResponse } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";

export async function GET() {
  let dbCategorySlugs: string[] = [];
  let dbError: string | null = null;
  let dbSource = "not-connected";

  if (isSupabaseReady()) {
    dbSource = "connected";
    const client = adminClient!;

    const { data: dbCats, error: err2 } = await client
      .from("categories")
      .select("slug")
      .order("slug", { ascending: true });
    if (err2) {
      dbError = `categories: ${err2.message}`;
    } else {
      dbCategorySlugs = (dbCats || []).map((c: any) => c.slug);
    }
  }

  return NextResponse.json({
    dbSource,
    dbCategorySlugs,
    dbError,
  });
}