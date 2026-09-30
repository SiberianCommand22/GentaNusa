"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import styles from "./Navbar.module.css";

const mainNav = [
  { href: "/", label: "Beranda" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
  { href: "/kontak", label: "Kontak" },
];

const categoryNav = [
  { slug: "nasional", label: "NASIONAL" },
  { slug: "pertahanan", label: "PERTAHANAN" },
  { slug: "politik", label: "POLITIK" },
  { slug: "ekonomi", label: "EKONOMI" },
  { slug: "dunia", label: "DUNIA" },
];

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className={`sticky top-0 z-50 w-full bg-[#0B192C] shadow-md ${styles.header}`}>
        <div className={styles.headerInner}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              className={styles.hamburger}
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
            >
              <span className={styles.hamburgerIcon}>
                <span />
                <span />
                <span />
              </span>
              <span className={styles.hamburgerText}>Menu</span>
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Cari cepat"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, marginLeft: 12, display: "flex", alignItems: "center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </div>

          <div className={styles.logo}>
            <BrandLogo theme="dark" size="md" href="/" />
          </div>

          <Link href="/admin/login" className={styles.loginBtn}>
            Login
          </Link>
        </div>

        <nav className={styles.categoryBar} aria-label="Kategori berita">
          <div className={styles.categoryBarInner}>
            {categoryNav.map((c) => (
              <Link
                key={c.slug}
                href={`/kategori/${c.slug}`}
                className={styles.categoryLink}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {drawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Menu</span>
              <button
                className={styles.drawerClose}
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup menu"
              >
                ✕
              </button>
            </div>

            <form action="/cari" method="GET" className={styles.drawerSearchForm}>
              <svg className={styles.drawerSearchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                name="q"
                placeholder="Cari berita..."
                className={styles.searchInput}
                aria-label="Cari berita"
                autoFocus
              />
            </form>

            <nav className={styles.drawerNav}>
              <span className={styles.drawerSectionTitle}>Kategori</span>
              {categoryNav.map((c) => (
                <Link
                  key={c.slug}
                  href={`/kategori/${c.slug}`}
                  className={styles.drawerLink}
                  onClick={() => setDrawerOpen(false)}
                >
                  {c.label}
                </Link>
              ))}
              <span className={styles.drawerSectionTitle}>Informasi</span>
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.drawerLink}
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className={styles.drawerFooter}>
              <div className={styles.socialLinks}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram GentaNusa">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>Instagram</span>
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="TikTok GentaNusa">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  <span>TikTok</span>
                </a>
              </div>
              <Link href="/admin/login" className={styles.loginCmsBtn} onClick={() => setDrawerOpen(false)}>
                Login CMS
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}