"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClotheslineGallery } from "@/components/peduli/ClotheslineGallery";
import { StoryLightboxModal } from "@/components/peduli/StoryLightboxModal";
import { OrphanageProfileCard } from "@/components/peduli/OrphanageProfileCard";
import { ActivityTimelineNav } from "@/components/peduli/ActivityTimelineNav";
import { Heart, Sparkles, MapPin, Users, PackageCheck } from "lucide-react";
import type { ActivityEvent, PolaroidPhoto } from "@/types/peduli";

const placeholderEvent: ActivityEvent = {
  id: "placeholder-1",
  slug: "dokumentasi-lapangan-sedang-disiapkan",
  title: "Dokumentasi Lapangan Sedang Disiapkan",
  date_label: "Segera Hadir",
  orphanage_name: "GentaNusa Peduli",
  location_city: "Indonesia",
  location: "Indonesia",
  headline: "Catatan Jurnalis: Dokumentasi Lapangan Sedang Disiapkan untuk Rilis Sore Ini",
  summary:
    "Tim liputan GentaNusa sedang merajut dokumentasi aksi sosial dan kemanusiaan. Kami akan menampilkan momen kebersamaan dalam galeri jemuran polaroid begitu rangkaian foto siap dipublikasikan.",
  children_count: null,
  volunteers_count: null,
  packages_distributed: null,
  orphanage_address: "Segera diumumkan",
  address: "Segera diumumkan",
  urgent_needs: [],
  bank_accounts: [],
  photos: [
    {
      id: "ph-1",
      src: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop",
      caption: "Catatan Jurnalis — Dokumentasi Lapangan Sedang Disiapkan",
      handwritten_note: "Sebentar lagi rilis, adik-adik~",
      photographer: "Tim Liputan GentaNusa",
      timestamp: "Hari ini",
      alt: "Anak-anak tersenyum dalam suasana kebersamaan, placeholder galeri Peduli GentaNusa",
    },
    {
      id: "ph-2",
      src: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1200&auto=format&fit=crop",
      caption: "Relawan Merajut Kebersamaan",
      handwritten_note: "Relawan yang tulus menyiapkan semuanya ~",
      photographer: "Tim Liputan GentaNusa",
      timestamp: "Hari ini",
      alt: "Relawan berbagi kebahagiaan bersama anak-anak, placeholder galeri Peduli GentaNusa",
    },
    {
      id: "ph-3",
      src: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop",
      caption: "Kebahagiaan yang Dibagikan Bersama",
      handwritten_note: "Senyum yang membuat perjalanan ini worth it ~",
      photographer: "Tim Liputan GentaNusa",
      timestamp: "Hari ini",
      alt: "Senyum anak-anak dalam kegiatan sosial, placeholder galeri Peduli GentaNusa",
    },
    {
      id: "ph-4",
      src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
      caption: "Momen Hangat di Tengah Kebersamaan",
      handwritten_note: "Belajar bersama, tawa tak pernah berhenti ~",
      photographer: "Tim Liputan GentaNusa",
      timestamp: "Hari ini",
      alt: "Kegiatan belajar bersama anak-anak, placeholder galeri Peduli GentaNusa",
    },
  ] as PolaroidPhoto[],
};

type PeduliViewProps = {
  /** Data kegiatan dari server (fetchPeduliEvents). Kosong = placeholder. */
  initialEvents?: ActivityEvent[];
};

