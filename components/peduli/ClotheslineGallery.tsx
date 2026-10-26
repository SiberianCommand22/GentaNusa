"use client";

import type { CSSProperties, ReactNode } from "react";
import type { PolaroidPhoto } from "@/types/peduli";

type Props = {
  photos: PolaroidPhoto[];
  onSelectPhoto: (photo: PolaroidPhoto, index: number) => void;
};

/**
 * Rotasi deterministik (-2.5° s/d +2.5°) dari id foto agar tampilan
 * jemuran natural TANPA hydration mismatch (server & klien sama).
 */
function rotationDeg(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const unit = Math.abs(h % 1000) / 1000;
  return Math.round((unit * 5 - 2.5) * 100) / 100;
}

/** Memo kertas kraft — sela emosional di antara kartu polaroid. */
function FieldMemo({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={`shrink-0 w-60 p-4 snap-center self-start shadow-md rounded-xs ${className}`}
    >
      <p className="font-hand text-sm font-bold uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="font-hand text-lg font-bold text-stone-800 leading-snug mt-1">
        {children}
      </p>
    </div>
  );
}

export function ClotheslineGallery({ photos, onSelectPhoto }: Props) {
  if (!photos || photos.length === 0) {
    return (
      <div className="relative w-full pt-10 pb-16">
        <div className="absolute top-14 left-0 right-0 w-full pointer-events-none z-10">
          <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 1000 30" aria-hidden="true">
            <path d="M 0,15 Q 250,26 500,15 T 1000,15" fill="none" stroke="#9C784E" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="relative z-20 text-center text-stone-400 text-sm pt-10 font-hand text-lg">
          Belum ada foto — tali jemuran sedang menunggu cerita~
        </p>
      </div>
    );
  }

  const cards = photos.map((photo, idx) => {
    const src = photo.src || photo.image_url || photo.url || "";
    const alt = photo.alt || photo.caption || "Dokumentasi Lapangan";
    const rot = rotationDeg(`${photo.id || "foto"}-${idx}`);

    return (
      <button
        key={photo.id || idx}
        type="button"
        onClick={() => onSelectPhoto(photo, idx)}
        style={{ "--rot": `${rot}deg` } as CSSProperties}
        className="group shrink-0 w-64 sm:w-72 bg-white p-3.5 pb-6 rounded-sm border border-stone-200/90 shadow-[0_12px_28px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_35px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-2 hover:rotate-0 cursor-pointer snap-center relative rotate-[var(--rot)]"
      >
        {/* Jepitan Kayu Pinus */}
        <span
          aria-hidden="true"
          className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 w-4 h-9 bg-[#D4A373] rounded-sm shadow-md border-t border-[#FAEDCD] flex flex-col items-center justify-between py-1"
        >
          <span className="w-2.5 h-px bg-[#8C6239] opacity-70" />
          <span className="w-3.5 h-1.5 bg-[#5E3023] rounded-sm shadow-inner" />
          <span className="w-2.5 h-px bg-[#8C6239] opacity-70" />
        </span>

        {/* Bingkai Foto */}
        <span className="relative block aspect-square w-full bg-stone-100 overflow-hidden rounded-sm border border-stone-200/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </span>

        {/* Catatan Tangan Emosional */}
        <span className="block pt-4 px-1 min-h-[56px]">
          <span className="block font-hand text-lg font-bold leading-snug text-center text-stone-800">
            <span className="line-clamp-2">
              {photo.handwritten_note || photo.caption || "Senyum kebersamaan di panti ~"}
            </span>
          </span>
          <span className="flex items-center justify-between text-[10px] text-stone-400 font-mono pt-2 mt-2 border-t border-stone-100">
            <span className="truncate">{photo.photographer || "Tim Liputan"}</span>
            <span className="shrink-0 pl-2">{photo.timestamp || ""}</span>
          </span>
        </span>
      </button>
    );
  });

  // Sela emosional: memo 1 setelah foto ke-2, memo 2 sebelum foto terakhir.
  const nodes: ReactNode[] = [...cards];
  nodes.splice(Math.min(2, nodes.length), 0, (
    <FieldMemo
      key="memo-lapangan"
      className="bg-[#FDF6B2]/95 border border-amber-300 text-stone-800 rotate-1"
      label="Catatan Lapangan"
    >
      Tawa mereka tidak meminta iba, melainkan merindukan kawan bercerita dan
      pelukan hangat seorang saudara.
    </FieldMemo>
  ));
  const lastCardIndex = nodes.lastIndexOf(cards[cards.length - 1]);
  nodes.splice(lastCardIndex, 0, (
    <FieldMemo
      key="memo-adik"
      className="bg-[#FEF08A]/95 border border-amber-300 text-stone-800 -rotate-2"
      label="Pesan Adik Panti"
    >
      &ldquo;Kak, nanti kalau senggang main ke Sukaraja lagi ya...&rdquo; — Kalimat
      sederhana yang membuat langkah pulang terasa berat.
    </FieldMemo>
  ));

  return (
    <div className="relative w-full pt-16 pb-16">
      {/* Tali Rami Alami Memanjang */}
      <div className="absolute top-[70px] left-0 right-0 w-full pointer-events-none z-10">
        <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 30" aria-hidden="true">
          <path
            d="M 0,15 Q 250,26 500,15 T 1000,15"
            fill="none"
            stroke="#9C784E"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 0,16 Q 250,27 500,16 T 1000,16"
            fill="none"
            stroke="#6B4D2B"
            strokeWidth="1"
            strokeDasharray="2,3"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Kontainer Geser Horizontal */}
      <div className="relative z-20 overflow-x-auto flex items-start gap-7 px-8 py-8 no-scrollbar snap-x cursor-grab active:cursor-grabbing">
        {nodes}
      </div>
    </div>
  );
}
