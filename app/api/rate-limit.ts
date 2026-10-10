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

// Store default: memori lokal + sapu entri kedaluwarsa agar tidak bocor.
let lastSweep = 0;
function pruneExpired(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, entry] of rateMap) {
    if (now >= entry.resetAt) rateMap.delete(key);
  }
}

export function rateLimit(req: NextRequest): { ok: true } | { ok: false; response: NextResponse } {
  // Resolusi IP Cloudflare-aware: cf-connecting-ip (dipertahankan middleware
  // dari header asli Cloudflare) -> x-real-ip -> x-forwarded-for[0].
  const ip = getClientIp(req);

  const now = Date.now();
  pruneExpired(now);
  const entry = rateMap.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= RATE_LIMIT) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Too many requests. Try again later." },
          { status: 429 }
        ),
      };
    }
    entry.count++;
  } else {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  return { ok: true };
}
