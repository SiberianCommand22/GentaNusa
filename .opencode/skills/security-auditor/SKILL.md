---
name: security-auditor
description: Audit the GentaNusa codebase for security regressions — RBAC/auth, XSS sanitization, secrets/privacy leakage, HTTP security headers, and API runtime posture. Use when reviewing changes to admin auth, article CRUD, the public API surface, sanitizers, or next.config.ts.
---

# GentaNusa Security Auditor

Defensive, source-first audit checklist for this Next.js 15 + Supabase news portal. Every finding needs a concrete trust boundary crossed and an observable result — not a missing best practice.

## Architecture trust model

- **Public** (unauthenticated): `/`, `/[slug]`, `/kategori/[slug]`, root-level category pages, `GET /api/articles` (no scope), `GET /api/sources`. Must only ever see `status=published` rows and a stripped field set.
- **Redaksi** (logged-in author/editor): article CRUD on their OWN rows. Session proved server-side via `supabase.auth.getUser()` on `genta_token` — never trust `genta_admin` or `genta_session` cookies for auth decisions.
- **Administrator**: full access (`app_metadata.role` in `{admin, superadmin, super_admin, administrator}` OR verified `MASTER_ADMIN_EMAIL`). DELETE is admin-only.
- **Server-only secrets**: `SUPABASE_SERVICE_KEY`, `MASTER_ADMIN_EMAIL`. Never `NEXT_PUBLIC_*`.

## Checklist

Work through each item; cite `file:line` for any finding.

### 1. RBAC & auth
- Public article queries filter `.eq("status", "published")` and exclude `staging-%` authors.
- Admin gates use `getEditorialSession()` / `lib/auth.ts` (Supabase-Auth-backed), not raw cookie flags.
- DELETE and cross-author edit return 403 with the documented Indonesian messages.
- `user_id` stamped from session on create; never rewritten on update; never trusted from client slug claims.
- Public `GET /api/articles` strips to `{id, slug, title, category, excerpt, date, author, image, tags}` — no `user_id`, emails, or internal metadata.

### 2. XSS & sanitization
- Article `content`/`excerpt`/`lead` rendered via `lib/sanitize-regex.ts` (allowlist: `SAFE_TAGS`, `SAFE_CLASSES`, `MAX_BLOCKS=1000`, `MAX_BLOCK_CHARS=100_000`, `FORBIDDEN` regex).
- No `dangerouslySetInnerHTML` outside the sanitizer path.
- User-supplied strings interpolated into responses are HTML-encoded at render.

### 3. Secrets & privacy
- No `SUPABASE_SERVICE_KEY` or `MASTER_ADMIN_EMAIL` prefixed `NEXT_PUBLIC_`.
- API error responses are generic (`"Terjadi kesalahan internal pada server"`) — never `error.message`, stack traces, or PostgREST internals. Log details server-side via `console.error` only.
- `.env.local` is git-ignored; no secrets in committed config, `next.config.ts`, or client bundles.
- Admin login route (`/admin/login/gentanusa`) is the only login entry; `/admin/login` is sealed (`notFound()`).

### 4. HTTP security headers (next.config.ts)
- CSP has no `'unsafe-eval'` in production; `'unsafe-inline'` for scripts only where required.
- `X-Frame-Options` / `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `HSTS` present.
- `poweredByHeader: false`.
- `/api/debug/*` returns 404 in production.

### 5. API runtime posture
- Every route under `app/api/**` declares `export const runtime = "nodejs"` (Vercel Hobby 1 MB Edge limit — do not switch to Edge).
- Write routes use `lib/supabase-rest.ts` (raw PostgREST fetch) — no `supabase-js` in API bundles.
- Rate limiting on login (`5/15min`) and upload endpoints.
- Input validation before any DB write; slugs sanitized via `sanitizeSlugRest`.

## How to audit a change

**Step 0 — Always run the automated scanner first:**

```bash
npm run audit:security
```

This executes `scripts/audit-system.ts`, which checks 6 critical vectors
(secrets exposure, Edge runtime regression, XSS fuzzing, IDOR/RBAC,
public-vs-draft data privacy, HTTP security headers). Every finding is
PASS/FAIL with exact file references. **If any vector FAILs, fix the
underlying code before proceeding with manual review.**

Then continue with the manual checklist:

1. Read the diff (`git diff`) and map touched files to checklist sections above.
2. For each touched API route, confirm runtime, auth gate, published-filter (if public), and generic error responses.
3. For any new render path, confirm sanitizer usage.
4. Grep for regressions: `error\.message`, `NEXT_PUBLIC_SUPABASE_SERVICE`, `dangerouslySetInnerHTML`, `runtime = "edge"`.
5. Report findings as `file:line` + crossed boundary + concrete result + smallest fix. Do not modify source — this skill describes fixes only.

## Severity anchors (adapted)

- **critical** — unauthenticated full DB read/write, auth bypass, or account takeover.
- **high** — cross-author read/write, admin bypass, stored XSS reaching other users, or secret exposure.
- **medium** — public draft/private-field leakage, missing header with exploitable context, or generic-error regression leaking internals.
- **low** — non-secret internal disclosure requiring sustained effort to reach.
