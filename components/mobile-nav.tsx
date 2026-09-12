"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./site.module.css";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/kategori/politik", label: "Politik" },
  { href: "/kategori/ekonomi", label: "Ekonomi" },
  { href: "/kategori/nasional", label: "Nasional" },
  { href: "/tentang", label: "Tentang" },
  { href: "/cari", label: "Cari" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className={styles.mobileNav}>
      <button
        className={styles.hamburger}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <nav className={styles.mobileMenu}>
          {navItems.map((item) => {
            const isActive = item.href === pathname;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileLink}${isActive ? ` ${styles.navLinkActive}` : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}