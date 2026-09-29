import Link from "next/link";
import styles from "./site.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo} aria-label="GentaNusa — Beranda">
              <img
                alt="Logo GentaNusa"
                loading="lazy"
                width={220}
                height={72}
                className={styles.logoImgFooter}
                src="/images/logo-gentanusa-white.png"
              />
            </Link>
            <p className={styles.footerText}>
              Portal berita nasional independen menyajikan informasi akurat,
              berimbang, dan tepercaya dari seluruh penjuru Nusantara.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Redaksi</h4>
            <span>redaksi@gentanusa.id</span>
            <span>Jakarta, Indonesia</span>
          </div>
          <div className={styles.footerCol}>
            <h4>Informasi</h4>
            <Link href="/tentang">Tentang Kami</Link>
            <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            <Link href="/syarat-ketentuan">Syarat & Ketentuan</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 GentaNusa. Seluruh hak cipta dilindungi.</span>
          <span>Edisi Digital Nasional</span>
        </div>
      </div>
    </footer>
  );
}
