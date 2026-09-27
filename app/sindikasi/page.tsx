import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";
import { getSyndicated, getSources } from "@/lib/syndication";
import { formatDate } from "@/lib/data";
import styles from "./syndication.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export const metadata: Metadata = {
  title: "Sindikasi",
  description:
    "Kumpulan judul dan tautan berita pilihan dari berbagai kantor berita dan media — dengan atribusi sumber lengkap.",
  alternates: { canonical: `${SITE_URL}/sindikasi` },
  openGraph: {
    url: `${SITE_URL}/sindikasi`,
    title: "Sindikasi | GentaNusa",
    description:
      "Kumpulan judul dan tautan berita pilihan dari berbagai kantor berita dan media — dengan atribusi sumber lengkap.",
  },
};

export default function SyndicationPage() {
  const sources = getSources();
  const items = getSyndicated();

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Sindikasi Nusantara</h1>
          <p className={styles.subtitle}>
            Judul dan tautan berita pilihan dari berbagai media, dikurasi
            GentaNusa. Dibaca selengkapnya di sumber masing-masing.
          </p>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <p>
                Belum ada konten sindikasi. Jalankan{" "}
                <code>python scripts/syndicate.py</code> untuk mengambil berita
                pilihan dari sumber RSS.
              </p>
              <p className={styles.emptyHint}>
                Referensi:{" "}
                {sources.map((s) => s.name).join(", ")} — atribusi otomatis ke
                sumber asli.
              </p>
            </div>
          ) : (
            <div className={styles.group}>
              {sources.map((src) => {
                const list = items.filter((i) => i.sourceId === src.id);
                if (list.length === 0) return null;
                return (
                  <section key={src.id} className={styles.sourceGroup}>
                    <h2 className={styles.sourceTitle}>
                      <span style={{ background: src.color }} className={styles.dot} />
                      {src.name}
                    </h2>
                    <div className={styles.list}>
                      {list.map((item) => (
                        <a
                          key={item.id}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className={styles.item}
                        >
                          <div className={styles.itemBody}>
                            <span className={styles.itemCat}>{item.category}</span>
                            <h3 className={styles.itemTitle}>{item.title}</h3>
                            {item.excerpt && (
                              <p className={styles.itemExcerpt}>{item.excerpt}</p>
                            )}
                            <span className={styles.itemDate}>
                              {formatDate(item.date)} • Baca di {item.sourceName} ↗
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <div className={styles.notice}>
            <p>
              <strong>Catatan legal:</strong> GentaNusa hanya menampilkan judul
              dan ringkasan singkat dengan tautan balik ke sumber asli.
              Seluruh konten dan hak cipta tetap milik penyedia sumber ({sources
                .map((s) => s.name)
                .join(", ")}).
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}