import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/admin/check — apakah sudah login admin? (cookie valid? hanya admin)
export async function GET() {
  const store = await cookies();
  if (store.get("genta_admin")?.value !== "1") {
    return NextResponse.json({ authed: false }, { status: 401 });
  }
  try {
    const raw = store.get("genta_session")?.value;
    if (raw) {
      const s = JSON.parse(raw) as {
        email?: unknown;
        role?: unknown;
        display_name?: unknown;
      };
      return NextResponse.json({
        authed: true,
        email: typeof s.email === "string" ? s.email : null,
        role: typeof s.role === "string" ? s.role : null,
        display_name: typeof s.display_name === "string" ? s.display_name : null,
      });
    }
  } catch {
    // cookie sesi rusak — sesi flag masih valid, balas status dasar saja
  }
  return NextResponse.json({ authed: true });
}
