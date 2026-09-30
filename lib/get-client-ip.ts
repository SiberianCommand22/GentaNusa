// Utilitas resolusi IP asli pengunjung di belakang Cloudflare Proxy.
// Prioritas: cf-connecting-ip → x-real-ip → x-forwarded-for[0] → loopback.
export function getClientIp(req: { headers: Headers } | Headers): string {
  const headers: Headers =
    req instanceof Headers ? req : req.headers;
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}
