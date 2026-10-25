/**
 * DECOY (honeytoken) — tidak ada direktori dump yang dapat diakses publik.
 * Daftar berkas di bawah 100% fiktif; setiap hit menandakan probing.
 * Lihat lib/decoy.ts.
 */
import {
  decoyHeaders,
  fakeDirListing,
  logDecoyHit,
  readBodySnippet,
  tarpit,
} from "@/lib/decoy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FAKE_DUMPS = [
  "gentanusa_wp_2026-10-20.sql.gz",
  "gentanusa_wp_2026-10-13.sql.gz",
  "gentanusa_wp_2026-10-06.sql.gz",
  "users_export_2026-09.csv",
  "backup_full.tar.gz",
];

export async function GET(request: Request): Promise<Response> {
  logDecoyHit("db-dump", request, { note: "db dump directory probe" });
  await tarpit();
  return new Response(fakeDirListing("db-dump", FAKE_DUMPS), {
    status: 200,
    headers: decoyHeaders("text/html; charset=utf-8"),
  });
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBodySnippet(request);
  logDecoyHit("db-dump", request, { body, note: "dump upload attempt" });
  await tarpit();
  return new Response(fakeDirListing("db-dump", FAKE_DUMPS), {
    status: 200,
    headers: decoyHeaders("text/html; charset=utf-8"),
  });
}
