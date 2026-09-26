# Google AdSense Integration — GentaNusa News Portal

## Prerequisites
- Google AdSense account registered
- `ads.txt` file at domain root (`https://gentanusa.id/ads.txt`)
- Content policy compliant (no copyright violations, no adult content, no prohibited topics)

## ads.txt Setup

Create `public/ads.txt` in the project root with:
```
google.com, pub-XXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```
Replace `pub-XXXXXXXXXXXXXX` with your actual AdSense publisher ID.

## Script Deployment

**Option 1: Manual Script Tag (client-side)**
Add to `app/layout.tsx` inside `<head>`:
```tsx
<script async src={`https://pagead2.googlesource.com/pagead/js/adsbygoogle.js?client=ca-pub-${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`} crossOrigin="anonymous"></script>
```

**Option 2: Server-side Ads Component (recommended)**
See `components/ad-slot.tsx` for reusable ad slot component.

## Ad Placement Patterns

### In-Article Ads
After 2-3 paragraphs in article content:
```tsx
<ArticleContent content={article.content} />
<AdSlot slot="1234567890" style={{ margin: "2rem 0" }} />
```

### In-Feed Ads (Homepage)
After hero section, before "Terbaru":
```tsx
<section className={styles.section}>
  <AdSlot slot="0987654321" style={{ margin: "2rem auto" }} />
  <h2 className={styles.sectionTitle}>Terbaru</h2>
  ...
</section>
```

## Common Verification Issues

### "Cannot verify your site" (Tidak dapat memverifikasi situs Anda)
**Root causes:**
1. `ads.txt` not deployed yet → run `vercel --prod` to deploy
2. CDN cache stale → wait 5-10 minutes
3. DNS propagation incomplete → verify domain is working

**Fix:**
1. Verify `https://gentanusa.id/ads.txt` returns correct content
2. Run fresh Vercel deployment: `npx vercel --prod`
3. Click "Refresh verification" in AdSense dashboard

### Cloudflare Content Filter Rejections
If 9Router image generation returns 400 with content moderation error:
1. Prompt contains sensitive topics (war, violence, adult)
2. Auto-retry with sanitized prompt
3. Fall back to placeholder image

## Troubleshooting Checklist

- [ ] `ads.txt` accessible at root domain
- [ ] Script tag uses correct `ca-pub-XXXXXX` ID
- [ ] AdSlot component uses `data-ad-client` attribute
- [ ] No ad blockers interfering (test in incognito)
- [ ] Domain fully propagated (check with `dig +short gentanusa.id`)

## Policy Reminders

- No pop-ups or interstitials
- No auto-playing video/audio
- No deceptive content
- Ads must not be marked as editorial content
- Read Google AdSense programs policies: https://support.google.com/adsense/answer/48182