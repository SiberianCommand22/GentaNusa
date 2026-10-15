/**
 * Sanitizer HTML bersama — 100% REGEX, NOL dependensi DOM/jsdom.
 *
 * Kebijakan allowlist tunggal untuk seluruh render + penyimpanan konten:
 * dipakai oleh `components/article-content.tsx` (render publik),
 * `components/visual-editor.tsx` (kanvas editor),
 * `components/post-editor.tsx` (via `sanitizeContentInput`), dan —
 * melalui `lib/sanitize-server.ts` — rute API `POST /api/articles` /
 * `PUT /api/articles/[id]`.
 *
 * `isomorphic-dompurify`/`dompurify`/`jsdom` SUDAH DICABUT TOTAL dari
 * codebase: dependensi menghapusnya agar Webpack tidak lagi membundel
 * jejak `jsdom`/`html-encoding-sniffer` ke Vercel Serverless Functions
 * (penyebab `Error [ERR_REQUIRE_ESM]` → HTTP 500 saat publikasi).
 * Seluruh sanitasi memakai `lib/sanitize-regex.ts` (allowlist ketat:
 * tag, href/src https-or-relatif, class, rel noopener+noreferrer,
 * strip <script>/<style>/<iframe> beserta isi, buang on*= total).
 */
import {
  cleanArticleHtml,
  decodeEscapedHtml,
  MAX_BLOCKS,
  MAX_BLOCK_CHARS,
} from "./sanitize-regex";

// Kompatibilitas impor lama (`article-content.tsx`): teruskan helper regex.
export { decodeEscapedHtml };

export function sanitizeHtml(html: string): string {
  const input = String(html ?? "");
  if (!input) return "";
  try {
    // Identik dengan jalur backend (`cleanArticleHtml`) — satu kebijakan,
    // satu output, di semua lingkungan (browser, prerender, serverless).
    return cleanArticleHtml(input);
  } catch {
    return "";
  }
}

/**
 * Sanitasi input `content` artikel (string | string[]) — dipakai
 * `components/post-editor.tsx`. Kebijakan & batas IDENTIK dengan
 * `sanitizeContentInputServer` (satu implementasi regex yang sama).
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
