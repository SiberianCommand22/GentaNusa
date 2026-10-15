/**
 * Sanitizer HTML bersama (server-safe: DOMPurify isomorphic + regex lapis-2).
 *
 * Kebijakan allowlist tunggal untuk seluruh render + penyimpanan konten:
 * dipakai oleh `components/article-content.tsx` (render publik),
 * `components/visual-editor.tsx` (kanvas editor), dan rute API
 * `POST /api/articles` / `PUT /api/articles/[id]` (sanitasi server-side
 * sebelum tulis DB — titik kepercayaan terakhir).
 *
 * Lapis 1 (utama): DOMPurify (isomorphic-dompurify, aman SSR + browser)
 * dengan whitelist tag/atribut editorial media. PENTING: isomorphic-dompurify
 * TIDAK BOLEH diimpor statis di top-level — entry server-nya me-require
 * `jsdom` (rantai lru-cache ESM-only) dan meledak dengan
 * `Error [ERR_REQUIRE_ESM]: Failed to load external module jsdom` tepat
 * saat modul dimuat di Vercel Serverless, SEBELUM try/catch mana pun sempat
 * berjalan (itulah HTTP 500 saat publikasi artikel). Pemuatan dilakukan
 * MALAS saat dipanggil di dalam try/catch (`loadPurifier`); bila gagal,
 * sanitasi jatuh ke Lapis 2 (regex ketat + strip konten aktif) dan API
 * TIDAK PERNAH crash.
 * Lapis 2 (defense-in-depth): filter regex lama — menegakkan href https/relatif,
 * rel noopener+noreferrer otomatis, dan class allowlist.
 */
type DomPurifier = {
  sanitize: (
    dirty: string,
    config?: Record<string, unknown>
  ) => string | unknown;
};

// undefined = belum dicoba; null = gagal / tidak tersedia (pakai fallback).
let purifierCache: DomPurifier | null | undefined;

/**
 * Muat DOMPurify secara malas dan aman. Tidak pernah melempar:
 * mengembalikan null bila `require` tak tersedia (Edge) atau rantai
 * jsdom gagal dimuat di serverless (ERR_REQUIRE_ESM).
 */
function loadPurifier(): DomPurifier | null {
  if (purifierCache !== undefined) return purifierCache;
  purifierCache = null;
  try {
    if (typeof require === "function") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("isomorphic-dompurify") as
        | ({ default?: DomPurifier } & Partial<DomPurifier>)
        | null
        | undefined;
      const candidate = mod?.default ?? mod;
      if (
        candidate &&
        typeof (candidate as Partial<DomPurifier>).sanitize === "function"
      ) {
        purifierCache = candidate as DomPurifier;
      }
    }
  } catch (e) {
    // jsdom gagal dimuat di serverless: JANGAN crash — Lapis 2 menutup XSS.
    console.warn("Server-side DOMPurify warning (bypassed safely):", e);
    purifierCache = null;
  }
  return purifierCache;
}

import {
  decodeEscapedHtml,
  MAX_BLOCKS,
  MAX_BLOCK_CHARS,
  regexScrub,
  stripActiveContent,
} from "./sanitize-regex";

// Kompatibilitas impor lama (`article-content.tsx`): teruskan helper regex.
export { decodeEscapedHtml };

// Whitelist tag editorial aman (spesifikasi hardening XSS media).
const DOMPURIFY_TAGS = [
  "p", "b", "i", "em", "strong", "a",
  "h1", "h2", "h3", "h4", "ul", "ol", "li",
  "blockquote", "img", "figure", "figcaption", "br", "hr", "span",
];

const DOMPURIFY_ATTR = [
  "href", "src", "alt", "title", "target", "rel", "class", "width", "height",
];

export function sanitizeHtml(html: string): string {
  const input = String(html ?? "");
  if (!input) return "";
  // Lapis 1: DOMPurify — parser DOM sungguhan (tahan mutasi XSS yang
  // lolos regex: SVG/math, style expression, event handler non-standar).
  // Seluruh <a> dipaksa membawa rel noopener+noreferrer pasca-sanitasi.
  // loadPurifier() tidak pernah melempar (null bila jsdom gagal dimuat).
  try {
    const purifier = loadPurifier();
    if (purifier) {
      const purified = purifier.sanitize(input, {
        ALLOWED_TAGS: DOMPURIFY_TAGS,
        ALLOWED_ATTR: DOMPURIFY_ATTR,
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button", "svg", "math", "link", "meta", "base"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "style"],
      });
      const withRel = String(purified).replace(/<a\b([^<>]*)>/gi, (tag) => {
        if (/rel\s*=/i.test(tag)) {
          return tag.replace(/rel\s*=\s*"([^"]*)"/i, (_m, v: string) => {
            const kept = new Set<string>(["noopener", "noreferrer"]);
            for (const t of String(v).split(/[\s,]+/).map((s) => s.trim().toLowerCase())) {
              if (["noopener", "noreferrer", "nofollow", "ugc", "sponsored"].includes(t)) kept.add(t);
            }
            return `rel="${[...kept].join(" ")}"`;
          });
        }
        return tag.replace(/<a\b/i, '<a rel="noopener noreferrer"');
      });
      // Lapis 2: scrub regex (href/src/class allowlist ketat).
      return regexScrub(withRel);
    }
    // Fallback: DOMPurify tak tersedia (jsdom gagal di serverless) —
    // strip konten aktif lalu scrub regex ketat. Anti-crash, tetap anti-XSS.
    return regexScrub(stripActiveContent(input));
  } catch {
    return regexScrub(stripActiveContent(input));
  }
}

/**
 * Sanitasi input `content` artikel (string | string[]) — varian CLIENT
 * (dipakai `components/post-editor.tsx`). Kebijakan & batas IDENTIK dengan
 * `sanitizeContentInputServer`; hanya pembersih HTML-nya memakai Lapis 1+2
 * (DOMPurify bila tersedia di browser, regex ketat bila tidak).
 * Sanitasi input `content` artikel (string | string[]) sebelum simpan DB.
 *
 * Editor CMS mengirim `content` sebagai STRING JSON (`JSON.stringify(paras)`)
 * — string itu WAJIB di-parse dulu; membungkusnya mentah sebagai satu blok
 * membuat halaman publik hanya menampilkan lead (blok pertama "JSON"
 * terbuang sebagai fallback lead, body kosong). String HTML polos (bukan
 * JSON) tetap diperlakukan sebagai satu blok.
 *
 * Blok teks polos dikembalikan apa adanya; blok ber-HTML disanitasi dengan
 * kebijakan yang SAMA persis dengan jalur render. Kembalikan null bila tipe
 * input tidak dikenali.
 */
export function sanitizeContentInput(content: unknown): string[] | null {
  let list: unknown[];
  if (Array.isArray(content)) {
    list = content;
  } else if (typeof content === "string") {
    const trimmed = content.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || trimmed === "") {
      try {
        const parsed: unknown = JSON.parse(trimmed === "" ? "[]" : trimmed);
        if (Array.isArray(parsed)) {
          list = parsed;
        } else {
          list = [content];
        }
      } catch {
        list = [content];
      }
    } else {
      list = [content];
    }
  } else {
    return null;
  }
  const out: string[] = [];
  for (const raw of list.slice(0, MAX_BLOCKS)) {
    if (typeof raw !== "string") continue;
    const decoded = decodeEscapedHtml(raw);
    const clean = decoded.includes("<") ? sanitizeHtml(decoded) : raw;
    out.push(clean.slice(0, MAX_BLOCK_CHARS));
  }
  return out;
}
