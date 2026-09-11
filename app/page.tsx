import type { Metadata } from "next";
import styles from "./page.module.css";

// ===== Data contoh (mock) — nanti diganti dari admin panel/database =====
type Article = {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  image?: string;
};

const featured: Article = {
  id: 100,
  title:
    "APBN 2026: Fokus Belanja Prioritas, Defisit Ditekan di Tengah Ketidakpastian Global",
  category: "Ekonomi",
  excerpt:
    "Pemerintah menegaskan komitmen menjaga defisit fiskal dalam batas aman, dengan belanja diarahkan pada program prioritas nasional.",
  date: "11 September 2026",
  author: "Redaksi GentaNusa",
};

const latest: Article[] = [
  {
    id: 1,
    title: "DPR Sahkan Revisi UU Minerba, Ini Poin Pentingnya",
    category: "Politik",
    excerpt: "Revisi mengubah skema izin dan menambah kewenangan pemerintah pusat.",
    date: "11 September 2026",
    author: "Redaksi",
  },
  {
    id: 2,
    title: "Rupiah Menguat, IHSG Catat Rekor Tertinggi Sepanjang Tahun",
    category: "Ekonomi",
    excerpt: "Sentimen positif dari data inflasi domestik dan masuknya arus modal asing.",
    date: "11 September 2026",
    author: "Redaksi",
  },
  {
    id: 3,
    title: "Pemerintah Percepat Pembangunan Infrastruktur Digital di Daerah 3T",
    category: "Nasional",
    excerpt: "Target 2027: seluruh kecamatan di daerah tertinggal terhubung internet.",
    date: "10 September 2026",
    author: "Redaksi",
  },
  {
    id: 4,
    title: "KPU Tetapkan Jadwal Tahapan Pemilu, Kampanye Mulai Tahun Depan",
    category: "Politik",
    excerpt: "Tahapan persiapan dimulai bulan ini, pemungutan suara tetap sesuai jadwal.",
    date: "10 September 2026",
    author: "Redaksi",
  },
  {
    id: 5,
    title: "Inflasi Terkendali, BI Pertahankan Suku Bunga Acuan",
    category: "Ekonomi",
    excerpt: "Bank Indonesia menilai inflasi inti masih dalam sasaran 2,5 persen ± 1 persen.",
    date: "9 September 2026",
    author: "Redaksi",
  },
  {
    id: 6,
    title: "Program Makan Bergizi Masuki Tahap Kedua, Jangkauan Diperluas",
    category: "Nasional",
    excerpt: "Pemerintah menambah 200 titik layanan baru di berbagai wilayah.",
    date: "9 September 2026",
    author: "Redaksi",
  },
];

const categories = [
  { name: "Politik", color: "#c8102e" },
  { name: "Ekonomi", color: "#1a5c8a" },
  { name: "Nasional", color: "#2e7d32" },
];

export const metadata: Metadata = {
  title: "Beranda",
};

function formatDate(date: string) {
  return date;
}

export default function Home() {
  return (
    <main>
      {/* ===== Header ===== */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🔔</span>
            <span className={styles.logoText}>Genta<strong>Nusa</strong></span>
          </div>
          <nav className={styles.nav}>
            <a href="/" className={styles.navLinkActive}>Beranda</a>
            <a href="/kategori/politik" className={styles.navLink}>Politik</a>
            <a href="/kategori/ekonomi" className={styles.navLink}>Ekonomi</a>
            <a href="/kategori/nasional" className={styles.navLink}>Nasional</a>
            <a href="/tentang" className={styles.navLink}>Tentang</a>
          </nav>
        </div>
      </header>

      {/* ===== Hero / Headline ===== */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <article className={styles.heroMain}>
              <span className={styles.badge} style={{ background: "#1a5c8a" }}>
                {featured.category}
              </span>
              <h1 className={styles.heroTitle}>{featured.title}</h1>
              <p className={styles.heroExcerpt}>{featured.excerpt}</p>
              <div className={styles.meta}>
                <span>{featured.author}</span>
                <span>•</span>
                <span>{featured.date}</span>
              </div>
            </article>
            <aside className={styles.heroSide}>
              <h3 className={styles.sideHeading}>Terpopuler</h3>
              {latest.slice(0, 4).map((a) => (
                <a key={a.id} href={`/artikel/${a.id}`} className={styles.sideItem}>
                  <span className={styles.sideCat}>{a.category}</span>
                  <p className={styles.sideTitle}>{a.title}</p>
                </a>
              ))}
            </aside>
          </div>
        </div>
      </section>

      {/* ===== Berita Terbaru ===== */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Terbaru</h2>
          <div className={styles.grid}>
            {latest.map((a) => (
              <a key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                <div className={styles.cardBadge}>{a.category}</div>
                <h3 className={styles.cardTitle}>{a.title}</h3>
                <p className={styles.cardExcerpt}>{a.excerpt}</p>
                <div className={styles.meta}>
                  <span>{a.author}</span>
                  <span>•</span>
                  <span>{a.date}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Per Kategori ===== */}
      {categories.map((cat) => (
        <section key={cat.name} className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              <span style={{ color: cat.color }}>{cat.name}</span>
            </h2>
            <div className={styles.grid}>
              {latest.filter((a) => a.category === cat.name).map((a) => (
                <a key={a.id} href={`/artikel/${a.id}`} className={styles.card}>
                  <div className={styles.cardBadge} style={{ background: cat.color }}>
                    {a.category}
                  </div>
                  <h3 className={styles.cardTitle}>{a.title}</h3>
                  <p className={styles.cardExcerpt}>{a.excerpt}</p>
                  <div className={styles.meta}>
                    <span>{a.author}</span>
                    <span>•</span>
                    <span>{a.date}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ===== Footer ===== */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.logo}>
                <span className={styles.logoIcon}>🔔</span>
                <span className={styles.logoText}>Genta<strong>Nusa</strong></span>
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
    </main>
  );
}