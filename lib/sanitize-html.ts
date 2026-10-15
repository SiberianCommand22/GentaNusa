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

// Whitelist tag editorial aman (spesifikasi hardening XSS media).
const DOMPURIFY_TAGS = [
  "p", "b", "i", "em", "strong", "a",
  "h1", "h2", "h3", "h4", "ul", "ol", "li",
  "blockquote", "img", "figure", "figcaption", "br", "hr", "span",
];

const DOMPURIFY_ATTR = [
  "href", "src", "alt", "title", "target", "rel", "class", "width", "height",
];

// Tag yang boleh lolos sanitasi (sama persis dengan allowlist DOMPurify).
const SAFE_TAGS = new Set([
  "p", "b", "i", "em", "strong", "a",
  "h1", "h2", "h3", "h4", "ul", "ol", "li",
  "blockquote", "img", "figure", "figcaption", "br", "hr", "span",
]);

// Token class yang diizinkan (subset aman ala prose, tanpa Tailwind).
const SAFE_CLASSES = new Set([
  "text-left",
  "text-center",
  "text-right",
  "text-justify",
  "leading-relaxed",
  "border-l-4",
  "border-[#041d56]",
  "pl-4",
  "pl-5",
  "pr-4",
  "py-3",
  "my-2",
  "my-6",
  "rounded-r-xl",
  "bg-blue-50/50",
  "text-base",
  "text-lg",
  "sm:text-lg",
  "text-slate-800",
  "font-serif",
  "italic",
  "text-blue-600",
  "underline",
]);

const FORBIDDEN = /javascript:|data:text\/html|<script|on\w+=/gi;

function cleanAttrs(tag: string, name: string, attrs: string): string {
  let out = "";
  const href = attrs.match(/href\s*=\s*"([^"]*)"/i);
  if (name === "a" && href && (/^https?:\/\//i.test(href[1]) || href[1].startsWith("/"))) {
    out += ` href="${href[1]}"`;
    // target/rel hanya nilai aman: target dibatasi _blank/_self, rel ke
    // token allowlist (mencegah rel="opener" dsb). Seluruh link <a> otomatis
    // mendapat rel="noopener noreferrer" (anti reverse-tabnabbing XSS).
    const target = attrs.match(/target\s*=\s*"([^"]*)"/i);
    let isBlank = false;
    if (target && /^\s*_(blank|self)\s*$/i.test(target[1])) {
      const t = target[1].trim().toLowerCase();
      out += ` target="${t}"`;
      isBlank = t === "_blank";
    }
    const rel = attrs.match(/rel\s*=\s*"([^"]*)"/i);
    const kept = new Set<string>(["noopener", "noreferrer"]);
    if (rel) {
      for (const t of rel[1].split(/[\s,]+/).map((s) => s.trim().toLowerCase())) {
        if (["noopener", "noreferrer", "nofollow", "ugc", "sponsored"].includes(t)) kept.add(t);
      }
    }
    // Eksternal (http...) selalu bawa noopener+noreferrer walau tanpa target.
    if (isBlank || /^https?:\/\//i.test(href[1])) {
      kept.add("noopener");
      kept.add("noreferrer");
    }
    out += ` rel="${[...kept].join(" ")}"`;
  }
  // Gambar: src https/relatif saja (tolak javascript:/data:text/html),
  // alt/title/width/height lolos; class difilter allowlist di bawah.
  if (name === "img") {
    const src = attrs.match(/src\s*=\s*"([^"]*)"/i);
    if (src && (/^https?:\/\//i.test(src[1]) || src[1].startsWith("/") || src[1].startsWith("blob:") || src[1].startsWith("data:image/"))) {
      if (!/^javascript:/i.test(src[1])) out += ` src="${src[1]}"`;
    }
    const alt = attrs.match(/alt\s*=\s*"([^"]*)"/i);
    if (alt) out += ` alt="${alt[1].slice(0, 300)}"`;
    const title = attrs.match(/title\s*=\s*"([^"]*)"/i);
    if (title) out += ` title="${title[1].slice(0, 300)}"`;
    for (const dim of ["width", "height"] as const) {
      const m = attrs.match(new RegExp(`${dim}\\s*=\\s*"([^"]*)"`, "i"));
      if (m && /^\d{1,4}$/.test(m[1].trim())) out += ` ${dim}="${m[1].trim()}"`;
    }
  }
  // Inline style diloloskan HANYA untuk perataan teks toolbar
  // (text-align + text-justify). Deklarasi lain dibuang agar aman.
  const style = attrs.match(/style\s*=\s*"([^"]*)"/i);
  if (style && (name === "p" || name === "h2" || name === "h3" || name === "blockquote")) {
    const kept = style[1]
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .filter(
        (d) =>
          /^text-align\s*:\s*(left|center|right|justify)$/i.test(d) ||
          /^text-justify\s*:\s*inter-word$/i.test(d)
      );
    if (kept.length > 0) out += ` style="${kept.join("; ")};"`;
  }
  const cls = attrs.match(/class\s*=\s*"([^"]*)"/i);
  if (cls) {
    const kept = cls[1].split(/\s+/).filter((t) => SAFE_CLASSES.has(t));
    if (kept.length > 0) out += ` class="${kept.join(" ")}"`;
  }
  return `<${tag}${out}`;
}

// Parser tag ringan: tag tak dikenal dibuang (isi dipertahankan),
// atribut disaring ketat. Blok komentar & doctype dibuang.
function regexScrub(html: string): string {
  return html
    .replace(FORBIDDEN, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>/g, (full, rawName: string, attrs: string) => {
      const closing = full.startsWith("</");
      const name = rawName.toLowerCase();
      if (!SAFE_TAGS.has(name)) return "";
      if (closing) return `</${name}>`;
      if (full.endsWith("/>")) return `${cleanAttrs(name, name, attrs)}/>`;
      return cleanAttrs(name, name, attrs) + ">";
    });
}

// Strip konten AKTIF beserta isinya (fallback tidak punya parser DOM —
// regexScrub di bawah hanya membuang tag tapi mempertahankan isi teks,
// yang berbahaya untuk <script>/<style>/<iframe>). Dipakai HANYA di jalur
// fallback agar 500 lenyap tanpa melemahkan Lapis 1.
function stripActiveContent(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style\s*>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi, "");
}

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

// Blok yang terlanjur tersimpan sebagai entitas escape (`&lt;p ...&gt;`)
// didekode kembali menjadi HTML sebelum sanitasi agar tidak tampil mentah.
export function decodeEscapedHtml(block: string): string {
  if (!block.includes("&lt;")) return block;
  return block
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

// Batas anti-abuse: murah untuk editor sah, mahal untuk spam bloat.
const MAX_BLOCKS = 1000;
const MAX_BLOCK_CHARS = 100_000;

/**
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
