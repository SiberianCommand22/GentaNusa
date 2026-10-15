/**
 * Sanitasi backend — SATU-SATUNYA sanitizer yang boleh dipakai Serverless
 * Functions (`POST /api/articles`, `PUT /api/articles/[id]`).
 *
 * Modul ini HANYA mengimpor `lib/sanitize-regex.ts` (murni string/regex,
 * nol dependensi DOM/jsdom), sehingga bundel server TIDAK PERNAH menyentuh
 * `isomorphic-dompurify`/`jsdom` dan `Error [ERR_REQUIRE_ESM]` tidak
 * mungkin terjadi saat publikasi artikel.
 *
 * Normalisasi `content` (string JSON | string HTML | string[]) dan batas
 * anti-abuse IDENTIK dengan `sanitizeContentInput` — hanya fungsi
 * pembersihnya yang regex-murni (`cleanArticleHtml`).
 */
import {
  cleanArticleHtml,
  decodeEscapedHtml,
  MAX_BLOCKS,
  MAX_BLOCK_CHARS,
} from "./sanitize-regex";

export { cleanArticleHtml };

/**
 * Sanitasi input `content` artikel (string | string[]) sebelum simpan DB.
 * Kembalikan null bila tipe input tidak dikenali.
 */
export function sanitizeContentInputServer(content: unknown): string[] | null {
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
    const clean = decoded.includes("<") ? cleanArticleHtml(decoded) : raw;
    out.push(clean.slice(0, MAX_BLOCK_CHARS));
  }
  return out;
}
