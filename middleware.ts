import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Guard tepi ruang redaksi GentaNusa.
//
// - Meneruskan header asli Cloudflare tanpa menimpa/memblokir.
// - Melarang cache agresif pada rute dinamis redaksi (/admin/*, /api/*).
// - /admin/:path* (kecuali halaman login privat) WAJIB sesi Supabase Auth
//   terverifikasi via @supabase/ssr + peran redaksi
//   (app_metadata.role === 'admin' | 'editor' dan varian admin).
//   - Belum login  -> redirect ke /admin/login/gentanusa (form login privat;
//     /admin/login disegel, tidak ada /login publik).
//   - Login tapi bukan redaksi -> redirect ke beranda /.
// - API internal (/api/*) TIDAK diautentikasi di sini; setiap route handler
//   menegakkan sesinya sendiri via lib/auth.ts (getEditorialSession).
//   Middleware hanya memaksa Cache-Control: no-store untuk API.
//
// CATATAN KEAMANAN: SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY tidak
// pernah disentuh di berkas ini maupun di klien mana pun (tanpa prefiks
// NEXT_PUBLIC_). Kunci service hanya dipakai server-side (lib/supabase.ts,
// route handler API, skrip server).

const ADMIN_ROLES = new Set([
  "admin",
  "superadmin",
  "super_admin",
  "administrator",
]);
const EDITORIAL_ROLES = new Set([...ADMIN_ROLES, "editor"]);

function hasEditorialRole(role: unknown, email: unknown): boolean {
  const r = String(role ?? "").trim().toLowerCase();
  if (EDITORIAL_ROLES.has(r)) return true;
  // Jalur Administrator Utama: kecocokan email master terverifikasi.
  const master = String(
    process.env.MASTER_ADMIN_EMAIL || "siberiantwotwo@gmail.com"
  )
    .trim()
    .toLowerCase();
  const e = String(email ?? "").trim().toLowerCase();
  return e.length > 0 && e === master;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Teruskan header Cloudflare apa adanya.
  const outgoing = new Headers(req.headers);
  const cfIp = req.headers.get("cf-connecting-ip");
  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfIp) outgoing.set("cf-connecting-ip", cfIp);
  if (cfCountry) outgoing.set("cf-ipcountry", cfCountry);

  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
  const isLoginRoute =
    path === "/admin/login" ||
    path.startsWith("/admin/login/") ||
    path === "/login" ||
    path.startsWith("/login/");

  // Halaman login privat + API: tanpa verifikasi sesi di middleware.
  // (API menegakkan auth per-route; login harus reachable saat logged-out.)
  if (!isAdminRoute || isLoginRoute) {
    const res = NextResponse.next({ request: { headers: outgoing } });
    if (path.startsWith("/admin") || path.startsWith("/api/")) {
      res.headers.set("Cache-Control", "no-store");
    }
    return res;
  }

  // ---- /admin/:path* terproteksi: validasi sesi via @supabase/ssr ----
  const res = NextResponse.next({ request: { headers: outgoing } });
  res.headers.set("Cache-Control", "no-store");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Konfigurasi backend belum lengkap — jangan bocorkan dasbor.
    return NextResponse.redirect(new URL("/", req.url));
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      // Middleware tepi: read-only terhadap cookie sesi.
      setAll: () => {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/admin/login/gentanusa", req.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  const role = (user.app_metadata as Record<string, unknown> | null)?.role;
  if (!hasEditorialRole(role, user.email)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
