/**
 * DECOY (honeytoken) — target rewrite dari `/.git/:path*` (lihat next.config.ts).
 *
 * Folder sumber sengaja TIDAK bernama `.git`: Git menolak melacak path di dalam
 * direktori bernama `.git`, sehingga rute semacam itu tidak akan pernah sampai
 * ke Vercel. Karena itu URL umpan asli dipetakan lewat rewrite ke handler ini.
 * Lihat lib/decoy.ts.
 */
import { decoyHeaders, logDecoyHit, tarpit } from "@/lib/decoy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FAKE_CONFIG = `[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = false
\tlogallrefupdates = true
[remote "origin"]
\turl = git@github.com:gentanusa/website.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tremote = origin
\tmerge = refs/heads/main
`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
): Promise<Response> {
  const { path } = await params;
  const probe = (path ?? []).join("/").toLowerCase();
  logDecoyHit("dotgit", request, { note: `git probe: ${probe || "(root)"}` });
  await tarpit();

  if (probe === "head") {
    return new Response("ref: refs/heads/main\n", {
      status: 200,
      headers: decoyHeaders("text/plain; charset=utf-8"),
    });
  }
  if (probe === "config") {
    return new Response(FAKE_CONFIG, {
      status: 200,
      headers: decoyHeaders("text/plain; charset=utf-8"),
    });
  }
  // Probe lain (index, logs/HEAD, packed-refs) — balas 404 setelah tarpit agar
  // pemindai tidak menyimpulkan direktori ini kosong dan berhenti mencoba.
  return new Response("Not Found", {
    status: 404,
    headers: decoyHeaders("text/plain; charset=utf-8"),
  });
}
