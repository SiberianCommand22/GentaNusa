import styles from "./site.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🔔</span>
          <span className={styles.logoText}>
            Genta<strong>Nusa</strong>
          </span>
        </a>
        <nav className={styles.nav}>
          <a href="/" className={styles.navLink}>Beranda</a>
          <a href="/kategori/politik" className={styles.navLink}>Politik</a>
          <a href="/kategori/ekonomi" className={styles.navLink}>Ekonomi</a>
          <a href="/kategori/nasional" className={styles.navLink}>Nasional</a>
          <a href="/tentang" className={styles.navLink}>Tentang</a>
        </nav>
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
            <a href="/kategori/politik">Politik</a>
            <a href="/kategori/ekonomi">Ekonomi</a>
            <a href="/kategori/nasional">Nasional</a>
          </div>
          <div className={styles.footerCol}>
            <h4>Kontak</h4>
            <span>redaksi@gentanusa.id</span>
            <span>Jakarta, Indonesia</span>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 GentaNusa. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}