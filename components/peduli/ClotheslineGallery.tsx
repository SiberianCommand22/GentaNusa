"use client";

import { useMemo } from "react";
import type { ActivityEvent, PolaroidPhoto } from "@/types/peduli";

type Props = {
  event: ActivityEvent;
  onSelectPhoto: (photo: PolaroidPhoto, index: number) => void;
};

export function ClotheslineGallery({ event, onSelectPhoto }: Props) {
  const photos = event.photos || [];

  const rotations = useMemo(() => {
    return photos.map((photo, idx) => {
      if (typeof photo.rotation_deg === "number") return photo.rotation_deg;
      const seed = photo.id ? photo.id.charCodeAt(0) + idx : idx;
      return ((seed % 7) - 3);
    });
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="relative mx-auto max-w-5xl px-4 py-12">
        <svg viewBox="0 0 1000 200" className="w-full" preserveAspectRatio="none">
          <path
            d="M 0 100 C 250 50, 750 150, 1000 100"
            stroke="#8b7355"
            strokeWidth="4"
            fill="none"
            opacity="0.8"
          />
        </svg>
        <p className="text-center text-slate-400 mt-8">Belum ada foto</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-16">
      <svg viewBox="0 0 1000 220" className="w-full absolute top-0 left-0" preserveAspectRatio="none" style={{ zIndex: 0 }}>
        <path
          d="M 0 110 C 200 60, 400 160, 600 90, 800 140, 1000 110"
          stroke="#8b7355"
          strokeWidth="5"
          fill="none"
          opacity="0.9"
        />
        {[...Array(12)].map((_, i) => (
          <circle key={i} cx={80 + i * 75} cy={110 + (i % 3) * 10 - 10} r="3" fill="#fbbf24" opacity="0.7">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur={`${2 + (i % 5) * 0.2}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
      <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-24" style={{ zIndex: 1 }}>
        {photos.map((photo, idx) => {
          const rot = rotations[idx] ?? 0;
          const src = photo.src || photo.image_url || photo.url || "";
          const alt = photo.alt || photo.caption || photo.note || photo.handwritten_note || "";
          return (
            <button
              key={photo.id || idx}
              onClick={() => onSelectPhoto(photo, idx)}
              className="group relative bg-white p-2 pb-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2"
              style={{ transform: `rotate(${rot}deg)`, transformOrigin: "top center" }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-6 bg-gradient-to-b from-amber-700 to-amber-900 rounded-sm shadow-md" />
              <div className="w-full aspect-square overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="w-full h-full object-cover" />
              </div>
              {photo.handwritten_note && (
                <p className="mt-2 text-xs text-center font-[cursive] text-slate-700 line-clamp-2">
                  {photo.handwritten_note}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
