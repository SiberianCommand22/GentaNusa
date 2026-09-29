"use client";
import { useEffect, useRef } from "react";

export function AdSlot({ slot, style }: { slot: string; style?: React.CSSProperties }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // ads not available (adblock/offline) — abaikan
    }
  }, []);

  return (
    <div
      ref={adRef}
      style={style}
      data-ad-client="ca-pub-5435057710252308"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
      className="ad-container"
    />
  );
}