"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./site.module.css";
import { navItems } from "./_types";
import { ThemeToggle } from "./theme-toggle";

export function ActiveLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={[className, isActive ? styles.active : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🔔</span>
          <span className={styles.logoText}>
            Genta<strong>Nusa</strong>
          </span>
        </Link>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <ActiveLink key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </ActiveLink>
          ))}
        </nav>
        <ThemeToggle />
        <MobileNav />
      </div>
    </header>
  );
}

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
        <span /> <span /> <span />
      </button>

      {open && (
        <nav className={styles.mobileMenu}>
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[styles.mobileLink, isActive ? styles.active : ""]
                  .filter(Boolean)
                  .join(" ")}
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

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>🔔</span>
              <span className={`${styles.logoText} ${styles.logoTextLight}`}>
                Genta<strong>Nusa</strong>
              </span>
            </Link>
            <p className={styles.footerText}>
              Berita Nusantara terkini, akurat, dan terpercaya.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Kategori</h4>
            <ActiveLink href="/kategori/politik">Politik</ActiveLink>
            <ActiveLink href="/kategori/ekonomi">Ekonomi</ActiveLink>
            <ActiveLink href="/kategori/nasional">Nasional</ActiveLink>
          </div>
          <div className={styles.footerCol}>
            <h4>Kontak</h4>
            <span>redaksi@gentanusa.id</span>
            <span>Jakarta, Indonesia</span>
            <Link href="/feed.xml">RSS Feed</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Info</h4>
            <Link href="/tentang">Tentang Kami</Link>
            <Link href="/sindikasi">Sindikasi</Link>
            <Link href="/privasi">Kebijakan Privasi</Link>
            <Link href="/syarat">Syarat &amp; Ketentuan</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 GentaNusa. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}