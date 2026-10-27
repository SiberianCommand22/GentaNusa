"use client";

import { useEffect } from "react";
import type { PolaroidPhoto } from "@/types/peduli";

type Props = {
  photos: PolaroidPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
};

export function StoryLightboxModal({ photos, currentIndex, onClose, onNavigate }: Props) {
  const photo = photos[currentIndex];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((currentIndex - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") onNavigate((currentIndex + 1) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [currentIndex, photos.length, onClose, onNavigate]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-sm" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl transition-colors"
        aria-label="Tutup"
      >
        &times;
      </button>
      <button
        onClick={() => onNavigate((currentIndex - 1 + photos.length) % photos.length)}
        className="absolute left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl leading-none transition-colors"
        aria-label="Sebelumnya"
      >
        &lsaquo;
      </button>
      <button
        onClick={() => onNavigate((currentIndex + 1) % photos.length)}
        className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl leading-none transition-colors"
        aria-label="Selanjutnya"
      >
        &rsaquo;
      </button>
      <div
        className="relative max-w-3xl w-full bg-white border border-stone-200/80 p-3 pb-6 md:p-4 md:pb-12 shadow-2xl flex flex-col md:flex-row md:items-start"
        style={{ transform: "rotate(-1deg)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.alt || ""}
          className="w-full max-h-[45vh] md:max-h-[70vh] md:w-1/2 object-contain bg-stone-100 shrink-0"
        />
        {(photo.story_title || photo.handwritten_note || photo.caption || photo.photographer) && (
          <div className="mt-4 md:mt-0 md:ml-5 md:flex-1 md:overflow-y-auto text-center px-2 max-h-[40vh] overflow-y-auto md:max-h-none">
            {photo.story_title && (
              <h3 className="font-editorial text-lg font-semibold text-slate-900 mb-2">
                {photo.story_title}
              </h3>
            )}
            {(photo.story_description || photo.handwritten_note || photo.caption) && (
              <p className="font-hand text-xl text-stone-700 leading-snug">
                {photo.story_description || photo.handwritten_note || photo.caption}
              </p>
            )}
            {photo.quote_text && (
              <blockquote className="font-editorial mt-3 italic text-stone-600">
                &ldquo;{photo.quote_text}&rdquo;
                {photo.quote_author && <cite className="block text-xs mt-1 not-italic">&mdash; {photo.quote_author}</cite>}
              </blockquote>
            )}
            {/* Kredit liputan: fotografer + waktu jepretan */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-mono text-stone-400">
              <span>{photo.photographer || "Tim Liputan GentaNusa"}</span>
              {photo.timestamp && (
                <>
                  <span aria-hidden="true">&bull;</span>
                  <span>{photo.timestamp}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
