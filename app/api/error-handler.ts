import { NextResponse } from "next/server";

/**
 * Bungkus error API jadi response 500 yang konsisten.
 * Detail error hanya muncul di development — never leak ke client di production.
 */
export function apiError(e: unknown, fallback = "Terjadi kesalahan internal") {
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", e);
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}