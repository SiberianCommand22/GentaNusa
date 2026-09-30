"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./visual-editor.module.css";

type VisualEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Blok DB (string[] campuran HTML/teks) → satu dokumen HTML untuk kanvas. */
export function blocksToHtml(blocks: string[]): string {
  return (blocks || [])
    .map((b) => {
      const t = String(b ?? "").trim();
      if (!t) return "";
      if (t.includes("<")) return t;
      return `<p>${escapeHtml(t)}</p>`;
    })
    .filter(Boolean)
    .join("");
}

/** HTML kanvas → blok DB (satu string per elemen blok, tanpa nesting dobel). */
export function htmlToBlocks(html: string): string[] {
  if (typeof window === "undefined") return [];
  const out: string[] = [];
  const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return out;
  root.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = (n.textContent || "").trim();
      if (t) out.push(t);
    } else if (n.nodeType === 1) {
      const el = n as Element;
      if (!el.textContent || !el.textContent.trim()) return;
      out.push(el.outerHTML);
    }
  });
  return out;
}

/** Teks polos dari HTML kanvas (untuk validasi & lead otomatis). */
export function htmlToText(html: string): string {
  if (typeof window === "undefined") return String(html || "").replace(/<[^>]*>/g, " ");
  const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

type Active = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  left: boolean;
  center: boolean;
  right: boolean;
  justify: boolean;
  h2: boolean;
  h3: boolean;
  p: boolean;
  quote: boolean;
  ul: boolean;
  ol: boolean;
};

const IDLE: Active = {
  bold: false, italic: false, underline: false, strike: false,
  left: false, center: false, right: false, justify: false,
  h2: false, h3: false, p: false, quote: false, ul: false, ol: false,
};

export function VisualEditor({ value, onChange, placeholder }: VisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtml = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [active, setActive] = useState<Active>(IDLE);

  // Sinkronisasi SATU ARAH: HTML luar → kanvas hanya saat kanvas tidak fokus,
  // sehingga mengetik tidak pernah tertimpa (termasuk saat prefill mode edit).
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = value || "";
    if (next !== lastHtml.current && document.activeElement !== el) {
      el.innerHTML = next;
      lastHtml.current = next;
    }
  }, [value]);

  function emit() {
    const el = editorRef.current;
    if (!el) return;
    lastHtml.current = el.innerHTML;
    onChangeRef.current(el.innerHTML);
  }

  // State aktif toolbar: disegarkan saat seleksi/kursor berubah.
  function refreshActiveFixed() {
    try {
      const q = (cmd: string) => {
        try { return document.queryCommandState(cmd); } catch { return false; }
      };
      let block = "";
      try { block = String(document.queryCommandValue("formatBlock") || "").toLowerCase(); } catch { block = ""; }
      setActive({
        bold: q("bold"),
        italic: q("italic"),
        underline: q("underline"),
        strike: q("strikeThrough"),
        left: q("justifyLeft"),
        center: q("justifyCenter"),
        right: q("justifyRight"),
        justify: q("justifyFull"),
        h2: block === "h2",
        h3: block === "h3",
        p: block === "p" || block === "",
        quote: block === "blockquote",
        ul: q("insertUnorderedList"),
        ol: q("insertOrderedList"),
      });
    } catch {
      // abaikan
    }
  }

  useEffect(() => {
    const onSel = () => {
      const sel = document.getSelection();
      const el = editorRef.current;
      if (sel && el && sel.rangeCount > 0 && el.contains(sel.anchorNode)) refreshActiveFixed();
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  function exec(cmd: string, val?: string) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    try {
      document.execCommand(cmd, false, val ?? "");
    } catch {
      // perintah tidak didukung — abaikan
    }
    emit();
    refreshActiveFixed();
  }

  function onPaste(e: React.ClipboardEvent) {
    // Tempel SELALU sebagai teks polos agar HTML tersimpan tetap bersih.
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    try {
      document.execCommand("insertText", false, text);
    } catch {
      // fallback minimal
      const sel = document.getSelection();
      if (sel && sel.rangeCount > 0) {
        sel.deleteFromDocument();
        sel.getRangeAt(0).insertNode(document.createTextNode(text));
        sel.collapseToEnd();
      }
    }
    emit();
  }

  const btn = (isActive: boolean) => `${styles.toolBtn}${isActive ? ` ${styles.toolBtnActive}` : ""}`;

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar} role="toolbar" aria-label="Format teks">
        <span className={styles.toolGroup}>
          <button type="button" className={btn(active.bold)} onClick={() => exec("bold")} title="Tebal"><strong>B</strong></button>
          <button type="button" className={btn(active.italic)} onClick={() => exec("italic")} title="Miring"><em>I</em></button>
          <button type="button" className={btn(active.underline)} onClick={() => exec("underline")} title="Garis bawah"><u>U</u></button>
          <button type="button" className={btn(active.strike)} onClick={() => exec("strikeThrough")} title="Coret"><s>S</s></button>
        </span>
        <span className={styles.toolGroup}>
          <button type="button" className={btn(active.left)} onClick={() => exec("justifyLeft")} title="Rata kiri">≡←</button>
          <button type="button" className={btn(active.center)} onClick={() => exec("justifyCenter")} title="Rata tengah">≡</button>
          <button type="button" className={btn(active.right)} onClick={() => exec("justifyRight")} title="Rata kanan">→≡</button>
          <button type="button" className={btn(active.justify)} onClick={() => exec("justifyFull")} title="Rata kiri-kanan (justify)">≣</button>
        </span>
        <span className={styles.toolGroup}>
          <button type="button" className={btn(active.h2)} onClick={() => exec("formatBlock", "h2")} title="Heading 2">H2</button>
          <button type="button" className={btn(active.h3)} onClick={() => exec("formatBlock", "h3")} title="Heading 3">H3</button>
          <button type="button" className={btn(active.p)} onClick={() => exec("formatBlock", "p")} title="Paragraf biasa">¶</button>
          <button type="button" className={btn(active.quote)} onClick={() => exec("formatBlock", "blockquote")} title="Kutipan">“</button>
          <button type="button" className={btn(active.ul)} onClick={() => exec("insertUnorderedList")} title="Bullet list">•</button>
          <button type="button" className={btn(active.ol)} onClick={() => exec("insertOrderedList")} title="Numbered list">1.</button>
        </span>
      </div>
      <div
        ref={editorRef}
        className={styles.canvas}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || "Tulis isi berita di sini…"}
        onInput={emit}
        onKeyUp={refreshActiveFixed}
        onMouseUp={refreshActiveFixed}
        onPaste={onPaste}
        role="textbox"
        aria-multiline="true"
        aria-label="Isi artikel"
      />
    </div>
  );
}
