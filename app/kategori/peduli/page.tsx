"use client";

import { useEffect, useState } from "react";
import { ClotheslineGallery } from "@/components/peduli/ClotheslineGallery";
import { StoryLightboxModal } from "@/components/peduli/StoryLightboxModal";
import { OrphanageProfileCard } from "@/components/peduli/OrphanageProfileCard";
import { ActivityTimelineNav } from "@/components/peduli/ActivityTimelineNav";
import type { ActivityEvent, PolaroidPhoto } from "@/types/peduli";

const placeholderEvent: ActivityEvent = {
  id: "placeholder-1",
  slug: "dokumentasi-lapangan-sedang-dipersiapkan",
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
      url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop",
      caption: "Catatan Jurnalis — Dokumentasi Lapangan Sedang Disiapkan",
      alt: "Anak-anak tersenyum dalam suasana kebersamaan, placeholder galeri Peduli GentaNusa",
    },
    {
      id: "ph-2",
      url: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1200&auto=format&fit=crop",
      caption: "Relawan Merajut Kebersamaan",
      alt: "Relawan berbagi kebahagiaan bersama anak-anak, placeholder galeri Peduli GentaNusa",
    },
    {
      id: "ph-3",
      url: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1200&auto=format&fit=crop",
      caption: "Kebahagiaan yang Dibagikan Bersama",
      alt: "Senyum anak-anak dalam kegiatan sosial, placeholder galeri Peduli GentaNusa",
    },
    {
      id: "ph-4",
      url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
      caption: "Momen Hangat di Tengah Kebersamaan",
      alt: "Kegiatan belajar bersama anak-anak, placeholder galeri Peduli GentaNusa",
    },
  ] as PolaroidPhoto[],
};

export default function PeduliPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/peduli/events", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const sanitized = data.map((ev: ActivityEvent) => ({
            ...ev,
            photos: Array.isArray(ev.photos) ? ev.photos : [],
          }));
          setEvents(sanitized);
          setActiveId(sanitized[0].id);
        } else {
          setEvents([placeholderEvent]);
          setActiveId(placeholderEvent.id);
        }
      })
      .catch(() => {
        setEvents([placeholderEvent]);
        setActiveId(placeholderEvent.id);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeEvent = events.find((e) => e.id === activeId) || events[0] || placeholderEvent;

  function openLightbox(photo: PolaroidPhoto, index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  const isPlaceholder = activeEvent.id === placeholderEvent.id;

  return (
    <main className="min-h-[80vh] flex flex-col justify-between bg-gradient-to-b from-[#020617] via-[#0f172a]/80 to-[#020617] text-slate-100">
      <div>
        <section className="relative py-16 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.16),transparent_55%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="text-sky-300/90 text-sm mb-2">
              {isPlaceholder ? "GentaNusa Peduli • Segera Hadir" : `${activeEvent.date_label} • ${activeEvent.location_city}`}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{activeEvent.headline}</h1>
            <p className="text-lg text-slate-300 mb-6">{activeEvent.summary}</p>
            {!isPlaceholder && (
              <div className="flex justify-center gap-8 text-center">
                {activeEvent.children_count != null && (
                  <div>
                    <div className="text-3xl font-bold text-sky-400">{activeEvent.children_count}</div>
                    <div className="text-sm text-slate-400">Anak Asuh</div>
                  </div>
                )}
                {activeEvent.volunteers_count != null && (
                  <div>
                    <div className="text-3xl font-bold text-sky-400">{activeEvent.volunteers_count}</div>
                    <div className="text-sm text-slate-400">Relawan</div>
                  </div>
                )}
                {activeEvent.packages_distributed != null && (
                  <div>
                    <div className="text-3xl font-bold text-sky-400">{activeEvent.packages_distributed}</div>
                    <div className="text-sm text-slate-400">Paket</div>
                  </div>
                )}
              </div>
            )}
            {isPlaceholder && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/40 text-sky-200 text-xs tracking-wide shadow-[0_0_18px_rgba(56,189,248,0.25)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-300"></span>
                </span>
                Dokumentasi Lapangan Sedang Disiapkan
              </div>
            )}
          </div>
        </section>

        {events.length > 1 && <ActivityTimelineNav events={events} activeId={activeId} onSelect={setActiveId} />}

        <ClotheslineGallery event={activeEvent} onSelectPhoto={openLightbox} />

        {!isPlaceholder && <OrphanageProfileCard event={activeEvent} />}
      </div>

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
