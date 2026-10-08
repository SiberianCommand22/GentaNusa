import Image from "next/image";
import Link from "next/link";
import { WhatsappIcon } from "@/components/WhatsappIcon";
import {
  OFFICIAL_EMAIL_REDAKSI,
  OFFICIAL_IG_URL,
  OFFICIAL_WA_URL,
} from "@/lib/social";
import styles from "./site.module.css";

// Footer editorial navy.
// Logo: SATU-SATUNYA emblem resmi /logo.png. Emblem vektor lonceng lama
// (BellEmblem) sudah dihapus — tidak ada lagi logo ganda di kolom brand.
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.brandCol}>
            <Link
              href="/"
              aria-label="GentaNusa — Beranda"
              className="flex items-center gap-2.5 shrink-0 group mb-4 w-fit"
            >
              <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.png"
                  alt="GentaNusa"
                  width={38}
                  height={38}
                  priority
                  className="object-contain w-full h-full mix-blend-screen"
                />
              </div>
              <span className="text-white font-extrabold text-2xl tracking-tight font-sans">
                GentaNusa
              </span>
            </Link>
            <p className={styles.footerText}>
              Portal berita nasional independen menyajikan informasi akurat,
              berimbang, dan tepercaya dari seluruh penjuru Nusantara.
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4>Redaksi</h4>
            <a
              href={`mailto:${OFFICIAL_EMAIL_REDAKSI}`}
              className={styles.footerPlain}
            >
              {OFFICIAL_EMAIL_REDAKSI}
            </a>
            <span>Jakarta, Indonesia</span>
            {/* min-w-0 + whitespace-nowrap pada nilai menjaga nomor tetap satu
                baris di ponsel; area klik setinggi 44px untuk jari. */}
            <a
              href={OFFICIAL_WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.footerSocial} group`}
            >
              <span className={styles.footerWaBadge}>
                <WhatsappIcon className={styles.footerWaGlyph} />
              </span>
              <span className={styles.footerSocialValue}>
                WhatsApp
              </span>
            </a>
            <a
              href={OFFICIAL_IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.footerSocial} group`}
            >
              <span className={styles.footerIgBadge}>
                <svg
                  className={styles.footerIgGlyph}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className={styles.footerSocialValue}>
                Instagram
              </span>
            </a>
          </div>

          <div className={styles.footerCol}>
            <h4>Informasi</h4>
            <Link href="/tentang-kami">Tentang Kami</Link>
            <Link href="/pedoman-media-siber">Pedoman Media Siber</Link>
            <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>
            <Link href="/kontak">Kontak &amp; Kerja Sama</Link>
          </div>
        </div>

        {/* Baris bawah dipisah dari tombol Back-to-Top yang melayang di pojok
            kanan bawah. Padding kanan (pr-16 / sm:pr-20) menyisakan ruang
            selebar tombol + jaraknya, sehingga "Edisi Digital Nasional" tidak
            pernah tertabrak atau terpotong. */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50 pr-16 sm:pr-20">
          <p>© 2026 GentaNusa. Seluruh hak cipta dilindungi.</p>
          <span className="font-medium tracking-wide text-white/40">
            Edisi Digital Nasional
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;