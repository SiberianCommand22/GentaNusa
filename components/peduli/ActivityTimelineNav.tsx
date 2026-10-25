"use client";

import type { ActivityEvent } from "@/types/peduli";

type Props = {
  events: ActivityEvent[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ActivityTimelineNav({ events, activeId, onSelect }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 overflow-x-auto">
      <div className="flex gap-3">
        {events.map((ev) => (
          <button
            key={ev.id}
            onClick={() => onSelect(ev.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeId === ev.id
                ? "bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {ev.date_label}
          </button>
        ))}
      </div>
    </div>
  );
}
