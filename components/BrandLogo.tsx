import Image from "next/image";
import Link from "next/link";
import styles from "./brandlogo.module.css";

type BrandLogoProps = {
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  href?: string;
};

const emblemPx = { sm: 28, md: 36, lg: 44 } as const;
const sizeClass = { sm: styles.sm, md: styles.md, lg: styles.lg } as const;

// Lockup merek GentaNusa. SATU-SATUNYA emblem resmi adalah /logo.png.
// Emblem vektor lonceng lama (BellEmblem) sudah dihapus total dari repo.
export function BrandLogo({
  theme = "light",
  size = "md",
  href = "/",
}: BrandLogoProps) {
  const box = emblemPx[size];

  return (
    <Link
      href={href}
      className={`${styles.lockup} ${theme === "dark" ? styles.onDark : styles.onLight} ${sizeClass[size]}`}
      aria-label="GentaNusa — Beranda"
    >
      <span className={styles.emblem} style={{ width: box, height: box }}>
        <Image
          src="/logo.png"
          alt=""
          width={box}
          height={box}
          priority
          className={styles.emblemImg}
        />
      </span>
      <span className={styles.word}>GentaNusa</span>
    </Link>
  );
}

export default BrandLogo;