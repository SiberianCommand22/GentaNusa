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
            type="button"
            onClick={() => onSelect(ev.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-all border ${
              activeId === ev.id
                ? "bg-sky-600 border-sky-600 text-white shadow-md"
                : "bg-white border-stone-200 text-stone-600 hover:border-sky-300 hover:text-sky-700"
            }`}
          >
            {ev.date_label}
          </button>
        ))}
      </div>
    </div>
  );
}
