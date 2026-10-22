/**
 * DECOY (honeypot) — tidak ada phpMyAdmin di infrastruktur ini (Supabase).
 * Hit menandakan pemindaian panel database. Lihat lib/decoy.ts.
 */
import { decoyHeaders, logDecoyHit, readBodySnippet, tarpit } from "@/lib/decoy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fakePhpMyAdminHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex,nofollow">
<title>phpMyAdmin 5.2.1</title>
<style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f5f5f5;color:#000;margin:0;padding:7vh 0}
#box{width:340px;margin:0 auto;background:#fff;border:1px solid #ccc;padding:22px}
h1{font-size:18px;font-weight:600;margin:0 0 6px;color:#235a81}
.sub{font-size:12px;color:#666;margin:0 0 16px}
label{display:block;font-size:13px;margin:10px 0 3px}
input{width:100%;box-sizing:border-box;padding:5px 7px;border:1px solid #aaa;font-size:14px}
button{margin-top:16px;background:#235a81;color:#fff;border:0;padding:6px 14px;cursor:pointer;font-size:13px}
.note{margin-top:14px;font-size:11px;color:#666}
</style>
</head>
<body>
<div id="box">
<h1>phpMyAdmin</h1>
<p class="sub">Welcome to phpMyAdmin 5.2.1</p>
<form method="post" action="/phpmyadmin/index.php">
<label for="u">Username:</label><input id="u" type="text" name="pma_username" autocomplete="username">
<label for="p">Password:</label><input id="p" type="password" name="pma_password" autocomplete="current-password">
<button type="submit">Log in</button>
</form>
<p class="note">Language: English &middot; MySQL 8.0.34</p>
</div>
</body>
</html>`;
}

export async function GET(request: Request): Promise<Response> {
  logDecoyHit("phpmyadmin", request, { note: "phpmyadmin probe" });
  await tarpit();
  return new Response(fakePhpMyAdminHtml(), {
    status: 200,
    headers: decoyHeaders("text/html; charset=utf-8"),
  });
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBodySnippet(request);
  logDecoyHit("phpmyadmin", request, { body, note: "credential attempt" });
  await tarpit();
  return new Response(fakePhpMyAdminHtml(), {
    status: 200,
    headers: decoyHeaders("text/html; charset=utf-8"),
  });
}
