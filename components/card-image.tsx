"use client";

import { useState } from "react";
import Image from "next/image";

export function CardImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imageSrc = error ? "/images/placeholder-article.svg" : (src || "/images/placeholder-article.svg");
  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--card, #f3f3f3)",
      }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "var(--muted, #e5e5e5)",
          }}
        />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={1200}
        height={630}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        priority={false}
      />
    </div>
  );
}
