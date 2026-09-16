import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";
import { Header, Footer } from "@/components/site";
import { SkeletonCard } from "@/components/skeleton";

export const metadata: Metadata = {
  title: "Artikel",
};

export const revalidate = 60;

export default async function ArticleListPage() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
      <h1>Artikel</h1>
    </main>
  );
}