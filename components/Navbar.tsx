"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

// Navigasi utama 100% editorial. Tautan korporat (Tentang, Pedoman,
// Kontak) TIDAK ada di navbar — semuanya tinggal di footer.
// Link login redaksi SENGAJA tidak ditampilkan (kebijakan keamanan:
// jalur /admin/login/gentanusa privat, tanpa tautan publik).
const categoryNav = [
  { slug: "nasional", label: "Nasional" },
  { slug: "politik", label: "Politik" },
  { slug: "pertahanan", label: "Pertahanan" },
  { slug: "sosial-budaya", label: "Sosial Budaya" },
  { slug: "kesehatan", label: "Kesehatan" },
  { slug: "olahraga", label: "Olahraga" },
  { slug: "keamanan", label: "Keamanan" },
];

// Daftar kanal lengkap = 7 kanal resmi (Navbar, Drawer, Footer memakai
// daftar yang sama — tak ada kanal ghost).
const drawerChannels = categoryNav;

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Tanggal masthead dihitung di klien pasca-mount agar tidak terjadi
  // hydration mismatch (server vs browser beda zona/tanggal).
  const [today, setToday] = useState("");
  useEffect(() => {
    try {
      setToday(
        new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date())
      );
    } catch {
      setToday("");
    }
  }, []);
  const pathname = usePathname();
  const router = useRouter();

  const closeDrawer = () => setDrawerOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      closeDrawer();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchOpen(false);
        closeDrawer();
      }
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full bg-[#0A192F] border-b border-white/10 ${styles.header}`}>
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
            {today && (
              <span className={styles.mastDate} aria-label={`Edisi ${today}`}>
                {today}
              </span>
            )}
          </div>

          <div className={styles.logo}>
            <Link
              href="/"
              aria-label="GentaNusa — Beranda"
              className="flex items-center gap-2 shrink-0 group"
            >
              <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.png"
                  alt="GentaNusa"
                  width={28}
                  height={28}
                  className="object-contain w-full h-full mix-blend-screen"
                  priority
                />
              </div>
              <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight font-sans">
                GentaNusa
              </span>
            </Link>
          </div>

          <div className={styles.headerSideRight} aria-hidden="false">
            <span className={styles.editionTag} aria-hidden="true">
              Edisi Digital
            </span>
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className={styles.iconBtn}
              aria-label={searchOpen ? "Tutup pencarian" : "Cari berita"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={styles.iconGlyph}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={styles.iconGlyph}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className={styles.searchStrip}>
            <form
              onSubmit={handleSearch}
              className={styles.searchStripForm}
              role="search"
            >
              <label htmlFor="navbar-search" className="sr-only">
                Telusuri berita
              </label>
              <input
                id="navbar-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Telusuri berita..."
                className={styles.searchStripInput}
                autoFocus
              />
              <button type="submit" className={styles.searchStripBtn}>
                Cari
              </button>
            </form>
          </div>
        )}

        <nav className={styles.categoryBar} aria-label="Kategori berita">
          <div className={styles.categoryBarInner}>
            {categoryNav.map((c) => {
              // Selalu ke /kategori/<slug>: hanya 6 kanal lama yang punya
              // halaman root-level; kanal baru (sosial-budaya, kesehatan,
              // olahraga, keamanan) hanya ada di bawah /kategori/.
              const href = `/kategori/${c.slug}`;
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

            <nav className={`${styles.drawerNav} space-y-1`} aria-label="Kanal berita">
              <p className={styles.drawerSectionTitle}>KANAL</p>
              {drawerChannels.map((c) => (
                <Link
                  key={c.slug}
                  href={`/kategori/${c.slug}`}
                  aria-current={pathname === `/kategori/${c.slug}` ? "page" : undefined}
                  className={`block py-2.5 px-4 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors ${styles.drawerLink}`}
                  onClick={closeDrawer}
                >
                  <span>{c.label}</span>
                </Link>
              ))}
            </nav>

            <div className={styles.drawerFooter}>
              <div className="pt-5 border-t border-white/10 text-xs text-white/50">
                © 2026 GentaNusa. Portal Berita Nasional.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
