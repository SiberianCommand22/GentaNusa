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
  if (!src) return null;
  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={630}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: error ? 0 : 1,
        }}
        onError={() => setError(true)}
      />
    </div>
  );
}
