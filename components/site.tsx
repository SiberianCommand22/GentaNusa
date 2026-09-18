"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./site.module.css";
import { navItems } from "./_types";
import { ThemeToggle } from "./theme-toggle";
import { HeaderSearch } from "./header-search";

function useIsDark(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => {
      setDark(document.documentElement.getAttribute("data-theme") === "dark");
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export function Header() {
  const dark = useIsDark();
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo}>
          <img
            alt="Logo GentaNusa"
            width={130}
            height={71}
            className={styles.logoImg}
            src={dark ? "/images/logo-gentanusa-white.png" : "/images/logo-gentanusa.png"}
          />
        </Link>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.themeToggle}>
          <ThemeToggle />
        </div>
        <HeaderSearch />
        <Link href="/cari" className={styles.navLink}>
          Cari
        </Link>
        <MobileNav />
      </div>
    </header>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className={styles.mobileNav}>
      <button
        className={styles.hamburger}
        onClick={() => setOpen(!open)}
        aria-label="Buka menu"
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
                className={isActive ? `${styles.mobileLink} ${styles.active}` : styles.mobileLink}
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
              <img
                alt="Logo GentaNusa"
                loading="lazy"
                width={130}
                height={71}
                className={styles.logoImgFooter}
                src="/images/logo-gentanusa-white.png"
              />
            </Link>
            <p className={styles.footerText}>Berita Nusantara terkini, akurat, dan terpercaya.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Kategori</h4>
            <Link href="/kategori/politik">Politik</Link>
            <Link href="/kategori/ekonomi">Ekonomi</Link>
            <Link href="/kategori/nasional">Nasional</Link>
            <Link href="/kategori/kesehatan">Kesehatan</Link>
            <Link href="/kategori/teknologi">Teknologi</Link>
            <Link href="/kategori/pendidikan">Pendidikan</Link>
            <Link href="/kategori/budaya">Budaya</Link>
            <Link href="/kategori/lingkungan">Lingkungan</Link>
            <Link href="/kategori/dunia">Dunia</Link>
            <Link href="/kategori/olahraga">Olahraga</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Kontak</h4>
            <span>redaksi@gentanusa.id</span>
            <span>Jakarta, Indonesia</span>
            <a href="/feed.xml">RSS Feed</a>
          </div>
          <div className={styles.footerCol}>
            <h4>Info</h4>
            <a href="/tentang">Tentang Kami</a>
            <a href="/sindikasi">Sindikasi</a>
            <a href="/privasi">Kebijakan Privasi</a>
            <a href="/syarat">Syarat & Ketentuan</a>
          </div>
        </div>
        <div className={styles.footerBottom}>© 2026 GentaNusa. Seluruh hak cipta dilindungi.</div>
      </div>
    </footer>
  );
}