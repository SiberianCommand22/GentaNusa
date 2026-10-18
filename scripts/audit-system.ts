#!/usr/bin/env tsx
/**
 * audit-system.ts — Automated security vulnerability scanner & sanity checker.
 *
 * 6 critical vectors:
 *   1. Secrets exposure (NEXT_PUBLIC_ prefix + gitignore audit)
 *   2. Edge-runtime regression guard (every app/api route must be nodejs)
 *   3. Anti-XSS fuzzing of cleanArticleHtml (lib/sanitize-regex.ts)
 *   4. IDOR & RBAC ownership enforcement (DELETE / PUT on articles)
 *   5. Public-vs-draft data privacy (published filter + field stripping)
 *   6. HTTP security headers (next.config.ts)
 *
 * Usage:  npm run audit:security
 * Exit 0 = all PASS, Exit 1 = one or more FAIL.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { cleanArticleHtml } from "../lib/sanitize-regex";

// ---------------------------------------------------------------------------
// Tiny framework
// ---------------------------------------------------------------------------

type VectorResult = { pass: boolean; findings: string[] };

function pass(...lines: string[]): VectorResult {
  return { pass: true, findings: lines };
}
function fail(...lines: string[]): VectorResult {
  return { pass: false, findings: lines };
}

const ROOT = path.resolve(__dirname, "..");

/** Recursively collect files under `dir` matching `ext`. */
function walk(dir: string, ext: string): string[] {
  const out: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      out.push(...walk(full, ext));
    } else if (e.name.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

function rel(p: string): string {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

// ---------------------------------------------------------------------------
// Vector 1 — Secrets Exposure
// ---------------------------------------------------------------------------

function vector1(): VectorResult {
  const findings: string[] = [];

  // 1a. Scan source trees for NEXT_PUBLIC_ on secret variable names.
  const scanDirs = ["app", "components", "lib", "public"];
  const secretPatterns = [
    /NEXT_PUBLIC_\w*(SERVICE|SERVICE_ROLE|PRIVATE|SECRET|TOKEN|PASSWORD|KEY)\w*/gi,
  ];
  const knownSafe = new Set([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SITE_URL",
  ]);

  for (const dir of scanDirs) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of walk(abs, ".ts").concat(walk(abs, ".tsx"), walk(abs, ".js"), walk(abs, ".mjs"))) {
      const src = fs.readFileSync(f, "utf8");
      for (const re of secretPatterns) {
        const matches = src.match(re);
        if (matches) {
          for (const m of matches) {
            if (knownSafe.has(m)) continue;
            findings.push(`SECRET LEAK: ${rel(f)} contains "${m}" — server-only secrets must NOT be NEXT_PUBLIC_*`);
          }
        }
      }
    }
  }

  // 1b. .gitignore must cover .env.local
  const gitignorePath = path.join(ROOT, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    findings.push("GITIGNORE: .gitignore file is missing entirely.");
  } else {
    const gi = fs.readFileSync(gitignorePath, "utf8");
    const hasEnvLocal = /^\.env\.local$/m.test(gi) || /^\.env\.\*\.local$/m.test(gi) || /^\.env\*$/m.test(gi);
    if (!hasEnvLocal) {
      findings.push("GITIGNORE: .env.local is NOT covered — local credentials could be committed.");
    }
  }

  if (findings.length > 0) return fail(...findings);
  return pass("No NEXT_PUBLIC_ secret leaks in app/, components/, lib/, public/.", ".gitignore correctly covers .env.local.");
}

// ---------------------------------------------------------------------------
// Vector 2 — Edge Runtime Regression Guard
// ---------------------------------------------------------------------------

