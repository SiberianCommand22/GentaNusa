import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'GentaNusa — Berita Nusantara Terkini';
    const category = searchParams.get('category') || 'Nasional';
    const imageUrl = searchParams.get('image');

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
  } catch (e: any) {
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
