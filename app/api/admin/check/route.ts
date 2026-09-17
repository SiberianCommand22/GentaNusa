import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/admin/check — apakah sudah login admin? (cookie valid? hanya admin)
export async function GET() {
  const store = await cookies();
  const cookie = store.get("admin_session");

  if (cookie?.value === "1") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Belum login" }, { status: 401 });
}