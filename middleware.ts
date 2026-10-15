import { NextResponse, type NextRequest } from "next/server";
import { sessionFromRestUser, verifyAuthToken } from "@/lib/supabase-rest";
import { canAccessAdminArea, TOKEN_COOKIE } from "@/lib/roles";

// Guard tepi ruang redaksi GentaNusa.
//
// RINGAN KUOTA EDGE (batas 1 MB paket Hobby): middleware ini SENGAJA tidak
// mengimpor `@supabase/ssr` / `@supabase/supabase-js` (menyeret realtime +
// phoenix + gotrue + storage, ±215 KB). Verifikasi sesi memakai `fetch`
// murni ke Supabase Auth (`lib/supabase-rest.ts`, nol dependensi).
//
// - Meneruskan header asli Cloudflare tanpa menimpa/memblokir.
// - Melarang cache agresif pada rute dinamis redaksi (/admin/*).
// - /admin/:path* (kecuali halaman login privat) WAJIB sesi Supabase Auth
//   terverifikasi via fetch murni + peran redaksi
//   (app_metadata.role dalam EDITORIAL_ROLES lib/roles.ts: admin + seluruh
//   varian redaksi editor/author/writer/penulis/jurnalis/dll, case-insensitive).
//   - Belum login  -> redirect ke /admin/login/gentanusa (form login privat;
//     /admin/login disegel, tidak ada /login publik).
//   - Login tapi bukan redaksi -> redirect ke beranda /.
//   - Akun yang perannya hanya ada di user_metadata (tidak di app_metadata)
//     DITOLAK di sini: peran redaksi wajib ditanam backend via Service Role
//     (scripts/assign-admin-role.ts / backfill-editor-roles.ts).
// - API internal (/api/*) TIDAK diautentikasi di sini dan TIDAK melewati
//   middleware sama sekali (matcher di bawah hanya /admin/* — hemat kuota
//   Edge Middleware Invocations dari pembaca publik). Setiap route handler
//   menegakkan sesinya sendiri via fetch murni, dan
//   Cache-Control: no-store untuk API dipasang via headers() di next.config
//   (tanpa biaya invocation).
//
// CATATAN KEAMANAN: SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY tidak
// pernah disentuh di berkas ini maupun di klien mana pun (tanpa prefiks
// NEXT_PUBLIC_). Kunci service hanya dipakai server-side (lib/supabase.ts,
// route handler API, skrip server).

// Gerbang peran terpusat (lib/roles.ts) — dipakai identik oleh login API.

export async function middleware(req: NextRequest) {
  // Middleware TIDAK BOLEH melempar: crash di sini = 500 tanpa body untuk
  // halaman /admin (ditelan client menjadi "0 berita"). Fail-closed yang
  // terlihat: lempar kembali ke halaman login.
  try {
    return await guard(req);
  } catch {
    const loginUrl = new URL("/admin/login/gentanusa", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

async function guard(req: NextRequest) {
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

  // HEMAT KUOTA: middleware hanya untuk area redaksi. Rute login privat
  // dikecualikan agar selalu reachable saat logged-out; API dan halaman
  // publik tidak memicu invocation sama sekali.
  if (!isAdminRoute || isLoginRoute) {
    return NextResponse.next({ request: { headers: outgoing } });
  }

  // ---- /admin/:path* terproteksi: validasi sesi via fetch murni ----
  // SATU panggilan verifikasi token (hemat latensi Edge): tanpa token /
  // token tak valid → halaman login (bawa `next`); token valid tapi bukan
  // peran redaksi → beranda `/`. TIDAK PERNAH melempar (fail-closed).
  const res = NextResponse.next({ request: { headers: outgoing } });
  res.headers.set("Cache-Control", "no-store");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Konfigurasi backend belum lengkap — jangan bocorkan dasbor.
    return NextResponse.redirect(new URL("/", req.url));
  }

  const token = req.cookies.get(TOKEN_COOKIE)?.value ?? null;
  if (!token) {
    const loginUrl = new URL("/admin/login/gentanusa", req.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifyAuthToken(token);
  if (!user) {
    const loginUrl = new URL("/admin/login/gentanusa", req.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  const session = sessionFromRestUser(user);
  // Kecocokan email master hanya untuk identitas TERVERIFIKASI — selaras
  // dengan lib/auth.ts (isAdminIdentity).
  if (!canAccessAdminArea(session.appRole, session.emailVerified ? session.email : null)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  // HEMAT KUOTA HOBBY: hanya /admin/* yang memicu Edge Middleware Invocation.
  // Pembaca publik + panggilan /api/* (termasuk analytics tracker) bebas
  // invocation; proteksi API tetap per-route via lib/auth.ts.
  matcher: ["/admin/:path*"],
};
