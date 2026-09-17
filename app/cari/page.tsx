import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";
import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Cari Berita",
  description: "Cari artikel GentaNusa berdasarkan kata kunci.",
};

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className={styles.container}>
        <h1 className={styles.title}>Cari Berita</h1>
        <p className={styles.info}>
          Gunakan kotak pencarian di header atas untuk mencari berita. Ketik kata kunci, hasil akan muncul secara langsung.
        </p>
      </main>
      <Footer />
    </>
  );
}