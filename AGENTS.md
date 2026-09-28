<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build:sync` — **preferred build**: syncs Supabase → `lib/data/*.json`, then `next build`
- `npm run build` — build without Supabase sync (uses stale JSON)
- `npm run lint` — ESLint (only verification command; no test suite exists)
- `npx tsc --noEmit` — typecheck (no script alias)
- `python scripts/fetch_rss.py` — fetch RSS syndication items → `lib/data/syndicated.json`
- `python scripts/auto-article-gen.py` — generate one original article from RSS via LLM
- `python scripts/auto-article-gen.py --dry-run` — test without writing
- `python scripts/auto-article-gen.py --save-pending` — stage article for admin review

## Data flow

Supabase is the source of truth. `lib/data/*.json` is a build-time snapshot for SSG fallback.

- `lib/data.ts` reads from Supabase at runtime (30s in-process cache), falls back to JSON
- `scripts/sync-supabase.mjs` pulls Supabase → JSON (runs automatically in `build:sync`)
- After DB changes, wait up to 30s for cache to expire or restart dev server

## Auto-article pipeline

`scripts/auto-article-gen.py` (stdlib only, no requirements.txt):

1. Fetches RSS from sources in `lib/data/sources.json`
2. Sends to LLM: 9Router local (`127.0.0.1:20128`) first, Gemini cloud fallback
3. Validates output (length, no CJK, no placeholder text)
4. Inserts into Supabase with `author_slug = "staging-<slug>"` (pending review) or `"redaksi-gentanusa"` (live)

**Critical**: `staging_slug()` in Python and `slugOf()` in `app/api/admin/pending/route.ts` must stay byte-identical (same hash algorithm). Changing one breaks approve/reject.

## Staging workflow

1. Generator inserts with `--save-pending` → row has `staging-` prefix in `author_slug`
2. Public site excludes `staging-%` rows (filter in `lib/data.ts`)
3. Admin panel (`/admin`) polls `/api/admin/pending` every 30s
4. Approve → rewrites `author_slug` to `redaksi-gentanusa`; Reject → deletes row

## Environment

Copy `.env.example` → `.env.local`. Key vars:

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client-safe) |
| `SUPABASE_SERVICE_KEY` | Server-only secret (never expose to client) |
| `ADMIN_PASSWORD` | Admin panel login (min 12 chars) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO/sitemap |

## Architecture

- **App Router** with SSG + ISR (`revalidate = 60` on homepage)
- **No database** — JSON files + Supabase (PostgREST, no ORM)
- **Admin auth**: cookie `genta_admin=1`, set by `/api/admin/login` (rate-limited 5/15min)
- **Images**: `image.pollinations.ai` and `*.supabase.co` allowed in `next.config.ts`
- **CSP**: strict, allows `'unsafe-inline'` + `'unsafe-eval'` for scripts
- **Vercel deploy**: project ID in `.vercel/project.json`; state in `.deploy-state.json`

## CI

GitHub Actions (`.github/workflows/daily-article.yml`): runs `auto-article-gen.py` at 13:00 UTC (20:00 WIB) daily. Uses `GEMINI_API_KEY` secret. Offset from local Task Scheduler run (08:00 WIB) to avoid duplicate articles.

## Gotchas

- `lib/data.ts` caches for 30s — restart dev server to see DB changes immediately
- `fetch_rss.py` has duplicate `fetch_xml` definition (second overrides first) — harmless but confusing
- No test suite — `verify-all.mjs` is a manual smoke test, not automated
- `app/page.tsx` imports `NextResponse` from `next/server` (unused) — harmless but sloppy
- Python scripts use stdlib only; no `requirements.txt` to install
