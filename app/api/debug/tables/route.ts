import { NextResponse } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";

export async function GET() {
  let count = 0;
  let dbError: string | null = null;
  let dbSource = "not-connected";

  if (isSupabaseReady()) {
    dbSource = "connected";
    const client = adminClient!;
    const { data: dbCats, error: err } = await client
      .from("categories")
      .select("*", { count: "exact", head: true });
    if (err) {
      dbError = `categories: ${err.message}`;
    } else {
      count = (dbCats as any[])?.length ?? 0;
    }
  }

  return NextResponse.json({ table: "categories", source: dbSource, rowCount: count, error: dbError });
}