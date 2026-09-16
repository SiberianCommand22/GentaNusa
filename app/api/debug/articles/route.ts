import { NextResponse } from "next/server";
import { adminClient, isSupabaseReady } from "@/lib/supabase";
import { getArticles } from "@/lib/data";

export async function GET() {
  const localArticles = await getArticles();
  const localIds = localArticles.map((a) => a.id).sort((a, b) => a - b);

  if (!isSupabaseReady) {
    return NextResponse.json({
      source: "local-only",
      message: "Supabase tidak terkoneksi — hanya data JSON lokal",
      localArticles: localIds,
    });
  }

  const { data: dbArticles, error: dbError } = await adminClient
    .from("articles")
    .select("id")
    .order("id", { ascending: true });

  if (dbError) {
    return NextResponse.json({
      source: "supabase-error",
      error: dbError.message,
      localArticles: localIds,
    });
  }

  const dbIds = (dbArticles || []).map((a: any) => a.id).sort((a: number, b: number) => a - b);

  const mismatch = {
    inLocalNotDb: localIds.filter((id) => !dbIds.includes(id)),
    inDbNotLocal: dbIds.filter((id) => !localIds.includes(id)),
  };

  const a121 = localArticles.find((a) => a.id === 121);

  return NextResponse.json({
    source: "both",
    localCount: localIds.length,
    dbCount: dbIds.length,
    localIds,
    dbIds,
    mismatch,
    article121: a121 || null,
  });
}