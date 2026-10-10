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
- `python scripts/og-render.py --id <id>` — pre-render OG share card (needs Pillow)

## Publishing (100% manual)

No cron, no GitHub Actions schedule, no auto-generator. All articles are
created by a logged-in redaksi account in `/admin` via `POST /api/articles`,
which rejects unauthenticated requests with 401.

## Redaksi auth & RBAC

Login is **private**: the form lives only at `/admin/login/gentanusa`.
`/admin/login` is sealed (`notFound()`), and no login link exists in the
public navbar or drawer.

Session cookies (all httpOnly, 7d): `genta_admin` (flag), `genta_session`
(display hints only — NEVER trusted for auth), `genta_token` (Supabase access
token, the sole session proof).

- `lib/auth.ts` — resolves the session ONLY via
  `supabase.auth.getUser(token)`. No token / invalid token = null; there is
  no cookie-claims fallback.
- Login (`POST /api/admin/login`) is Supabase-Auth-only; no hardcoded master
  password exists. The master admin must own a Supabase Auth user with the
  `MASTER_ADMIN_EMAIL` address.
- Administrator = `app_metadata.role` in `{admin, superadmin, super_admin, administrator}`
  (set server-side via `scripts/assign-admin-role.ts`)
  OR the master admin email on the VERIFIED identity. `user_metadata.role`
  never grants admin (user-mutable via client SDK).
- `lib/editorial-articles.ts` — all CMS reads of `articles`. Admins get every
  row; regular authors get only rows with their server-side `user_id` UUID
  (single `.eq()` filter — no slug claims, no raw `.or()` interpolation).
  Legacy rows without `user_id` are admin-visible only until backfilled.
- `articles.user_id` is stamped from the session on create and never rewritten
  on update (ownership ignores non-admin slug claims; `author_slug` is a
  display hint, never an ownership proof). Run `scripts/migrate-articles.sql`
  to add the column, then backfill legacy rows (template at file bottom).
- `DELETE` on articles is admin-only: non-admins get 403
  `Hanya Administrator Utama yang berhak menghapus berita.`
- Editing someone else's article returns 403
  `Akses Ditolak: Anda tidak memiliki izin mengedit artikel ini.`
  (see `app/admin/posts/edit/[id]/page.tsx` and `GET /api/articles/[id]?scope=edit`).

## Data flow

Supabase is the source of truth. `lib/data/*.json` is a build-time snapshot for SSG fallback.

- `lib/data.ts` reads from Supabase at runtime (30s in-process cache), falls back to JSON
- `scripts/sync-supabase.mjs` pulls Supabase → JSON (runs automatically in `build:sync`)
- After DB changes, wait up to 30s for cache to expire or restart dev server

## Staging workflow (retired)

The auto-article generator, its GitHub Actions cron, and the
`/api/admin/pending` approve/reject route were removed. The `staging-%`
filter in `lib/data.ts` stays as defense-in-depth against legacy rows.

## Environment

Copy `.env.example` → `.env.local`. Key vars:

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client-safe) |
| `SUPABASE_SERVICE_KEY` | Server-only secret (never expose to client) |
| `MASTER_ADMIN_EMAIL` | Email Administrator Utama (wajib punya akun Supabase Auth; admin via email terverifikasi atau `app_metadata.role`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO/sitemap |

## Architecture

- **App Router** with SSG + ISR (`revalidate = 60` on homepage)
- **No database** — JSON files + Supabase (PostgREST, no ORM)
- **Redaksi auth**: Supabase-Auth-only login (`/api/admin/login`, rate-limited 5/15min); session resolved per request via `lib/auth.ts` (`getUser` on `genta_token`); admin via `app_metadata.role` — see `scripts/assign-admin-role.ts` + `scripts/enable-rls.sql`
- **Images**: `image.pollinations.ai` and `*.supabase.co` allowed in `next.config.ts`
- **CSP**: strict, allows `'unsafe-inline'` for scripts (prod has NO `'unsafe-eval'`); `/api/debug/*` returns 404 in production
- **Vercel deploy**: project ID in `.vercel/project.json`; state in `.deploy-state.json`

## CI

No scheduled workflows. (The former `daily-article.yml` cron was removed
with the auto-generator; publishing is manual-only.)

## Gotchas

- `lib/data.ts` caches for 30s — restart dev server to see DB changes immediately
- No test suite — `verify-all.mjs` is a manual smoke test, not automated
- `app/page.tsx` imports `NextResponse` from `next/server` (unused) — harmless but sloppy
- Python scripts use stdlib only; no `requirements.txt` to install
