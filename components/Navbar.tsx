"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

const mainNav = [
  { href: "/", label: "Beranda" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
  { href: "/kontak", label: "Kontak" },
];

export function Navbar() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [breaking, setBreaking] = useState<{ id: number; title: string } | null>(null);

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Ticker berita terhangat untuk utility bar (gagal diam-diam bila offline)
  useEffect(() => {
    fetch("/api/articles")
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setBreaking({ id: list[0].id, title: list[0].title });
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
      setDrawerOpen(false);
    }
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(quickQuery.trim())}`);
      setQuickQuery("");
      setQuickOpen(false);
    }
  };

  return (
    <>
      <div className={styles.utilityBar}>
        <div className={styles.utilityInner}>
          <span className={styles.dateLine}>{today} • Edisi Digital</span>
          {breaking && (
            <a href={`/artikel/${breaking.id}`} className={styles.ticker}>
              <span className={styles.breaking}>BREAKING</span>
              <span className={styles.tickerTitle}>{breaking.title}</span>
            </a>
          )}
        </div>
      </div>
      <header className={styles.header}>
        <div className={styles.headerInner}>
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

          <div className={styles.logo}>
            <Link href="/" aria-label="GentaNusa — Beranda">
              <img
                src="/images/logo-gentanusa.png"
                alt="GentaNusa"
                className={styles.logoImgOfficial}
              />
            </Link>
          </div>

          <div className={styles.headerRight}>
            <button
              className={styles.searchBtn}
              onClick={() => setQuickOpen((v) => !v)}
              aria-label="Pencarian cepat"
              aria-expanded={quickOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <Link href="/admin/login" className={styles.loginBtn}>
              Masuk Redaksi
            </Link>
          </div>
        </div>
        {quickOpen && (
          <div className={styles.quickSearch}>
            <form onSubmit={handleQuickSearch} className={styles.quickForm}>
              <input
                autoFocus
                type="search"
                placeholder="Cari berita…"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Cari berita"
              />
            </form>
          </div>
        )}
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

            <form onSubmit={handleSearch} className={styles.drawerSearch}>
              <input
                type="search"
                placeholder="Cari Berita"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </form>

            <nav className={styles.drawerNav}>
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
