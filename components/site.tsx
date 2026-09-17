"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const footerLinks = [
  { label: "Beranda", href: "/" },
  { label: "Kategori", href: "/kategori/politik" },
  { label: "Tentang", href: "/tentang" },
  { label: "Syarat & Ketentuan", href: "/syarat" },
  { label: "Kebijakan Privasi", href: "/privasi" },
  { label: "Penulis", href: "/penulis" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isDark = useIsDark();

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <Image
              src={isDark ? "/images/logo-gentanusa-white.png" : "/images/logo-gentanusa.png"}
              alt="Logo GentaNusa"
              width={130}
              height={71}
              className={styles.logoImg}
            />
          </Link>

          {/* Desktop nav */}
          <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href
                    ? `${styles.navLink} ${styles.active}`
                    : styles.navLink
                }
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.headerRight}>
            <ThemeToggle />
            <HeaderSearch
              isOpen={searchOpen}
              onToggle={() => setSearchOpen(!searchOpen)}
              onClose={() => setSearchOpen(false)}
            />
            <Link href="/cari" className={styles.navLink}>
              Cari
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className={styles.hamburger}
            aria-label="Buka menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  const isDark = useIsDark();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <Link href="/" className={styles.footerLogo}>
            <Image
              src="/images/logo-gentanusa-white.png"
              alt="Logo GentaNusa"
              width={130}
              height={71}
              className={styles.footerLogoImg}
            />
          </Link>
          <nav className={styles.footerNav}>
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.footerLink}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.footerCopyright}>
            © {new Date().getFullYear()} GentaNusa — Berita Nusantara Terkini.
            Hak cipta dilindungi.
          </p>
          <p className={styles.footerCredit}>
            Redaksi GentaNusa
          </p>
        </div>
      </div>
    </footer>
  );
}