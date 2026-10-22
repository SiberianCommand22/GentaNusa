/**
 * DECOY (honeytoken) — form login palsu untuk menangkap percobaan kredensial.
 * Body POST (`log=...&pwd=...`) dicatat sebagai bukti niat jahat; tidak pernah
 * divalidasi, tidak pernah menyentuh Supabase. Lihat lib/decoy.ts.
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
  logDecoyHit("wp-login", request, { note: "wordpress login probe" });
  await tarpit();
  return new Response(fakeWpLoginHtml(), {
    status: 200,
    headers: decoyHeaders("text/html; charset=utf-8"),
  });
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBodySnippet(request);
  logDecoyHit("wp-login", request, { body, note: "credential attempt" });
  await tarpit();
  // Selalu "gagal" dengan 200 — penyerang tidak mendapat sinyal valid/tidaknya
  // kredensial, sementara kita menyimpan percobaannya.
  return new Response(fakeWpLoginHtml("Log In"), {
    status: 200,
    headers: decoyHeaders("text/html; charset=utf-8"),
  });
}
