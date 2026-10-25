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
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl z-10"
        aria-label="Tutup"
      >
        ×
      </button>
      <button
        onClick={() => onNavigate((currentIndex - 1 + photos.length) % photos.length)}
        className="absolute left-4 text-white text-4xl z-10"
        aria-label="Sebelumnya"
      >
        ‹
      </button>
      <button
        onClick={() => onNavigate((currentIndex + 1) % photos.length)}
        className="absolute right-4 text-white text-4xl z-10"
        aria-label="Selanjutnya"
      >
        ›
      </button>
      <div className="relative max-w-3xl w-full bg-white p-4 pb-12 shadow-2xl" style={{ transform: "rotate(-1deg)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt || ""} className="w-full h-auto max-h-[70vh] object-contain bg-slate-100" />
        {(photo.story_title || photo.handwritten_note || photo.caption) && (
          <div className="mt-4 text-center">
            {photo.story_title && <h3 className="text-lg font-semibold text-slate-900 mb-2">{photo.story_title}</h3>}
            <p className="text-sm text-slate-700 font-[cursive]">{photo.story_description || photo.handwritten_note || photo.caption}</p>
            {photo.quote_text && (
              <blockquote className="mt-3 italic text-slate-600">
                &ldquo;{photo.quote_text}&rdquo;
                {photo.quote_author && <cite className="block text-xs mt-1">&mdash; {photo.quote_author}</cite>}
              </blockquote>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
