"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AdBanner.module.css";

type AdFormat = "billboard" | "in-feed" | "rectangle" | "sticky-halfpage";

interface AdBannerProps {
  slotId: string;
  format: AdFormat;
  className?: string;
  "data-ad-client"?: string;
}

const FORMAT_SIZES: Record<AdFormat, { width: string; height: string; maxWidth: string }> = {
  billboard: { width: "100%", height: "90px", maxWidth: "970px" },
  "in-feed": { width: "100%", height: "90px", maxWidth: "728px" },
  rectangle: { width: "300px", height: "250px", maxWidth: "300px" },
  "sticky-halfpage": { width: "300px", height: "600px", maxWidth: "300px" },
};

const FORMAT_CLASSES: Record<AdFormat, string> = {
  billboard: "ad-billboard",
  "in-feed": "ad-in-feed",
  rectangle: "ad-rectangle",
  "sticky-halfpage": "ad-sticky-halfpage",
};

export function AdBanner({
  slotId,
  format,
  className = "",
  "data-ad-client": adClient = "ca-pub-5435057710252308",
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adsLoaded, setAdsLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  const size = FORMAT_SIZES[format];
  const formatClass = FORMAT_CLASSES[format];

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

  const isSticky = format === "sticky-halfpage";

  return (
    <div
      className={`${styles.wrapper} ${formatClass} ${isSticky ? styles.sticky : ""} ${className}`}
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
        <span className={styles.adLabel}>ADVERTISEMENT</span>
        {adError && <span className={styles.adBlocked}>Iklan diblokir atau tidak dimuat</span>}
      </div>

      <div
        ref={adRef}
        className={styles.adContainer}
        style={{
          width: size.width,
          height: size.height,
          minWidth: format === "rectangle" || format === "sticky-halfpage" ? size.width : undefined,
          minHeight: size.height,
        } as React.CSSProperties}
        data-ad-client={adClient}
        data-ad-slot={slotId}
        data-ad-format={format === "billboard" || format === "in-feed" ? "auto" : "rectangle"}
        data-full-width-responsive={format === "billboard" || format === "in-feed" ? "true" : "false"}
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