export function PeduliView({ initialEvents = [] }: PeduliViewProps) {
  const events = useMemo<ActivityEvent[]>(() => {
    const list = (Array.isArray(initialEvents) ? initialEvents : [])
      .filter((ev): ev is ActivityEvent => Boolean(ev && ev.id))
      .map((ev) => ({ ...ev, photos: Array.isArray(ev.photos) ? ev.photos : [] }));
    return list.length > 0 ? list : [placeholderEvent];
  }, [initialEvents]);

  const [activeId, setActiveId] = useState<string>(events[0]?.id ?? placeholderEvent.id);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const activeEvent =
    events.find((e) => e.id === activeId) || events[0] || placeholderEvent;

  function openLightbox(_photo: PolaroidPhoto, index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  const isPlaceholder = activeEvent.id === placeholderEvent.id;

  const children = activeEvent.children_count;
  const volunteers = activeEvent.volunteers_count;
  const packages = activeEvent.packages_distributed;
  const hasStats = children != null || volunteers != null || packages != null;

  return (
    <main className="min-h-[85vh] flex flex-col justify-between bg-[#FAFAF9] text-stone-800 pb-24 transition-colors">
      <div>
        <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-4 pt-6 text-xs text-stone-400">
          <Link href="/" className="transition-colors hover:text-sky-600">
            Beranda
          </Link>
          <span aria-hidden="true" className="px-2">
            &rsaquo;
          </span>
          <span className="text-stone-600">Peduli</span>
        </nav>

        {/* Editorial Header Section */}
        <section className="pt-12 pb-8 px-4 sm:px-6 text-center max-w-4xl mx-auto space-y-5">
          {/* Badge Metadata */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-900 text-xs font-medium shadow-sm">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" aria-hidden="true" />
            <span>{activeEvent.date_label}</span>
            <span className="text-sky-300" aria-hidden="true">
              &bull;
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-600" aria-hidden="true" />
              {activeEvent.location_city}
            </span>
          </div>

          {/* Poetic Editorial Headline */}
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 leading-[1.25]">
            {activeEvent.headline}
          </h1>

          <div className="w-16 h-0.5 bg-sky-600/40 mx-auto rounded-full" aria-hidden="true" />

          {/* Story Intro */}
          <p className="text-stone-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {activeEvent.summary}
          </p>

          {/* Metrik Bersih & Elegan */}
          {hasStats && (
            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto pt-4">
              {children != null && (
                <div className="bg-white border border-stone-200/80 shadow-sm p-4 rounded-2xl flex flex-col items-center">
                  <Users className="w-4 h-4 text-sky-700 mb-1" aria-hidden="true" />
                  <span className="text-2xl font-bold font-editorial text-slate-900">{children}</span>
                  <p className="text-[11px] text-stone-500 tracking-wide uppercase font-medium">Anak Asuh</p>
                </div>
              )}
              {volunteers != null && (
                <div className="bg-white border border-stone-200/80 shadow-sm p-4 rounded-2xl flex flex-col items-center">
                  <Sparkles className="w-4 h-4 text-amber-600 mb-1" aria-hidden="true" />
                  <span className="text-2xl font-bold font-editorial text-slate-900">{volunteers}</span>
                  <p className="text-[11px] text-stone-500 tracking-wide uppercase font-medium">Relawan Hadir</p>
                </div>
              )}
              {packages != null && (
                <div className="bg-white border border-stone-200/80 shadow-sm p-4 rounded-2xl flex flex-col items-center">
                  <PackageCheck className="w-4 h-4 text-emerald-600 mb-1" aria-hidden="true" />
                  <span className="text-2xl font-bold font-editorial text-slate-900">{packages}</span>
                  <p className="text-[11px] text-stone-500 tracking-wide uppercase font-medium">Paket Bantuan</p>
                </div>
              )}
            </div>
          )}

          {isPlaceholder && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300/70 text-amber-800 text-xs tracking-wide shadow-sm">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              Dokumentasi Lapangan Sedang Disiapkan
            </div>
          )}
        </section>

        {events.length > 1 && (
          <ActivityTimelineNav events={events} activeId={activeId} onSelect={setActiveId} />
        )}
      </div>

      {/* Bentangan Jemuran Polaroid */}
      <section className="relative w-full overflow-hidden mt-4">
        <div className="text-center mb-2">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
            &mdash; Bentangan Jejak &amp; Senyuman &mdash;
          </p>
        </div>
        <ClotheslineGallery photos={activeEvent.photos || []} onSelectPhoto={openLightbox} />
      </section>

      {/* Kartu Profil Yayasan & Rekening Donasi Mandiri */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 w-full">
        {!isPlaceholder && <OrphanageProfileCard event={activeEvent} />}
      </section>

      {/* Lightbox Pop-up Cerita */}
      {lightboxOpen && Array.isArray(activeEvent.photos) && activeEvent.photos.length > 0 && (
        <StoryLightboxModal
          photos={activeEvent.photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </main>
  );
}
