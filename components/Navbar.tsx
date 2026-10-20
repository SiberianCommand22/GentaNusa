"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { canonicalCategoryHref } from "@/lib/site";
import { NAV_CATEGORIES } from "@/lib/categories";
import styles from "./Navbar.module.css";

// Navigasi utama 100% editorial. Tautan korporat (Tentang, Pedoman,
// Kontak) TIDAK ada di navbar — semuanya tinggal di footer.
// Link login redaksi SENGAJA tidak ditampilkan (kebijakan keamanan:
// jalur /admin/login/gentanusa privat, tanpa tautan publik).
// Urutan & keanggotaan nav diambil dari master lib/categories.ts
// (NAV_CATEGORIES = 8 kanal primer sesuai hierarki kognitif pembaca;
// kanal legacy ekonomi/peduli sengaja tidak tampil di nav).

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const closeSearch = () => setSearchOpen(false);

  // Kunci scroll halaman + tombol Escape selagi modal pencarian terbuka.
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [searchOpen]);

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/cari?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const renderCategoryLink = (c: { slug: string; label: string }, key?: string) => {
    // Href kanonis selaras next.config.ts: 6 kanal lama (nasional, politik,
    // pertahanan, ekonomi, dunia, peduli) langsung ke halaman root-level
    // `/<slug>` (tanpa 301); kanal baru tetap `/kategori/<slug>` (rewrite).
    const href = canonicalCategoryHref(c.slug);
    const isActive = pathname === href;
    return (
      <Link
        key={key ?? c.slug}
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`${styles.catLink} relative flex min-h-[44px] items-center whitespace-nowrap text-xs font-medium text-slate-300 transition-colors hover:text-white lg:inline-flex lg:min-h-0 lg:self-center lg:text-sm ${
          isActive ? styles.catLinkActive : ""
        }`}
      >
        {c.label}
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#0F172A] border-b border-slate-800">
        {/* ── Tier 1: bilah utama (h-14 mobile/tablet, h-16 desktop) ── */}
        <div className="max-w-7xl mx-auto px-4 h-14 lg:h-16 flex items-center justify-between">
          {/* Sisi kiri — logo */}
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
            <span className="text-white font-extrabold text-base lg:text-lg tracking-tight font-sans">
              GentaNusa
            </span>
          </Link>

          {/* Tengah — 8 kategori resmi, horizontal, hanya di desktop */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Kategori berita">
            {NAV_CATEGORIES.map((c) => renderCategoryLink(c))}
          </nav>

          {/* Sisi kanan — pencarian saja (tanpa tombol hamburger) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/60 transition-colors cursor-pointer"
              aria-label="Cari berita"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="w-[18px] h-[18px]"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tier 2: strip kategori geser horizontal (mobile/tablet) ── */}
        <nav
          className={`lg:hidden flex overflow-x-auto no-scrollbar whitespace-nowrap gap-1 sm:gap-4 px-4 border-t border-slate-800/60 ${styles.catStrip}`}
          aria-label="Kategori berita"
        >
          {NAV_CATEGORIES.map((c) => renderCategoryLink(c))}
        </nav>
      </header>

      {/* ── Modal pencarian (desktop & mobile) ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-20 sm:pt-24"
          role="dialog"
          aria-modal="true"
          aria-label="Cari berita"
        >
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={closeSearch}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl">
            <form
              onSubmit={submitSearch}
              role="search"
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 p-2 shadow-2xl"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="w-5 h-5 ml-2 text-slate-400 shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <label htmlFor="navbar-search" className="sr-only">
                Telusuri berita
              </label>
              <input
                id="navbar-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Telusuri berita..."
                className="flex-1 min-w-0 bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-500 outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-slate-900 transition-colors cursor-pointer"
              >
                Cari
              </button>
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Tutup pencarian"
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="w-4 h-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}