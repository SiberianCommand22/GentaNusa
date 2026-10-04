"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

export const OFFICIAL_WA_URL = "https://wa.me/6285134977073";
export const OFFICIAL_IG_URL =
  "https://www.instagram.com/gentanusa_id?stkn=MXEzZXVlYWZyZnE4Zw==";

const corporateNav = [
  { href: "/tentang-kami", label: "Redaksi & Tentang Kami" },
  { href: "/pedoman-media-siber", label: "Pedoman Media Siber" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/kontak", label: "Kontak & Kerja Sama" },
];

const categoryNav = [
  { slug: "nasional", label: "NASIONAL" },
  { slug: "pertahanan", label: "PERTAHANAN" },
  { slug: "politik", label: "POLITIK" },
  { slug: "ekonomi", label: "EKONOMI" },
  { slug: "dunia", label: "DUNIA" },
  { slug: "peduli", label: "PEDULI" },
];

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const closeDrawer = () => setDrawerOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
      closeDrawer();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
        closeDrawer();
      }
    }
  };

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
            <Link
              href="/"
              aria-label="GentaNusa — Beranda"
              className="flex items-center justify-center gap-2.5"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0B1727] border border-white/20 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.png"
                  alt="GentaNusa Logo"
                  width={40}
                  height={40}
                  className="object-cover scale-105"
                  priority
                />
              </div>
              <span className="text-white font-extrabold text-xl tracking-tight ml-2.5 font-sans">
                GentaNusa
              </span>
            </Link>
          </div>

          <div className={styles.headerSideRight} aria-hidden="true">
            <div className={styles.spacer} />
          </div>
        </div>

        <nav className={styles.categoryBar} aria-label="Kategori berita">
          <div className={styles.categoryBarInner}>
            {categoryNav.map((c) => {
              const href = `/${c.slug}`;
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
        <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
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

            {/* Search Form in Sidebar */}
            <form onSubmit={handleSearch} className={styles.drawerSearchForm} role="search">
              <label htmlFor="sidebar-search" className="sr-only">Telusuri berita</label>
              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  id="sidebar-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Telusuri berita..."
                  className={styles.searchInput}
                  autoFocus
                />
              </div>
            </form>

            <nav className={styles.drawerNav}>
              <p className={styles.drawerSectionTitle}>REDAKSI</p>
              {corporateNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.drawerLink}
                  onClick={closeDrawer}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className={styles.drawerFooter}>
              <p className={styles.drawerSectionTitle}>IKUTI KAMI</p>
              <div className="flex flex-col gap-2 mb-4 text-sm">
                <a
                  href={OFFICIAL_WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-200 hover:text-white transition-colors"
                  onClick={closeDrawer}
                >
                  WhatsApp (+62 851-3497-7073)
                </a>
                <a
                  href={OFFICIAL_IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-200 hover:text-white transition-colors"
                  onClick={closeDrawer}
                >
                  @gentanusa_id
                </a>
              </div>
              <div className="pt-6 border-t border-white/10 text-xs text-white/50">
                © 2026 GentaNusa. Portal Berita Nasional.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}