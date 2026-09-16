import { NextResponse } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getCategories } from "@/lib/data";

export async function GET() {
  const localCategories = await getCategories();
  const localSlugs = localCategories.map((c) => c.slug);

  if (!isSupabaseReady) {
    return NextResponse.json({
      source: "local-only",
      message: "Supabase tidak terkoneksi",
      localSlugs,
    });
  }

  const { data: dbCategories, error } = await adminClient
    .from("categories")
    .select("id, slug")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({
      source: "supabase-error",
      error: error.message,
      localSlugs,
    });
  }

  const dbSlugs = (dbCategories || []).map((c: any) => c.slug);

  return NextResponse.json({
    source: "both",
    localCount: localSlugs.length,
    dbCount: dbSlugs.length,
    localSlugs,
    dbSlugs,
    inLocalNotDb: localSlugs.filter((s) => !dbSlugs.includes(s)),
    inDbNotLocal: dbSlugs.filter((s) => !localSlugs.includes(s)),
  });
}