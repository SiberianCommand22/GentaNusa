/**
 * CYBER DECEPTION — tarpit + honeytoken untuk pemindai otomatis.
 *
 * Rute umpan (`/.git/HEAD`, `/wp-admin`, `/wp-login.php`, `/phpmyadmin`,
 * `/api/v1/debug`) SENGAJA tidak ada di aplikasi nyata (Next.js + Supabase).
 * Setiap hit berarti pemindai/penyerang menebak stack yang salah — bukan
 * trafik pengguna wajar. Handler menahan koneksi ±3,5 detik (tarpit: memboroskan
 * waktu & worker penyerang, bukan kuota kita karena hanya setTimeout) lalu
 * menulis satu baris audit ke log server yang bisa dicari di Vercel:
 *
 *   Vercel > Logs > filter "[decoy:"
 *
 * Body yang dikirim ke form login palsu ikut dicatat (dipotong) sebagai
 * honeytoken: kredensial yang dicoba adalah bukti niat jahat, bukan data kita.
 *
 * Modul ini TANPA dependensi (hanya `lib/get-client-ip`) agar aman di runtime
 * Node maupun Edge dan tidak menambah bobot bundel serverless.
 */
import { getClientIp } from "@/lib/get-client-ip";

/** Tarpit: cukup lama untuk mengganggu tool, cukup singkat untuk tidak menahan slot lama. */
export const DECOY_DELAY_MS = 3500;

const MAX_BODY_LOG = 300;

export type DecoyName =
  | "dotgit"
  | "wp-admin"
  | "wp-login"
  | "phpmyadmin"
  | "api-debug";

/** Header respons umpan: tidak di-cache, tidak diindeks, tidak di-embed. */
export function decoyHeaders(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store, max-age=0",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-site",
  };
}

/** Tahan permintaan tanpa memblokir event loop. */
export async function tarpit(ms: number = DECOY_DELAY_MS): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Catat hit umpan ke log. Satu baris JSON agar mudah difilter/di-parse.
 * Tidak pernah melempar — kegagalan logging tidak boleh mengubah perilaku umpan.
 */
export function logDecoyHit(
  name: DecoyName,
  request: Request,
  extra: { body?: string; note?: string } = {}
): void {
  try {
    const headers = request.headers;
    const url = (() => {
      try {
        return new URL(request.url).pathname;
      } catch {
        return request.url;
      }
    })();
    const entry = {
      trap: name,
      ip: getClientIp(request),
      method: request.method,
      path: url,
      ua: (headers.get("user-agent") || "").slice(0, 200),
      referer: (headers.get("referer") || "").slice(0, 200),
      country: headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "",
      body: extra.body ? extra.body.slice(0, MAX_BODY_LOG) : undefined,
      note: extra.note,
      at: new Date().toISOString(),
    };
    console.warn(`[decoy:${name}] ${JSON.stringify(entry)}`);
  } catch {
    // abaikan
  }
}

/**
 * Baca body permintaan sebagai teks (dipotong) untuk honeytoken.
 * Aman untuk body kosong / bukan teks.
 */
export async function readBodySnippet(
  request: Request,
  maxLen = MAX_BODY_LOG
): Promise<string | undefined> {
  try {
    const text = await request.text();
    const trimmed = text.trim();
    return trimmed ? trimmed.slice(0, maxLen) : undefined;
  } catch {
    return undefined;
  }
}

/** Halaman login palsu ala WordPress (markup minimal, tanpa aset eksternal). */
export function fakeWpLoginHtml(title = "Log In"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex,nofollow">
<title>${title} &lsaquo; GentaNusa &#8212; WordPress</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f0f0f1;margin:0;padding:8vh 0;color:#3c434a}
#login{width:320px;margin:0 auto;background:#fff;border:1px solid #c3c4c7;padding:26px 24px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
h1{font-size:20px;font-weight:400;text-align:center;margin:0 0 18px}
label{display:block;font-size:14px;margin:0 0 4px}
input[type=text],input[type=password]{width:100%;box-sizing:border-box;font-size:20px;padding:6px 10px;border:1px solid #8c8f94;border-radius:4px}
p{margin:14px 0 0}
.button{display:inline-block;background:#2271b1;color:#fff;border:1px solid #2271b1;border-radius:3px;font-size:13px;padding:4px 12px;cursor:pointer}
.footer{margin-top:18px;font-size:13px;color:#646970;text-align:center}
</style>
</head>
<body>
<div id="login">
<h1>Log In</h1>
<form name="loginform" id="loginform" action="/wp-login.php" method="post">
<p><label for="user_login">Username or Email Address</label><input type="text" name="log" id="user_login" autocomplete="username"></p>
<p><label for="user_pass">Password</label><input type="password" name="pwd" id="user_pass" autocomplete="current-password"></p>
<p><input type="submit" name="wp-submit" id="wp-submit" class="button" value="Log In"></p>
</form>
<p class="footer"><a href="/wp-login.php?action=lostpassword">Lost your password?</a></p>
</div>
</body>
</html>`;
}
