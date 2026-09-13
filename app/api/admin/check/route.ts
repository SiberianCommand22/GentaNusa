import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/admin/check — apakah sudah login admin? (cookie valid?)
export async function GET() {
  const store = await cookies();
  if (store.get("genta_admin")?.value === "1") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Belum login" }, { status: 401 });
}