import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max attempts per window
const WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Pembatas laju in-memory per instance.
 *
 * PERINGATAN ARSITEKTUR (serverless/Vercel): Map ini hidup di memori satu
 * instance isolate. Pada deployment serverless dengan banyak instance
 * konkuren, penyerang dapat menyebar request lintas instance sehingga batas
 * ini TIDAK efektif sebagai pertahanan satu-satunya. WAJIB dilapisi:
 *   - Aturan Cloudflare WAF Rate Limiting (lihat SECURITY.md):
 *       /api/admin/login  -> 5 req/menit/IP (block 10 mnt)
 *       /api/upload       -> 20 req/menit/IP
 *       /api/articles/*   -> batasi mutasi (POST/PUT/DELETE) per IP
 *   - Bila tersedia, ganti store dengan KV terpusat (Upstash Redis / Vercel
 *     KV) lewat interface `RateLimitStore` di bawah.
 */

export type RateLimitStore = {
  incr(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
};

export type RateLimitOptions = {
  /**
   * Nama ember (bucket). Tiap endpoint mutasi WAJIB punya bucket sendiri
   * agar unggahan gambar tidak menghabiskan kuota publikasi artikel (dan
   * sebaliknya). Default: "default".
   */
  bucket?: string;
  /** Maksimum permintaan per jendela. Default: RATE_LIMIT (10). */
  limit?: number;
  /** Panjang jendela dalam milidetik. Default: WINDOW_MS (60 detik). */
  windowMs?: number;
};

// Store default: memori lokal + sapu entri kedaluwarsa agar tidak bocor.
const PRUNE_INTERVAL_MS = 60 * 1000;
let lastSweep = 0;
function pruneExpired(now: number) {
  if (now - lastSweep < PRUNE_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of rateMap) {
    if (now >= entry.resetAt) rateMap.delete(key);
  }
}

export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions = {}
): { ok: true } | { ok: false; response: NextResponse } {
  // Resolusi IP Cloudflare-aware: cf-connecting-ip (dipertahankan middleware
  // dari header asli Cloudflare) -> x-real-ip -> x-forwarded-for[0].
  const ip = getClientIp(req);
  const limit = Math.max(1, Math.floor(opts.limit ?? RATE_LIMIT));
  const windowMs = Math.max(1000, Math.floor(opts.windowMs ?? WINDOW_MS));
  const key = `${opts.bucket ?? "default"}:${ip}`;

  const now = Date.now();
  pruneExpired(now);
  const entry = rateMap.get(key);

  if (entry && now < entry.resetAt) {
    if (entry.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Too many requests. Try again later." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        ),
      };
    }
    entry.count++;
  } else {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
  }

  return { ok: true };
}
