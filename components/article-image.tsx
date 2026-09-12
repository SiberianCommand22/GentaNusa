"use client";

import Image from "next/image";

interface ArticleImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ArticleImage({ src, alt, width = 1200, height = 630, className }: ArticleImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      placeholder="blur"
      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' /%3E"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        img.src = "/images/placeholder-article.svg";
      }}
    />
  );
}