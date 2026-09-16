import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await adminClient
      .from("categories")
      .select("count", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({
        table: "categories",
        error: error.message,
        code: error.code,
        hint: error.hint || undefined,
        details: error.details || undefined,
      }, { status: 500 });
    }

    return NextResponse.json({
      table: "categories",
      rowCount: data?.count ?? 0,
      message: data?.count === 0
        ? "Tabel categories KOSONG — perlu seed data"
        : `Tabel categories ada ${data.count} baris`,
    });
  } catch (err: any) {
    return NextResponse.json({
      table: "categories",
      error: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}