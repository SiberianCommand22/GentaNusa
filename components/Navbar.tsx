"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";

const categories = [
  { slug: "politik", name: "Politik" },
  { slug: "ekonomi", name: "Ekonomi" },
  { slug: "nasional", name: "Nasional" },
  { slug: "kesehatan", name: "Kesehatan" },
  { slug: "teknologi", name: "Teknologi" },
  { slug: "pendidikan", name: "Pendidikan" },
  { slug: "budaya", name: "Budaya" },
  { slug: "lingkungan", name: "Lingkungan" },
  { slug: "dunia", name: "Dunia" },
  { slug: "olahraga", name: "Olahraga" },
];

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/cari?q=${encodeURIComponent(searchQuery.trim())}`;
      setDrawerOpen(false);
    }
  };

  return (
    <>
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

          <Link href="/" className={styles.logo}>
            <Image
              src="/images/logo-gentanusa.png"
              alt="GentaNusa"
              width={140}
              height={40}
              className={styles.logoImg}
            />
          </Link>

          <Link href="/admin/login" className={styles.loginBtn}>
            Login
          </Link>
        </div>
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
              <Link href="/" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}>
                Beranda
              </Link>
              <Link href="/tentang" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}>
                Tentang Kami
              </Link>
              <Link href="/susunan-redaksi" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}>
                Susunan Redaksi
              </Link>
              <Link href="/kontak" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}>
                Kontak & Hubungi Kami
              </Link>
            </nav>

            <div className={styles.drawerCategories}>
              <h3 className={styles.drawerCategoriesTitle}>Kategori</h3>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/kategori/${cat.slug}`}
                  className={styles.drawerCategory}
                  onClick={() => setDrawerOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            <div className={styles.drawerFooter}>
              <div className={styles.socialLinks}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  Instagram
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  TikTok
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
