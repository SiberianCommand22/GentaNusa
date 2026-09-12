import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import styles from "./site.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🔔</span>
          <span className={styles.logoText}>
            Genta<strong>Nusa</strong>
          </span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Beranda</Link>
          <Link href="/kategori/politik" className={styles.navLink}>Politik</Link>
          <Link href="/kategori/ekonomi" className={styles.navLink}>Ekonomi</Link>
          <Link href="/kategori/nasional" className={styles.navLink}>Nasional</Link>
          <Link href="/tentang" className={styles.navLink}>Tentang</Link>
                    <Link href="/cari" className={styles.navLink}>Cari</Link>
                  </nav>
        <MobileNav />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🔔</span>
              <span className={`${styles.logoText} ${styles.logoTextLight}`}>
                Genta<strong>Nusa</strong>
              </span>
            </div>
            <p className={styles.footerText}>
              Berita Nusantara terkini, akurat, dan terpercaya.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Kategori</h4>
            <Link href="/kategori/politik">Politik</Link>
            <Link href="/kategori/ekonomi">Ekonomi</Link>
            <Link href="/kategori/nasional">Nasional</Link>
          </div>
          <div className={styles.footerCol}>
                      <h4>Kontak</h4>
                      <span>redaksi@gentanusa.id</span>
                      <span>Jakarta, Indonesia</span>
                      <Link href="/feed.xml">RSS Feed</Link>
                    </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 GentaNusa. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}