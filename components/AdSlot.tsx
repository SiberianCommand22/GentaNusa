"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AdSlot.module.css";

type AdVariant = "top-leaderboard" | "in-feed" | "in-article" | "sticky-sidebar";

interface AdSlotProps {
  slotId: string;
  variant: AdVariant;
  className?: string;
  "data-ad-client"?: string;
}

const VARIANT_SIZES: Record<AdVariant, { width: string; height: string; maxWidth: string }> = {
  "top-leaderboard": { width: "100%", height: "90px", maxWidth: "970px" },
  "in-feed": { width: "100%", height: "90px", maxWidth: "728px" },
  "in-article": { width: "300px", height: "250px", maxWidth: "300px" },
  "sticky-sidebar": { width: "300px", height: "600px", maxWidth: "300px" },
};

const VARIANT_CLASSES: Record<AdVariant, string> = {
  "top-leaderboard": "ad-top-leaderboard",
  "in-feed": "ad-in-feed",
  "in-article": "ad-in-article",
  "sticky-sidebar": "ad-sticky-sidebar",
};

export function AdSlot({
  slotId,
  variant,
  className = "",
  "data-ad-client": adClient = "ca-pub-5435057710252308",
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adsLoaded, setAdsLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  const size = VARIANT_SIZES[variant];
  const variantClass = VARIANT_CLASSES[variant];

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted && !adsLoaded) {
        setAdError(true);
      }
    }, 5000);

    const w = window as unknown as {
      adsbygoogle?: unknown[];
      googletag?: unknown;
    };

    try {
      if (typeof window !== "undefined") {
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
        if (mounted) setAdsLoaded(true);
      }
    } catch {
      if (mounted) setAdError(true);
    }

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [slotId, adsLoaded]);

  const isSticky = variant === "sticky-sidebar";

  return (
    <div
      className={`${styles.wrapper} ${variantClass} ${isSticky ? styles.sticky : ""} ${className}`}
      style={{
        maxWidth: size.maxWidth,
        marginLeft: "auto",
        marginRight: "auto",
      } as React.CSSProperties}
      aria-hidden={!adsLoaded && !adError}
    >
      <div
        className={`${styles.labelWrapper} ${adError ? styles.labelError : ""}`}
        aria-hidden="true"
      >
        <span className={styles.adLabel}>IKLAN</span>
        {adError && <span className={styles.adBlocked}>Iklan diblokir atau tidak dimuat</span>}
      </div>

      <div
        ref={adRef}
        className={styles.adContainer}
        style={{
          width: size.width,
          height: size.height,
          minWidth: variant === "in-article" || variant === "sticky-sidebar" ? size.width : undefined,
          minHeight: size.height,
        } as React.CSSProperties}
        data-ad-client={adClient}
        data-ad-slot={slotId}
        data-ad-format={variant === "top-leaderboard" || variant === "in-feed" ? "auto" : "rectangle"}
        data-full-width-responsive={variant === "top-leaderboard" || variant === "in-feed" ? "true" : "false"}
        aria-hidden={adError}
      >
        {!adsLoaded && !adError && (
          <div className={styles.placeholder} aria-hidden="true">
            <div className={styles.placeholderShimmer} />
          </div>
        )}
      </div>
    </div>
  );
}