function vector2(): VectorResult {
  const apiDir = path.join(ROOT, "app", "api");
  if (!fs.existsSync(apiDir)) {
    return fail("app/api directory not found — cannot audit runtime declarations.");
  }

  const routeFiles = walk(apiDir, "route.ts").concat(walk(apiDir, "route.tsx"));
  if (routeFiles.length === 0) {
    return fail("No route.ts files found under app/api — unexpected.");
  }

  const problems: string[] = [];
  let checked = 0;

  for (const f of routeFiles) {
    const src = fs.readFileSync(f, "utf8");
    checked++;

    // Explicit edge runtime is an automatic fail.
    if (/export\s+const\s+runtime\s*=\s*['"]edge['"]/i.test(src)) {
      problems.push(`${rel(f)}: uses runtime = 'edge' — Vercel Hobby Edge bundle limit is 1 MB.`);
      continue;
    }

    // Must declare nodejs runtime explicitly.
    if (!/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/i.test(src)) {
      problems.push(`${rel(f)}: missing explicit "export const runtime = 'nodejs'" declaration.`);
    }
  }

  if (problems.length > 0) return fail(...problems);
  return pass(`All ${checked} API route files declare runtime = 'nodejs'.`);
}

// ---------------------------------------------------------------------------
// Vector 3 — Anti-XSS Fuzzing
// ---------------------------------------------------------------------------

function vector3(): VectorResult {
  const payloads: { name: string; input: string }[] = [
    { name: "script alert", input: `<script>alert('xss')</script>` },
    { name: "img onerror", input: `<img src="x" onerror="alert(1)">` },
    { name: "javascript: href", input: `<a href="javascript:alert(1)">Klik</a>` },
    { name: "svg animate onbegin", input: `<svg><animate onbegin=alert(1)>` },
    { name: "iframe data-uri", input: `<iframe src="data:text/html,<script>alert(1)</script>"></iframe>` },
    { name: "div onclick + style-behavior", input: `<div onclick="alert(1)" style="behavior:url(#default#time2)">Nested</div>` },
    { name: "body onload", input: `<body onload="alert(1)">text</body>` },
    { name: "input autofocus onfocus", input: `<input autofocus onfocus="alert(1)">` },
    { name: "details ontoggle", input: `<details open ontoggle="alert(1)">x</details>` },
    { name: "form action javascript", input: `<form action="javascript:alert(1)"><input type=submit></form>` },
    { name: "meta refresh", input: `<meta http-equiv="refresh" content="0;url=javascript:alert(1)">` },
    { name: "base href", input: `<base href="javascript://">` },
    { name: "null/undefined safety", input: "" as unknown as string },
  ];

  const DANGEROUS = [
    /<script[\s>]/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /<form[\s>]/i,
    /<input[\s>]/i,
    /<details[\s>]/i,
    /<body[\s>]/i,
    /<base[\s>]/i,
    /<meta[\s>]/i,
    /<svg[\s>]/i,
    /<animate[\s>]/i,
    /on\w+\s*=/i,
    /javascript\s*:/i,
    /data:text\/html/i,
    /style\s*=\s*["'][^"']*behavior/i,
  ];

  const problems: string[] = [];

  for (const { name, input } of payloads) {
    let output: string;
    try {
      output = cleanArticleHtml(input);
    } catch (err) {
      problems.push(`CRASH on "${name}": ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    for (const re of DANGEROUS) {
      if (re.test(output)) {
        problems.push(`XSS SURVIVED "${name}": pattern ${re} matched output → ${output.slice(0, 120)}`);
      }
    }
  }

  if (problems.length > 0) return fail(...problems);
  return pass(`All ${payloads.length} XSS payloads neutralized by cleanArticleHtml with zero crashes.`);
}

// ---------------------------------------------------------------------------
// Vector 4 — IDOR & RBAC Ownership Enforcement
// ---------------------------------------------------------------------------

function vector4(): VectorResult {
  const problems: string[] = [];

  const idRoute = path.join(ROOT, "app", "api", "articles", "[id]", "route.ts");
  const listRoute = path.join(ROOT, "app", "api", "articles", "route.ts");

  // --- PUT /api/articles/[id] ---
  if (!fs.existsSync(idRoute)) {
    problems.push("app/api/articles/[id]/route.ts not found.");
  } else {
    const src = fs.readFileSync(idRoute, "utf8");

    // Extract the PUT handler block (from "export async function PUT" to next export).
    const putMatch = /export\s+async\s+function\s+PUT[\s\S]*?(?=\nexport\s+async\s+function|\nexport\s|$)/.exec(src);
    if (!putMatch) {
      problems.push("PUT handler not found in app/api/articles/[id]/route.ts.");
    } else {
      const put = putMatch[0];
      if (!/fetchArticleForSession|canEditArticleRest/.test(put)) {
        problems.push("PUT handler lacks ownership check (fetchArticleForSession / canEditArticleRest).");
      }
      if (!/owned\.ok|canEditArticleRest/.test(put)) {
        problems.push("PUT handler does not gate on ownership result.");
      }
    }

    // --- DELETE /api/articles/[id] ---
    const delMatch = /export\s+async\s+function\s+DELETE[\s\S]*?(?=\nexport\s+async\s+function|\nexport\s|$)/.exec(src);
    if (!delMatch) {
      problems.push("DELETE handler not found in app/api/articles/[id]/route.ts.");
    } else {
      const del = delMatch[0];
      if (!/canDeleteArticleRest|user_id/.test(del)) {
        problems.push("DELETE handler lacks ownership verification (canDeleteArticleRest / user_id).");
      }
      if (!/session\.isAdmin|canDeleteArticleRest/.test(del)) {
        problems.push("DELETE handler does not check admin-vs-owner.");
      }
    }
  }

  // --- DELETE /api/articles?id= ---
  if (!fs.existsSync(listRoute)) {
    problems.push("app/api/articles/route.ts not found.");
  } else {
    const src = fs.readFileSync(listRoute, "utf8");
    const delMatch = /export\s+async\s+function\s+DELETE[\s\S]*?(?=\nexport\s+async\s+function|\nexport\s|$)/.exec(src);
    if (!delMatch) {
      problems.push("DELETE handler not found in app/api/articles/route.ts.");
    } else {
      const del = delMatch[0];
      if (!/canDeleteArticleRest|user_id/.test(del)) {
        problems.push("DELETE (list route) lacks ownership verification.");
      }
      if (!/session\.isAdmin|canDeleteArticleRest/.test(del)) {
        problems.push("DELETE (list route) does not check admin-vs-owner.");
      }
    }
  }

  if (problems.length > 0) return fail(...problems);
  return pass("PUT and DELETE handlers enforce ownership: canEditArticleRest / canDeleteArticleRest with admin bypass.");
}

// ---------------------------------------------------------------------------
// Vector 5 — Public-vs-Draft Data Privacy
// ---------------------------------------------------------------------------

function vector5(): VectorResult {
  const problems: string[] = [];

  // 5a. Public read function must filter status=eq.published.
  const restPath = path.join(ROOT, "lib", "supabase-rest.ts");
  if (!fs.existsSync(restPath)) {
    problems.push("lib/supabase-rest.ts not found.");
  } else {
    const src = fs.readFileSync(restPath, "utf8");

    // Find getPublicArticlesLite — must contain status=eq.published.
    const pubFnMatch = /export\s+async\s+function\s+getPublicArticlesLite[\s\S]*?(?=\nexport\s+async\s+function|\nexport\s+function|\nexport\s|$)/.exec(src);
    if (!pubFnMatch) {
      problems.push("getPublicArticlesLite not found in lib/supabase-rest.ts.");
    } else {
      if (!/status.*eq\.published|eq\.published/i.test(pubFnMatch[0])) {
        problems.push("getPublicArticlesLite does NOT filter status=eq.published.");
      }
      if (!/staging-/i.test(pubFnMatch[0])) {
        problems.push("getPublicArticlesLite does NOT exclude staging-* legacy rows.");
      }
    }

    // getArticleByIdLite with publishedOnly=true must also filter.
    const byIdMatch = /export\s+async\s+function\s+getArticleByIdLite[\s\S]*?(?=\nexport\s+async\s+function|\nexport\s+function|\nexport\s|$)/.exec(src);
    if (byIdMatch && !/status.*eq\.published|eq\.published/i.test(byIdMatch[0])) {
      problems.push("getArticleByIdLite does NOT apply status=eq.published filter.");
    }
  }

  // 5b. Public GET /api/articles must strip user_id and sensitive fields.
  const listRoute = path.join(ROOT, "app", "api", "articles", "route.ts");
  if (fs.existsSync(listRoute)) {
    const src = fs.readFileSync(listRoute, "utf8");
    const getMatch = /export\s+async\s+function\s+GET[\s\S]*?(?=\nexport\s+async\s+function|\nexport\s|$)/.exec(src);
    if (!getMatch) {
      problems.push("GET handler not found in app/api/articles/route.ts.");
    } else {
      const get = getMatch[0];
      // The public branch (no scope) must map to a stripped field set.
      if (!/\.map\(/.test(get)) {
        problems.push("Public GET /api/articles does not map/strip response fields.");
      }
      // The explicit stripped fields should be present in the map.
      const hasId = /id:/.test(get);
      const hasTitle = /title:/.test(get);
      if (!hasId || !hasTitle) {
        problems.push("Public GET response mapping incomplete (missing id/title).");
      }
      // Confirm user_id is NOT in the public map block.
      const mapBlock = /articles\.map\([\s\S]*?\)\)/.exec(get);
      if (mapBlock && /user_id/i.test(mapBlock[0])) {
        problems.push("Public GET /api/articles response MAP includes user_id — field leak.");
      }
    }
  }

  if (problems.length > 0) return fail(...problems);
  return pass("Public queries filter status=eq.published + staging-*; public API strips user_id and internal fields.");
}

// ---------------------------------------------------------------------------
// Vector 6 — HTTP Security Headers
// ---------------------------------------------------------------------------

function vector6(): VectorResult {
  const cfgPath = path.join(ROOT, "next.config.ts");
  if (!fs.existsSync(cfgPath)) {
    return fail("next.config.ts not found.");
  }
  const src = fs.readFileSync(cfgPath, "utf8");

  const required: { header: string; pattern: RegExp }[] = [
    { header: "X-Frame-Options", pattern: /X-Frame-Options/i },
    { header: "X-Content-Type-Options", pattern: /X-Content-Type-Options/i },
    { header: "Referrer-Policy", pattern: /Referrer-Policy/i },
  ];

  const problems: string[] = [];
  for (const { header, pattern } of required) {
    if (!pattern.test(src)) {
      problems.push(`next.config.ts: missing required security header "${header}".`);
    }
  }

  // Bonus: CSP should not have unsafe-eval in production context.
  // (isDev conditional is acceptable; just check that unsafe-eval is gated.)
  if (/'unsafe-eval'/.test(src) && !/isDev|NODE_ENV/.test(src)) {
    problems.push("next.config.ts: 'unsafe-eval' in CSP without NODE_ENV gating.");
  }

  if (problems.length > 0) return fail(...problems);
  return pass("X-Frame-Options, X-Content-Type-Options, Referrer-Policy all present. CSP safely gates 'unsafe-eval'.");
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function main() {
  const vectors: { name: string; fn: () => VectorResult }[] = [
    { name: "Vektor 1 — Secrets Exposure", fn: vector1 },
    { name: "Vektor 2 — Edge Runtime Regression Guard", fn: vector2 },
    { name: "Vektor 3 — Anti-XSS Fuzzing (cleanArticleHtml)", fn: vector3 },
    { name: "Vektor 4 — IDOR & RBAC Ownership", fn: vector4 },
    { name: "Vektor 5 — Public vs Draft Data Privacy", fn: vector5 },
    { name: "Vektor 6 — HTTP Security Headers", fn: vector6 },
  ];

  let totalFail = 0;
  const divider = "═".repeat(64);

  console.log(divider);
  console.log("  GentaNusa Automated Security Audit");
  console.log(divider);

  for (const v of vectors) {
    let result: VectorResult;
    try {
      result = v.fn();
    } catch (err) {
      result = fail(`Unhandled crash: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    }

    const badge = result.pass ? "  PASS  " : "  FAIL  ";
    const color = result.pass ? "\x1b[32m" : "\x1b[31m";
    const reset = "\x1b[0m";
    console.log(`\n${color}${badge}${reset} ${v.name}`);
    for (const line of result.findings) {
      const prefix = result.pass ? "         ✓ " : "         ✗ ";
      console.log(`${prefix}${line}`);
    }
    if (!result.pass) totalFail++;
  }

  console.log(`\n${divider}`);
  if (totalFail === 0) {
    console.log(`\x1b[32m  ALL ${vectors.length} VECTORS PASSED — no security regressions detected.\x1b[0m\n`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m  ${totalFail}/${vectors.length} VECTORS FAILED — fix before deploying.\x1b[0m\n`);
    process.exit(1);
  }
}

main();
