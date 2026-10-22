/**
 * DECOY (honeypot) — endpoint "debug" palsu. Penyerang yang mencari kebocoran
 * konfigurasi akan memanggil ini; balasan JSON menggoda berisi metadata fiktif
 * (tanpa satu pun nilai rahasia nyata). Lihat lib/decoy.ts.
 */
import { decoyHeaders, logDecoyHit, tarpit } from "@/lib/decoy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  logDecoyHit("api-debug", request, { note: "api debug probe" });
  await tarpit();
  const payload = {
    status: "ok",
    app: "gentanusa-cms",
    build: "6f2c1a9",
    php_version: "8.1.12",
    mysql: "8.0.34",
    debug: false,
    environment: "production",
    uptime: "62 days, 4:11:03",
    server: "web-03.internal",
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: decoyHeaders("application/json; charset=utf-8"),
  });
}
