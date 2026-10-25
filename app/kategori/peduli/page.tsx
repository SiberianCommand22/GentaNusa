"use client";

import { useEffect, useState } from "react";
import { ClotheslineGallery } from "@/components/peduli/ClotheslineGallery";
import { StoryLightboxModal } from "@/components/peduli/StoryLightboxModal";
import { OrphanageProfileCard } from "@/components/peduli/OrphanageProfileCard";
import { ActivityTimelineNav } from "@/components/peduli/ActivityTimelineNav";
import type { ActivityEvent, PolaroidPhoto } from "@/types/peduli";

const mockEvent: ActivityEvent = {
  id: "mock-1",
  slug: "berbagi-kasih-25-oktober-2026",
  title: "Berbagi Kasih di Hari Minggu",
  date_label: "25 Oktober 2026",
  orphanage_name: "Panti Asuhan Cahaya Hati",
  location_city: "Purwokerto",
  location: "Purwokerto",
  headline: "Berbagi Kasih di Hari Minggu",
  summary: "GentaNusa bersama relawan berbagi paket sembako, buku, dan alat tulis untuk anak-anak panti asuhan.",
  children_count: 45,
  volunteers_count: 12,
  packages_distributed: 45,
  orphanage_address: "Jl. Melati No. 15, Purwokerto",
  address: "Jl. Melati No. 15, Purwokerto",
  urgent_needs: [
    { title: "Sembako", amount: "-" },
    { title: "Pakaian Layak Pakai", amount: "-" },
    { title: "Alat Tulis", amount: "-" },
  ],
  bank_accounts: [
    { bank_name: "BRI", account_number: "1234567890123", account_holder: "Yayasan Cahaya Hati" },
  ],
  photos: [],
};

export default function PeduliPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetch("/api/peduli/events")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setActiveId(data[0].id);
        } else {
          setEvents([mockEvent]);
          setActiveId(mockEvent.id);
        }
      })
      .catch(() => {
        setEvents([mockEvent]);
        setActiveId(mockEvent.id);
      });
  }, []);

  const activeEvent = events.find((e) => e.id === activeId) || events[0] || mockEvent;

  function openLightbox(photo: PolaroidPhoto, index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617]">
      <section className="relative py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sky-400 text-sm mb-2">{activeEvent.date_label} • {activeEvent.location_city}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{activeEvent.headline}</h1>
          <p className="text-lg text-slate-300 mb-6">{activeEvent.summary}</p>
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
        </div>
      </section>

      {events.length > 1 && <ActivityTimelineNav events={events} activeId={activeId} onSelect={setActiveId} />}

      <ClotheslineGallery event={activeEvent} onSelectPhoto={openLightbox} />

      <OrphanageProfileCard event={activeEvent} />

      {lightboxOpen && activeEvent.photos && (
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
