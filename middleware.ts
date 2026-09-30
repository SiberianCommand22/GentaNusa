import { NextResponse, type NextRequest } from "next/server";

// Middleware tepi: meneruskan header asli Cloudflare tanpa menimpa/memblokir,
// serta melarang cache agresif pada rute dinamis redaksi (/admin/*, /api/*).
// Matcher dibatasi agar halaman publik statis tidak tersentuh.
export function middleware(req: NextRequest) {
  const outgoing = new Headers(req.headers);
  // Pertahankan header bawaan Cloudflare apa adanya.
  const cfIp = req.headers.get("cf-connecting-ip");
  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfIp) outgoing.set("cf-connecting-ip", cfIp);
  if (cfCountry) outgoing.set("cf-ipcountry", cfCountry);

  const res = NextResponse.next({
    request: { headers: outgoing },
  });

  const path = req.nextUrl.pathname;
  if (path.startsWith("/admin") || path.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store");
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
