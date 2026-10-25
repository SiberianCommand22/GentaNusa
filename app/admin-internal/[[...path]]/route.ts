/**
 * DECOY (honeypot) — tidak ada panel `/admin-internal/` di aplikasi ini.
 * Panel redaksi sebenarnya berada di `/admin` dan dijaga Supabase Auth.
 * Path ini hanya muncul di `robots.txt` palsu sebagai umpan. Lihat lib/decoy.ts.
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

function unauthorized(request: Request, body?: string): Response {
  logDecoyHit("admin-internal", request, {
    body,
    note: body ? "credential attempt" : "internal panel probe",
  });
  return new Response(fakeWpLoginHtml("Internal Administration"), {
    status: 401,
    headers: {
      ...decoyHeaders("text/html; charset=utf-8"),
      "WWW-Authenticate": 'Basic realm="GentaNusa Internal", charset="UTF-8"',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const res = unauthorized(request);
  await tarpit();
  return res;
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBodySnippet(request);
  const res = unauthorized(request, body);
  await tarpit();
  return res;
}
