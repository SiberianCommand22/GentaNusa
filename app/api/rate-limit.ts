import { NextRequest, NextResponse } from "next/server";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max attempts per window
const WINDOW_MS = 60 * 1000; // 1 minute

export function rateLimit(req: NextRequest): { ok: true } | { ok: false; response: NextResponse } {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
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