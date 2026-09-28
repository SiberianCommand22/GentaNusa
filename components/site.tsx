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
            <h4>Kategori</h4>
            <Link href="/kategori/politik">Politik</Link>
            <Link href="/kategori/ekonomi">Ekonomi</Link>
            <Link href="/kategori/nasional">Nasional</Link>
            <Link href="/kategori/kesehatan">Kesehatan</Link>
            <Link href="/kategori/teknologi">Teknologi</Link>
            <Link href="/kategori/pendidikan">Pendidikan</Link>
            <Link href="/kategori/budaya">Budaya</Link>
            <Link href="/kategori/lingkungan">Lingkungan</Link>
            <Link href="/kategori/dunia">Dunia</Link>
            <Link href="/kategori/olahraga">Olahraga</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Kontak</h4>
            <span>redaksi@gentanusa.id</span>
            <span>Jakarta, Indonesia</span>
            <a href="/feed.xml">RSS Feed</a>
          </div>
          <div className={styles.footerCol}>
            <h4>Info</h4>
            <a href="/tentang">Tentang Kami</a>
            <a href="/sindikasi">Sindikasi</a>
            <a href="/privasi">Kebijakan Privasi</a>
            <a href="/syarat">Syarat & Ketentuan</a>
          </div>
        </div>
        <div className={styles.footerBottom}>© 2026 GentaNusa. Seluruh hak cipta dilindungi.</div>
      </div>
    </footer>
  );
}
