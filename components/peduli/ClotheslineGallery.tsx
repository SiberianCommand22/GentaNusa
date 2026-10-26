"use client";

import type { PolaroidPhoto } from "@/types/peduli";

type Props = {
  photos: PolaroidPhoto[];
  onSelectPhoto: (photo: PolaroidPhoto, index: number) => void;
};

/** Rotasi bawaan tiap kolom agar tampilan jemuran terasa natural. */
const rotationClasses = ["-rotate-1", "rotate-2", "-rotate-2"];

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
      <div className="relative z-20 flex items-start gap-8 overflow-x-auto no-scrollbar px-8 sm:px-16 py-6 snap-x cursor-grab active:cursor-grabbing">
        {photos.map((photo, idx) => {
          const rotClass = rotationClasses[idx % 3];
          const src = photo.src || photo.image_url || photo.url || "";
          const alt = photo.alt || photo.caption || "Dokumentasi Lapangan";

          return (
            <button
              key={photo.id || idx}
              type="button"
              onClick={() => onSelectPhoto(photo, idx)}
              className={`group shrink-0 w-64 sm:w-72 bg-white p-3.5 pb-6 rounded-sm border border-stone-200/90 shadow-[0_12px_28px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_35px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-2 hover:rotate-0 cursor-pointer snap-center relative ${rotClass}`}
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
                <span className="block font-hand text-xl leading-snug text-center text-stone-800">
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
        })}
      </div>
    </div>
  );
}
