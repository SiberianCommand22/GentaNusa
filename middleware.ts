import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { canAccessAdminArea, TOKEN_COOKIE } from "@/lib/roles";

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

// Gerbang peran terpusat (lib/roles.ts) — dipakai identik oleh login API.
function hasEditorialRole(role: unknown, email: unknown): boolean {
  return canAccessAdminArea(role, email);
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

  type EdgeUser = {
    email?: string | null;
    app_metadata?: Record<string, unknown> | null;
  };
  let user: EdgeUser | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = (data?.user as unknown as EdgeUser | null) ?? null;
  } catch {
    user = null;
  }

  // FALLBACK ANTI REDIRECT-LOOP: `/api/admin/login` menulis sesi ke cookie
  // `genta_token` (httpOnly), BUKAN ke cookie bawaan @supabase/ssr
  // (`sb-<ref>-auth-token`). Tanpa fallback ini, getUser() di atas SELALU
  // null setelah login dan setiap request /admin mental kembali ke halaman
  // login meskipun kredensial benar. Verifikasi token langsung ke Supabase.
  if (!user) {
    const token = req.cookies.get(TOKEN_COOKIE)?.value;
    if (token) {
      try {
        const direct = createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await direct.auth.getUser(token);
        if (!error && data?.user) user = data.user as unknown as EdgeUser;
      } catch {
        // token tidak valid — biarkan jatuh ke redirect login di bawah
      }
    }
  }

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
