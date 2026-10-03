"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import styles from "./Navbar.module.css";

const corporateNav = [
  { href: "/tentang-kami", label: "Redaksi & Tentang Kami", icon: "🏛️" },
  { href: "/pedoman-media-siber", label: "Pedoman Media Siber", icon: "📋" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi", icon: "🔒" },
  { href: "/kontak", label: "Kontak & Kerja Sama", icon: "📧" },
];

const categoryNav = [
  { slug: "nasional", label: "NASIONAL" },
  { slug: "pertahanan", label: "PERTAHANAN" },
  { slug: "politik", label: "POLITIK" },
  { slug: "ekonomi", label: "EKONOMI" },
  { slug: "dunia", label: "DUNIA" },
  { slug: "peduli", label: "PEDULI" },
];

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function getCurrentWIB(): string {
  const now = new Date();
  // WIB = UTC+7
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const day = DAYS_ID[wib.getUTCDay()];
  const date = wib.getUTCDate();
  const month = MONTHS_ID[wib.getUTCMonth()];
  const year = wib.getUTCFullYear();
  const hours = String(wib.getUTCHours()).padStart(2, "0");
  const minutes = String(wib.getUTCMinutes()).padStart(2, "0");
  return `${day}, ${date} ${month} ${year} • ${hours}:${minutes} WIB`;
}

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentWIB());
  const pathname = usePathname();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCurrentWIB()), 60000);
    return () => clearInterval(timer);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className={`sticky top-0 z-50 w-full bg-[#0B1727] border-b border-white/10 ${styles.header}`}>
        <div className={styles.headerInner}>
          <div className={styles.headerSideLeft}>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={styles.hamburgerBtn}
              aria-label="Buka Navigasi"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={styles.hamburgerIcon}
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          <div className={styles.logo}>
            <BrandLogo theme="dark" size="lg" href="/" />
          </div>

          <div className={styles.headerSideRight} aria-hidden="true">
            <div className={styles.timeWidget}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.timeIcon} aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        <nav className={styles.categoryBar} aria-label="Kategori berita">
          <div className={styles.categoryBarInner}>
            {categoryNav.map((c) => {
              const href = c.slug === "ekonomi" ? `/${c.slug}` : `/kategori/${c.slug}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={c.slug}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`${styles.categoryLink}${isActive ? ` ${styles.categoryLinkActive}` : ""}`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {drawerOpen && (
        <div className={styles.drawerOverlay} onClick={closeDrawer}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Navigasi</span>
              <button
                className={styles.drawerClose}
                onClick={closeDrawer}
                aria-label="Tutup navigasi"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className={styles.drawerNav}>
              <p className={styles.drawerSectionTitle}>REDAKSI</p>
              {corporateNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.drawerLink}
                  onClick={closeDrawer}
                >
                  <span className={styles.drawerLinkIcon} aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className={styles.drawerFooter}>
              <p className={styles.drawerVersion}>GentaNusa v2.0</p>
              <p className={styles.drawerTagline}>Cepat • Akurat • Terpercaya</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}