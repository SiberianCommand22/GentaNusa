"use client";

import { useState } from "react";
import styles from "./share-buttons.module.css";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== "undefined" ? window.location.origin + url : url;

  const shareLinks = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${fullUrl}`)}`,
      label: "WA",
      color: "#25D366",
    },
    {
      name: "Twitter / X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
      label: "X",
      color: "#000000",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      label: "FB",
      color: "#1877F2",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
      label: "TG",
      color: "#0088cc",
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className={styles.share}>
      <span className={styles.label}>Bagikan:</span>
      <div className={styles.buttons}>
        {shareLinks.map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.button}
            style={{ background: s.color }}
            aria-label={`Bagikan ke ${s.name}`}
            title={s.name}
          >
            {s.label}
          </a>
        ))}
        <button className={styles.copy} onClick={copyLink} aria-label="Salin tautan">
          {copied ? "✓" : "🔗"}
        </button>
      </div>
    </div>
  );
}