import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import { rateLimit } from "@/app/api/rate-limit";

export const runtime = "nodejs";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const BANNER_HEIGHT = 120;
// MEDIUM: pipeline fetch+sharp ini mahal per request — batasi ukuran sumber
// dan waktu fetch agar tak jadi pusat pembakaran CPU/memori/egress.
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;

/** Fetch dengan anggaran byte + timeout; throw bila sumber terlalu besar. */
async function fetchImageBudgeted(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error("Failed to fetch article image");
    const declared = Number(res.headers.get("content-length") || "0");
    if (declared > MAX_SOURCE_BYTES) throw new Error("Source image too large");
    if (!res.body) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_SOURCE_BYTES) throw new Error("Source image too large");
      return Buffer.from(buf);
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_SOURCE_BYTES) {
        await reader.cancel().catch(() => {});
        throw new Error("Source image too large");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timer);
  }
}

// Batas anti-SSRF: hanya host ini yang boleh di-fetch server-side.
// Path lokal absolut selalu diizinkan; selain itu wajib https + allowlist.
function supabaseHostname(): string | null {
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (!raw) return null;
    return new URL(raw).hostname || null;
  } catch {
    return null;
  }
}

function isAllowedImageUrl(urlStr: string): boolean {
  try {
    // Izinkan path lokal absolut milik situs sendiri.
    if (
      urlStr.startsWith("/media/") ||
      urlStr.startsWith("/images/") ||
      urlStr.startsWith("/logo.png")
    ) {
      return true;
    }

    const parsed = new URL(urlStr);

    // Tolak skema selain https (termasuk http, file, gopher, dll).
    if (parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();

    // Tolak localhost, IP literal privat/link-local, dan decimal/octal tricks.
    if (
      host === "localhost" ||
      host === "[::1]" ||
      host === "::1" ||
      /^(127|10|169\.254|192\.168)\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^[0-9]+$/.test(host.replaceAll(".", "")) && /^[\d.]+$/.test(host)
    ) {
      return false;
    }

    // Allowlist domain resmi.
    const allowedHostnames = new Set(
      [
        "gentanusa.id",
        "www.gentanusa.id",
        "gentanusa.vercel.app",
        "image.pollinations.ai",
        supabaseHostname(),
      ].filter((h): h is string => Boolean(h))
    );

    return allowedHostnames.has(host);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Pembatas laju agar endpoint publik ini tak dipompa untuk compute abuse.
  const limited = rateLimit(req);
  if (!limited.ok) return limited.response;

  const { searchParams } = new URL(req.url);
  const articleImage = searchParams.get("image");
  const title = searchParams.get("title") || "";
  const category = searchParams.get("category") || "";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";
  // articleImage may be a full remote URL (Supabase, Pollinations) or a local
  // /media/... path. Prefixing SITE_URL onto an absolute URL produced
  // "https://gentanusa.idhttps://..." which 404s, dropping every share preview
  // into the logo-only fallback.
  const rawImage = (articleImage || "").trim();
  const candidate = rawImage
    ? /^https?:\/\//i.test(rawImage)
      ? rawImage
      : rawImage.startsWith("/")
        ? `${SITE_URL}${rawImage}`
        : null
    : `${SITE_URL}/images/placeholder-article.svg`;
  // Tolak URL yang tidak lolos allowlist anti-SSRF — jangan pernah fetch().
  const baseImage =
    candidate && isAllowedImageUrl(candidate)
      ? candidate
      : `${SITE_URL}/images/placeholder-article.svg`;

  const logoPath = path.join(process.cwd(), "public/images/logo-gentanusa-white.png");

  try {
    // Fetch article image (beranggaran byte + timeout anti-bloat).
    const imgInput = await fetchImageBudgeted(baseImage);

    // Load white logo
    const logoBuffer = await fs.readFile(logoPath);

    // Create banner: solid brand color with large white logo centered
    const banner = await sharp({
      create: {
        width: OG_WIDTH,
        height: BANNER_HEIGHT,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // slate-900
      },
    })
      .composite([
        {
          input: await sharp(logoBuffer)
            .resize(160, 160, { fit: "inside" })
            .toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();

    // Compose: article image (1200x510) + banner (1200x120) = 1200x630
    const composed = await sharp(imgInput)
      .resize(OG_WIDTH, OG_HEIGHT - BANNER_HEIGHT, { fit: "cover", position: "center" })
      .extend({ bottom: BANNER_HEIGHT, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .composite([{ input: banner, gravity: "south" }])
      .png()
      .toBuffer();

    return new NextResponse(composed, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    // Fallback: solid brand color with large white logo
    const logoBuffer = await fs.readFile(logoPath).catch(() => null);
    const fallback = await sharp({
      create: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 },
      },
    })
      .composite(
        logoBuffer
          ? [{ input: await sharp(logoBuffer).resize(200, 200, { fit: "inside" }).toBuffer(), gravity: "center" }]
          : []
      )
      .png()
      .toBuffer();

    return new NextResponse(fallback, {
      headers: { "Content-Type": "image/png" },
    });
  }
}