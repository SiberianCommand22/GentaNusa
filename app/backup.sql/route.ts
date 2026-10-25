/**
 * DECOY (honeytoken) — tidak ada file backup.sql di infrastruktur ini
 * (data disimpan di Supabase/Postgres, bukan MySQL). Request ke path ini
 * adalah tebakan pemindai terhadap stack LAMP. Lihat lib/decoy.ts.
 */
import {
  decoyHeaders,
  fakeSqlDump,
  logDecoyHit,
  readBodySnippet,
  tarpit,
} from "@/lib/decoy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  logDecoyHit("backup-sql", request, { note: "backup dump probe" });
  await tarpit();
  return new Response(fakeSqlDump(), {
    status: 200,
    headers: decoyHeaders("application/sql; charset=utf-8"),
  });
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBodySnippet(request);
  logDecoyHit("backup-sql", request, { body, note: "backup upload attempt" });
  await tarpit();
  return new Response(fakeSqlDump(), {
    status: 200,
    headers: decoyHeaders("application/sql; charset=utf-8"),
  });
}
