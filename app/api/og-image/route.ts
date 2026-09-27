import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const BANNER_HEIGHT = 120;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleImage = searchParams.get("image");
  const title = searchParams.get("title") || "";
  const category = searchParams.get("category") || "";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gentanusa.id";
  // articleImage may be a full remote URL (Supabase, Pollinations) or a local
  // /media/... path. Prefixing SITE_URL onto an absolute URL produced
  // "https://gentanusa.idhttps://..." which 404s, dropping every share preview
  // into the logo-only fallback.
  const baseImage = articleImage
    ? /^https?:\/\//i.test(articleImage)
      ? articleImage
      : `${SITE_URL}${articleImage}`
    : `${SITE_URL}/images/placeholder-article.svg`;

  const logoPath = path.join(process.cwd(), "public/images/logo-gentanusa-white.png");

  try {
    // Fetch article image
    const imgRes = await fetch(baseImage);
    if (!imgRes.ok) throw new Error("Failed to fetch article image");
    const imgBuffer = await imgRes.arrayBuffer();
    const imgInput = Buffer.from(imgBuffer);

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