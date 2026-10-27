"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PolaroidPhoto } from "@/types/peduli";

type Props = {
  photos: PolaroidPhoto[];
  onSelectPhoto: (photo: PolaroidPhoto, index: number) => void;
};

/** Deret rotasi polaroid — natural, deterministik (aman hydration). */
const ROTATIONS = [-2.5, 3, -1.8, 2.2, -3] as const;

/** Kecepatan marquee dalam px/frame (arah kiri, ~30px/detik pada 60fps). */
const MARQUEE_SPEED = 0.5;
/** Jarak geser minimal (px) sebelum klik kartu dibatalkan. */
const DRAG_THRESHOLD = 6;
/** Lompatan per klik tombol panah (px). */
const ARROW_STEP_PX = 320;
/** Jarak antar salinan konten (gap-7 = 1.75rem). */
const TRACK_GAP_PX = 28;

/**
 * Memo kertas kraft — sela emosional di antara kartu polaroid.
 */
function FieldMemo({
  className,
  label,
  children,
}: {
  className: string;
  label: string;
  children: ReactNode;
}) {
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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  /** Offset translate3d dalam satu salinan konten (modulo lebar salinan). */
  const offsetRef = useRef(0);
  /** Lebar satu salinan konten + gap (px); 0 = belum terukur. */
  const copyWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const rafRef = useRef(0);
  const dragRef = useRef({ startX: 0, startOffset: 0, moved: 0, pointerId: -1 });

  const [reducedMotion, setReducedMotion] = useState(false);

  /* Ukur ulang lebar salinan saat layout/font berubah. */
  const measure = useCallback(() => {
    const first = trackRef.current?.children[0];
    if (!first) {
      copyWidthRef.current = 0;
      return;
    }
    copyWidthRef.current = first.getBoundingClientRect().width + TRACK_GAP_PX;
    // Jaga offset tetap di dalam satu salinan agar wrap mulus.
    if (copyWidthRef.current > 0) {
      offsetRef.current = ((offsetRef.current % copyWidthRef.current) + copyWidthRef.current) % copyWidthRef.current;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion || photos.length === 0) return;

    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);

    const tick = () => {
      if (
        !pausedRef.current &&
        !draggingRef.current &&
        copyWidthRef.current > 0 &&
        trackRef.current
      ) {
        offsetRef.current = (offsetRef.current + MARQUEE_SPEED) % copyWidthRef.current;
        trackRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [reducedMotion, photos.length, measure]);

  /** Lompat offset searah maju (arah 1) atau mundur (arah -1), wrap modulo. */
  const step = useCallback((dir: 1 | -1) => {
    const w = copyWidthRef.current;
    if (w <= 0) return;
    offsetRef.current = (((offsetRef.current + dir * ARROW_STEP_PX) % w) + w) % w;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
    }
  }, []);

  /* ── Drag manual (pointer) ── */

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    pausedRef.current = true;
    suppressClickRef.current = false;
    dragRef.current = {
      startX: e.clientX,
      startOffset: offsetRef.current,
      moved: 0,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current.moved = Math.max(dragRef.current.moved, Math.abs(dx));
    if (dragRef.current.moved > DRAG_THRESHOLD) {
      suppressClickRef.current = true;
    }
    const w = copyWidthRef.current;
    let next = dragRef.current.startOffset - dx;
    if (w > 0) next = ((next % w) + w) % w;
    offsetRef.current = next;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-next}px,0,0)`;
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragRef.current.pointerId !== e.pointerId) return;
    draggingRef.current = false;
    pausedRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  /** Abaikan klik yang mengikuti drag (>6px) agar tidak membuka lightbox. */
  const handleCardClick = (photo: PolaroidPhoto, idx: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onSelectPhoto(photo, idx);
  };

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
    const rot =
      typeof photo.rotation_deg === "number" && photo.rotation_deg !== 0
        ? photo.rotation_deg
        : ROTATIONS[idx % ROTATIONS.length];

    return (
      <button
        key={photo.id || idx}
        type="button"
        onClick={() => handleCardClick(photo, idx)}
        style={{ "--rot": `${rot}deg` } as CSSProperties}
        className="group shrink-0 w-64 sm:w-72 bg-white p-3.5 pb-6 rounded-sm border border-stone-200/90 shadow-[0_12px_28px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_35px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-4 hover:scale-105 hover:rotate-0 hover:shadow-2xl hover:z-30 cursor-pointer snap-center relative rotate-[var(--rot)]"
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
            draggable={false}
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

  // Tiga memo kraft sebagai sela emosional di antara kartu.
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
  const midIndex = Math.min(5, nodes.length);
  nodes.splice(midIndex, 0, (
    <FieldMemo
      key="memo-jejak"
      className="bg-[#FDE68A]/90 border border-amber-400 text-stone-800 -rotate-1"
      label="Jejak Kebaikan"
    >
      Satu berkas foto, seribu cerita: setiap jepitan di tali ini menyimpan
      janji untuk kembali.
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

  const arrowBtn =
    "absolute top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white shadow-xl border border-stone-200 text-stone-700 hover:scale-110 active:scale-95 rounded-full p-3.5 backdrop-blur transition-all duration-200";

  return (
    <div className="relative w-full pt-16 pb-16 group/jemuran">
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

      {/* Tombol Panah Navigasi */}
      <button
        type="button"
        onClick={() => step(-1)}
        className={`${arrowBtn} left-2 sm:left-4`}
        aria-label="Geser jemuran ke kiri"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        className={`${arrowBtn} right-2 sm:right-4`}
        aria-label="Geser jemuran ke kanan"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Viewport Marquee / Geser */}
      {reducedMotion ? (
        /* prefers-reduced-motion: tanpa autoplay, gulir manual saja. */
        <div className="relative z-20 overflow-x-auto flex items-start gap-7 px-8 py-8 no-scrollbar snap-x cursor-grab active:cursor-grabbing">
          {nodes}
        </div>
      ) : (
        <div
          ref={viewportRef}
          className="relative z-20 overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none"
          onPointerEnter={() => {
            pausedRef.current = true;
          }}
          onPointerLeave={() => {
            if (!draggingRef.current) pausedRef.current = false;
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* Dua salinan konten → wrap mulus saat offset modulo lebar salinan. */}
          <div
            ref={trackRef}
            className="flex items-start gap-7 px-8 py-8 w-max will-change-transform"
          >
            <div className="flex items-start gap-7 shrink-0">{nodes}</div>
            <div className="flex items-start gap-7 shrink-0" aria-hidden="true">
              {nodes}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
