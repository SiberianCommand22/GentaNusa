"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site.module.css";

export function NavItems() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Beranda" },
    { href: "/kategori/politik", label: "Politik" },
    { href: "/kategori/ekonomi", label: "Ekonomi" },
    { href: "/kategori/nasional", label: "Nasional" },
    { href: "/tentang", label: "Tentang" },
    { href: "/cari", label: "Cari" },
  ];

  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const isActive = item.href === pathname;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink}${isActive ? ` ${styles.navLinkActive}` : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}