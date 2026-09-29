import Link from "next/link";
import styles from "./site.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div>
            <Link href="/" className={styles.logo}>
              <img
                alt="Logo GentaNusa"
                loading="lazy"
                width={130}
                height={71}
                className={styles.logoImgFooter}
                src="/images/logo-gentanusa-white.png"
              />
            </Link>
            <p className={styles.footerText}>Berita Nusantara terkini, akurat, dan terpercaya.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Kontak</h4>
            <span>redaksi@gentanusa.id</span>
            <span>Jakarta, Indonesia</span>
          </div>
          <div className={styles.footerCol}>
            <h4>Info</h4>
            <Link href="/tentang">Tentang Kami</Link>
            <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            <Link href="/syarat-ketentuan">Syarat & Ketentuan</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>© 2026 GentaNusa. Seluruh hak cipta dilindungi.</div>
      </div>
    </footer>
  );
}
