import Link from "next/link";
import { Logo } from "@/components/Logo";
import styles from "./site.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.brandCol}>
            <Logo variant="white" />
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
