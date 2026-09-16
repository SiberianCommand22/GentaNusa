"use client";

import { useEffect, useState } from "react";
import styles from "./site.module.css";
import { navItems } from "./_types";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
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

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a className={styles.logo} href="/">
          <img
            alt="Logo GentaNusa"
            width={130}
            height={71}
            className={styles.logoImg}
            src={dark ? "/images/logo-gentanusa-white.png" : "/images/logo-gentanusa.png"}
          />
        </a>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
        <MobileNav />
      </div>
    </header>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);

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
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={styles.mobileLink} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
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
            <a className={styles.logo} href="/">
              <img
                alt="Logo GentaNusa"
                loading="lazy"
                width={130}
                height={71}
                className={styles.logoImgFooter}
                src="/images/logo-gentanusa-white.png"
              />
            </a>
            <p className={styles.footerText}>Berita Nusantara terkini, akurat, dan terpercaya.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Kategori</h4>
            <a className="" href="/kategori/politik">Politik</a>
            <a className="" href="/kategori/ekonomi">Ekonomi</a>
            <a className="" href="/kategori/nasional">Nasional</a>
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