/**
 * DECOY (honeypot) — aplikasi ini bukan WordPress.
 * Pemindai WPScan/Nuclei yang memanggil `/wp-admin` sedang menebak stack.
 * Lihat lib/decoy.ts.
 */
import {
  decoyHeaders,
  fakeWpLoginHtml,
  logDecoyHit,
  readBodySnippet,
  tarpit,
} from "@/lib/decoy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  logDecoyHit("wp-admin", request, { note: "wordpress admin probe" });
  await tarpit();
  return new Response(fakeWpLoginHtml("Dashboard"), {
    status: 200,
    headers: decoyHeaders("text/html; charset=utf-8"),
  });
}

/** Beberapa scanner POST langsung ke /wp-admin (bukan /wp-login.php). */
export async function POST(request: Request): Promise<Response> {
  const body = await readBodySnippet(request);
  logDecoyHit("wp-admin", request, { body, note: "credential attempt" });
  await tarpit();
  return new Response(fakeWpLoginHtml("Dashboard"), {
    status: 200,
    headers: decoyHeaders("text/html; charset=utf-8"),
  });
}
