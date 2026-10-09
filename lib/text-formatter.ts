/**
 * Text Formatter — Modul pembersih teks naskah redaksi GentaNusa.
 *
 * Fungsi:
 * 1. Normalisasi spasi (spasi ganda → tunggal, trim whitespace)
 * 2. Rapikan tanda baca (spasi sebelum koma/titik/titik dua)
 * 3. Batasi baris kosong bertumpuk (max 2 newline beruntun)
 * 3. Parsing konten artikel → array blok paragraf + deteksi kutipan
 */

export interface ArticleBlock {
  type: "paragraph" | "quote";
  content: string;
}

/**
 * Membersihkan teks mentah dari toolbar editor:
 * - Spasi ganda → spasi tunggal
 * - Spasi sebelum tanda baca (koma, titik, titik dua, titik koma)
 * - Trim whitespace di awal/akhir baris
 * - Batasi newline bertumpuk (max 2)
 */
export function cleanText(raw: string): string {
  if (!raw) return "";

  return String(raw)
    // Normalisasi entitas HTML dasar
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")

    // Hapus tag HTML sisa (kecuali yang diizinkan nanti di renderer)
    .replace(/<\/?(p|br|div|span|strong|em|b|i|u|a|ul|ol|li|blockquote|h[1-6])[^>]*>/gi, "")

    // Rapikan spasi sebelum tanda baca
    .replace(/\s+([.,:;!?)}\]])/g, "$1")
    .replace(/\s+([,.;:!?)}\]])/g, "$1")

    // Rapikan spasi setelah tanda buka kurung/tanda petik
    .replace(/([\(\[\{„"“‘])\s+/g, "$1")

    // Normalisasi spasi ganda di dalam kalimat
    .replace(/[ \t]{2,}/g, " ")

    // Trim whitespace di awal/akhir setiap baris
    .split("\n")
    .map((line) => line.trim())
    .join("\n")

    // Batasi newline bertumpuk (max 2 newline beruntun = 1 paragraph break)
    .replace(/\n{3,}/g, "\n\n")

    // Trim whitespace di awal/akhir string
    .trim();
}

/**
 * Memecah konten artikel menjadi array blok paragraf.
 * Mendeteksi kutipan narasumber (diawali tanda petik atau >) → type: 'quote'
 */
export function parseArticleContent(content: string): Array<{ type: "paragraph" | "quote"; content: string }> {
  if (!content) return [];

  const cleaned = cleanText(content);

  // Pecah berdasarkan double newline (paragraph break)
  const paragraphs = cleaned
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return paragraphs.map((p) => {
    // Deteksi kutipan: diawali tanda petik ganda, petik satu, kurung miring, atau >
    const trimmed = p.trimStart();
    const isQuote =
      trimmed.startsWith('"') ||
      trimmed.startsWith("“") ||
      trimmed.startsWith("‘") ||
      trimmed.startsWith(">") ||
      trimmed.startsWith("»") ||
      /^—\s/.test(trimmed); // dash em dash di awal

    return {
      type: isQuote ? "quote" : "paragraph",
      content: p,
    };
  });
}

/**
 * Membersihkan dan memformat lead/excerpt (single paragraph)
 */
export function cleanLead(raw: string): string {
  return cleanText(raw).split("\n\n")[0]?.trim() || "";
}

/**
 * Membersihkan title/judul
 */
export function cleanTitle(raw: string): string {
  return cleanText(raw)
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * MODUL 2 — Sanitasi editorial naskah lama (pembersihan spasi & jarak kata).
 * Dipakai di app/[slug]/page.tsx SEBELUM naskah dipecah menjadi paragraf,
 * sehingga artikel lama dengan spasi berantakan otomatis rapi saat tampil.
 */
export function sanitizeEditorialText(rawText: string): string {
  if (!rawText) return "";

  return rawText
    // Normalisasi karakter spasi tak terlihat & non-breaking spaces
    .replace(/[  ᠎ -   　﻿]/g, ' ')
    // Hapus tab dan spasi ganda berulang di tengah kalimat
    .replace(/[ \t]+/g, " ")
    // Hapus spasi liar sebelum tanda baca (contoh: "pemerintah , kata" -> "pemerintah, kata")
    .replace(/ +([,\.!?:;])/g, "$1")
    // Pastikan ada spasi tunggal setelah tanda baca jika langsung diikuti huruf/angka
    .replace(/([,\.!?:;])([A-Za-z0-9])/g, "$1 $2")
    // Normalisasi pemisah baris baru antar-paragraf
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Membersihkan excerpt/ringkasan
 */
export function cleanExcerpt(raw: string): string {
  return cleanText(raw)
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}