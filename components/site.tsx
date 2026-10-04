import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import styles from "./site.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.brandCol}>
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#041d56] border border-white/20 flex items-center justify-center shrink-0">
              <Image
                src="/logo.png"
                alt="GentaNusa Logo"
                width={48}
                height={48}
                className="object-cover scale-105"
              />
            </div>
            <BrandLogo theme="dark" size="md" href="/" />
            <p className={styles.footerText}>
              Portal berita nasional independen menyajikan informasi akurat,
              berimbang, dan tepercaya dari seluruh penjuru Nusantara.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Redaksi</h4>
            <span>redaksi@gentanusa.id</span>
            <span>Jakarta, Indonesia</span>
            <a
              href="https://wa.me/6285134977073"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp (+62 851-3497-7073)
            </a>
            <a
              href="https://www.instagram.com/gentanusa_id?stkn=MXEzZXVlYWZyZnE4Zw=="
              target="_blank"
              rel="noopener noreferrer"
            >
              @gentanusa_id
            </a>
          </div>
          <div className={styles.footerCol}>
            <h4>Informasi</h4>
            <Link href="/tentang-kami">Tentang Kami</Link>
            <Link href="/pedoman-media-siber">Pedoman Media Siber</Link>
            <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            <Link href="/kontak">Kontak &amp; Kerja Sama</Link>
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
