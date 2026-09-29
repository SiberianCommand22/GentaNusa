import Link from "next/link";
import styles from "./logo.module.css";

// Siluet lonceng GentaNusa — vektor bersih currentColor, tanpa latar.
// variant "dark" untuk permukaan terang, "white" monokrom untuk footer gelap.
export function BellMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="2.6" r="1.4" />
      <path d="M12 5.4c-3.7 0-6.2 2.8-6.2 6.4v2.5l-1.9 2.9h16.2l-1.9-2.9v-2.5c0-3.6-2.5-6.4-6.2-6.4Z" />
      <circle cx="12" cy="19.4" r="2.1" />
    </svg>
  );
}

export function Logo({ variant = "dark" }: { variant?: "dark" | "white" }) {
  return (
    <Link
      href="/"
      className={`${styles.lockup} ${variant === "white" ? styles.lockupWhite : ""}`}
      aria-label="GentaNusa — Beranda"
    >
      <BellMark className={styles.mark} />
      <span className={styles.word}>GentaNusa</span>
    </Link>
  );
}
