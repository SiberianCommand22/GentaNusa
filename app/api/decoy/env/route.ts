/**
 * DECOY (honeytoken) — target rewrite dari `/.env` dan `/.env.local`
 * (lihat next.config.ts). Seluruh kredensial di dalamnya fiktif; AWS
 * memakai contoh resmi dokumentasi (AKIA...EXAMPLE) sehingga tidak ada
 * rahasia nyata yang bocor bila berkas ini dibaca. Lihat lib/decoy.ts.
 */
import { decoyHeaders, fakeEnvFile, logDecoyHit, tarpit } from "@/lib/decoy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  logDecoyHit("dotenv", request, { note: "env disclosure probe" });
  await tarpit();
  return new Response(fakeEnvFile(), {
    status: 200,
    headers: decoyHeaders("text/plain; charset=utf-8"),
  });
}
