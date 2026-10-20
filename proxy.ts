import { NextResponse, type NextRequest } from "next/server";
import { sessionFromRestUser, verifyAuthToken } from "@/lib/supabase-rest";
import { canAccessAdminArea, TOKEN_COOKIE } from "@/lib/roles";

// Guard tepi ruang redaksi GentaNusa.
//
// CATATAN KONVENSI: sejak Next.js 16 konvensi `middleware` di-deprecate dan
// berganti nama menjadi `proxy` (fungsi ekspor `proxy`, tetap di root proyek;
// perilaku & `config.matcher` identik). Berkas ini adalah `proxy.ts`.
//
// RINGAN KUOTA EDGE (batas 1 MB paket Hobby): proxy ini SENGAJA tidak
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
//
// CATATAN REVERSE PROXY (Vercel/Cloudflare):
//   - www -> apex (308) dan http -> https ditangani Vercel SEBELUM middleware.
//   - `x-forwarded-proto` / `host` TIDAK PERNAH dibaca ulang untuk membuat
//     redirect tandingan di sini (mencegah infinite redirect loop di balik
//     CDN). Semua tujuan redirect di-clone dari `req.nextUrl`.

// Gerbang peran terpusat (lib/roles.ts) — dipakai identik oleh login API.

/** Satu-satunya halaman login redaksi (form privat). */
const LOGIN_PATH = "/admin/login/gentanusa";
/** Rute login yang TIDAK boleh lagi di-redirect ke dirinya sendiri. */
const LOGIN_PREFIXES = [LOGIN_PATH, "/admin/login", "/login"];

/**
 * Loop redirect dilarang — kebijakan host & protokol MILIK Vercel (edge,
 * sebelum middleware berjalan):
 *   - `www.gentanusa.id` -> `gentanusa.id` : 308 permanen di Vercel.
 *   - `http://` -> `https://`               : di-redirect Vercel + HSTS.
 * Middleware ini TIDAK PERNAH memeriksa/menulis ulang `host` maupun
 * `x-forwarded-proto`, sehingga mustahil menghasilkan redirect tandingan
 * yang berlawanan arah (penyebab klasik infinite 307/308 loop di balik
 * CDN/reverse proxy).
 *
 * Semua tujuan redirect di-clone dari `req.nextUrl` (protokol + host asli
 * dipertahankan apa adanya) dan bila permintaan SUDAH berada di halaman
 * login kita kembalikan `next()` — bukan redirect ke diri sendiri.
 */
function isLoginPath(pathname: string): boolean {
  return LOGIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function redirect(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function toLogin(req: NextRequest): NextResponse {
  if (isLoginPath(req.nextUrl.pathname)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", req.nextUrl.pathname);
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function proxy(req: NextRequest) {
  // Proxy TIDAK BOLEH melempar: crash di sini = 500 tanpa body untuk
  // halaman /admin (ditelan client menjadi "0 berita"). Fail-closed yang
  // terlihat: lempar kembali ke halaman login — TANPA loop, karena
  // `toLogin` tidak me-redirect halaman login ke dirinya sendiri.
  try {
    return await guard(req);
  } catch {
    return toLogin(req);
  }
}

async function guard(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Teruskan header Cloudflare apa adanya (asli -> keluaran), tanpa menimpa
  // nilai yang sudah ada.
  const outgoing = new Headers(req.headers);
  const cfIp = req.headers.get("cf-connecting-ip");
  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfIp && !outgoing.has("cf-connecting-ip")) outgoing.set("cf-connecting-ip", cfIp);
  if (cfCountry && !outgoing.has("cf-ipcountry")) outgoing.set("cf-ipcountry", cfCountry);

  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
  const isLoginRoute = isLoginPath(path);

  // HEMAT KUOTA: middleware hanya untuk area redaksi. Rute login privat
  // dikecualikan agar selalu reachable saat logged-out; API dan halaman
  // publik tidak memicu invocation sama sekali (lihat config.matcher).
  if (!isAdminRoute || isLoginRoute) {
    const pass = NextResponse.next({ request: { headers: outgoing } });
    // Halaman login jangan pernah di-cache peramban (back-button Safari):
    // selalu merender state "belum login" yang bersih.
    if (isLoginRoute) pass.headers.set("Cache-Control", "no-store");
    return pass;
  }

  // ---- /admin/:path* terproteksi: validasi sesi via fetch murni ----
  // SATU panggilan verifikasi token (hemat latensi Edge): tanpa token /
  // token tak valid → halaman login (bawa `next`); token valid tapi bukan
  // peran redaksi → beranda `/`. TIDAK PERNAH melempar (fail-closed).
  const res = NextResponse.next({ request: { headers: outgoing } });
  res.headers.set("Cache-Control", "no-store");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Konfigurasi backend belum lengkap — jangan bocorkan dasbor.
    return redirect(req, "/");
  }

  const token = req.cookies.get(TOKEN_COOKIE)?.value ?? null;
  if (!token) {
    return toLogin(req);
  }

  const user = await verifyAuthToken(token);
  if (!user) {
    return toLogin(req);
  }

  const session = sessionFromRestUser(user);
  // Kecocokan email master hanya untuk identitas TERVERIFIKASI — selaras
  // dengan lib/auth.ts (isAdminIdentity).
  if (!canAccessAdminArea(session.appRole, session.emailVerified ? session.email : null)) {
    return redirect(req, "/");
  }

  return res;
}

export const config = {
  // HEMAT KUOTA HOBBY: hanya /admin/* yang memicu Edge Middleware Invocation.
  // Pembaca publik + panggilan /api/* (termasuk analytics tracker) bebas
  // invocation; proteksi API tetap per-route via lib/auth.ts.
  //
  // Matcher sempit ini SUDAH mengecualikan seluruh rute statis/internal yang
  // diminta hardening — `_next/static`, `_next/image`, `favicon.ico`, `api/*`,
  // dan aset `*.svg|png|jpg|jpeg|gif|webp` tidak mungkin berada di bawah
  // `/admin/*`. Sebaliknya, matcher eksklusif umum
  // (`/((?!_next/static|...).*)`) tetap memicu middleware pada SETIAP halaman
  // publik — pemborosan invocation tanpa fungsi tambahan (guard langsung
  // `next()` untuk non-admin).
  matcher: ["/admin", "/admin/:path*"],
};
