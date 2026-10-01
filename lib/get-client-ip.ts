// Utilitas resolusi IP asli pengunjung di belakang Cloudflare Proxy.
// Prioritas: cf-connecting-ip → x-real-ip → x-forwarded-for[0] → loopback.
export function getClientIp(request: Request): string;
export function getClientIp(req: { headers: Headers } | Headers): string;
export function getClientIp(input: Request | { headers: Headers } | Headers): string {
  const headers: Headers =
    input instanceof Headers ? input : (input as Request | { headers: Headers }).headers;
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}
