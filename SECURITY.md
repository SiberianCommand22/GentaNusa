# GentaNusa — Security Checklist

## ✅ Completed

- [x] CSP headers (script-src self + unsafe-inline/eval for dev)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy
- [x] Permissions-Policy (camera/mic/geo disabled)
- [x] .gitignore excludes .env files
- [x] .env.example template (no real values)
- [x] Admin login with ADMIN_PASSWORD env var
- [x] Timing-safe password comparison
- [x] Login rate limiting (5 attempts per 15 min per IP)
- [x] XSS sanitization (DOMPurify on article content)
- [x] Input validation (article ID must be number)
- [x] Environment-based URLs (no hardcoded domains)
- [x] npm audit: 0 vulnerabilities
- [x] Error handling: consistent API error responses
- [x] All API routes protected where needed (admin cookie check)
- [x] No console error on localhost (dev server running stable)
- [x] Hydration mismatch fixed (suppressHydrationWarning)
- [x] CSP eval/inline allowed for React dev mode
- [x] Category API stripped color field (not public)
- [x] Debug APIs removed (no leak to production)
- [x] Supabase RLS active
- [x] Footer logo fixed per mode (no mixed visibility)
- [x] Back to top button added for long content pages
- [x] Breadcrumb on articles for navigation clarity
- [x] Image caption on articles for source credit
- [x] Search dropdown (no separate search page)
- [x] 10 categories in navbar (all accessible)
- [x] Active nav link works on all pages

## ⚠️ Improvements Needed (Future)

- [ ] HTTPS in production (Vercel provides this automatically)
- [ ] Cookie: Secure flag (only in production)
- [ ] Cookie: SameSite Strict
- [ ] Security headers in production (CSP, HSTS)
- [ ] Rate limiting on all API routes (not just login)
- [ ] CSRF protection for POST requests
- [ ] Content Security Policy strict-dynamic in production
- [ ] Dependency audit: regular schedule (monthly)
- [ ] Automated security scanning (GitHub Actions)
- [ ] Backup strategy for Supabase database
- [ ] Monitoring/alerting for 5xx errors
- [ ] Admin session expiry
- [ ] Input sanitization on all user input forms
- [ ] Security.txt at /.well-known/security.txt
- [ ] Content Security Policy report-uri for monitoring
- [ ] Subresource Integrity (SRI) for external scripts

## 🔒 Credentials (Secure)

- [x] No hardcoded secrets in source code
- [x] All secrets via environment variables (.env.local, not committed)
- [x] Supabase service role key: server-side only
- [x] Admin password stored in ADMIN_PASSWORD env var
- [x] .env.example has template values only

## 📋 Status

Security level: **Bbaik** (Good for development/local)
Production readiness: **Perlu peningkatan** (Needs improvement before production)

Last updated: September 2026