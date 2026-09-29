import Link from "next/link";
import styles from "./brandlogo.module.css";

type BrandLogoProps = {
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  href?: string;
};

// Emblem lonceng geometris GentaNusa — vektor currentColor yang presisi,
// tanpa latar kotak. "light" = permukaan terang (navy), "dark" = gelap (putih).
function BellEmblem({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="2.6" r="1.4" />
      <path d="M12 5.4c-3.7 0-6.2 2.8-6.2 6.4v2.5l-1.9 2.9h16.2l-1.9-2.9v-2.5c0-3.6-2.5-6.4-6.2-6.4Z" />
      <circle cx="12" cy="19.4" r="2.1" />
    </svg>
  );
}

const sizeClass = { sm: styles.sm, md: styles.md, lg: styles.lg } as const;

export function BrandLogo({ theme = "light", size = "md", href = "/" }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={`${styles.lockup} ${theme === "dark" ? styles.onDark : styles.onLight} ${sizeClass[size]}`}
      aria-label="GentaNusa — Beranda"
    >
      <BellEmblem className={styles.emblem} />
      <span className={styles.word}>GentaNusa</span>
    </Link>
  );
}
