"use client";
import { useEffect, useRef } from "react";

export function AdSlot({ slot, style }: { slot: string; style?: React.CSSProperties }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {}
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