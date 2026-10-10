import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Batas anti-SSRF (duplikat edge-safe dari logika di app/api/og-image/route.ts):
// hanya path lokal atau https ke host allowlist yang boleh dirender satori.
// Satori me-fetch `src` dari sisi server, jadi URL mentah = SSRF.
function isAllowedImageUrl(urlStr: string): boolean {
  try {
    if (
      urlStr.startsWith('/media/') ||
      urlStr.startsWith('/images/') ||
      urlStr.startsWith('/logo.png')
    ) {
      return true;
    }
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '[::1]' ||
      host === '::1' ||
      /^(127|10|169\.254|192\.168)\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      (/^[\d.]+$/.test(host) && /^[0-9]+$/.test(host.replaceAll('.', '')))
    ) {
      return false;
    }
    const supabaseHost = (() => {
      try {
        const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        return raw ? new URL(raw).hostname.toLowerCase() : '';
      } catch {
        return '';
      }
    })();
    const allowed = new Set(
      [
        'gentanusa.id',
        'www.gentanusa.id',
        'gentanusa.vercel.app',
        'image.pollinations.ai',
        supabaseHost,
      ].filter(Boolean)
    );
    return allowed.has(host);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Batasi panjang agar render satori tidak bisa dipaksa mahal (DoS ringan).
    const title = (searchParams.get('title') || 'GentaNusa — Berita Nusantara Terkini').slice(0, 160);
    const category = (searchParams.get('category') || 'Nasional').slice(0, 40);
    const rawImage = (searchParams.get('image') || '').trim();
    // URL tak tervalidasi tidak pernah diteruskan ke ImageResponse.
    const imageUrl = rawImage && isAllowedImageUrl(rawImage) ? rawImage : null;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            fontFamily: 'sans-serif',
            color: 'white',
            padding: '50px 60px',
            position: 'relative',
          }}
        >
          {/* Background Image if available */}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.55,
              }}
            />
          )}

          {/* Gradient overlay for readability. Satori (the engine behind
              ImageResponse) has no backdrop-filter, so a photo-bright
              background leaves white text unreadable. Go dark enough that
              the title survives any image. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to top, rgba(2,6,23,0.97) 0%, rgba(2,6,23,0.85) 45%, rgba(2,6,23,0.55) 100%)',
            }}
          />

          {/* Top Header: Category badge */}
          <div style={{ display: 'flex', zIndex: 10 }}>
            <span
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontSize: '22px',
                fontWeight: 700,
                padding: '8px 24px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {category}
            </span>
          </div>

          {/* Bottom Content: Title & Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10, gap: '20px' }}>
            <div
              style={{
                fontSize: title.length > 90 ? '38px' : title.length > 60 ? '44px' : '52px',
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#ffffff',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '1px', color: '#60a5fa' }}>
                GENTANUSA.ID
              </div>
              <div style={{ fontSize: '18px', color: '#94a3b8' }}>
                Portal Berita & Jurnalisme Warga
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(`Failed to generate image: ${message}`, { status: 500 });
  }
}
