import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/site";
import { supabaseAnon } from "@/lib/supabase";
import { articleUrl, type Article } from "@/lib/data";
import { CATEGORIES, type CategoryDefinition } from "@/lib/categories";
import { siteUrl } from "@/lib/site";
import styles from "./category.module.css";
import PeduliPage from "../peduli/page";

// ISR kategori hemat kuota: cache CDN 24 jam; invalidasi instan via
// revalidatePath('/kategori/[slug]') di POST/PUT /api/articles.
export const revalidate = 86400;

type Params = { params: Promise<{ slug: string }> };

// Turunan dari master lib/categories.ts — satu sumber kebenaran untuk
// label, deskripsi banner, dan teks SEO (metaTitle/metaDescription)
// seluruh kanal, termasuk "Dunia".
const VALID_CATEGORIES = new Map<string, CategoryDefinition>(
  CATEGORIES.map((c) => [c.slug, c])
);

// Kanal "Peduli" menggunakan halaman khusus clothesline; rute spesifik
// app/kategori/peduli/page.tsx memiliki prioritas dan dirender langsung.

function normalizeSlug(raw: string | undefined): string {
  return String(raw ?? "").toLowerCase().trim();
}

function slugifyTitle(title: string): string {
  const slug = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug || "artikel";
}

type DbRow = {
  id: number;
  slug?: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  author: string;
  author_slug?: string;
  author_role?: string;
  image?: string;
  image_caption?: string;
  image_credit?: string;
  lead?: string;
  content?: string[] | string;
  tags?: string[] | string;
};

function mapRow(a: DbRow): Article {
  const content = Array.isArray(a.content)
    ? a.content
    : (() => {
        try {
          return JSON.parse(String(a.content || "[]"));
        } catch {
          return [String(a.content || "")].filter(Boolean);
        }
      })();
  const tags = Array.isArray(a.tags)
    ? a.tags
    : (() => {
        try {
          return JSON.parse(String(a.tags || "[]"));
        } catch {
          return [];
        }
      })();
  return {
    id: a.id,
    slug: String(a.slug || "").trim() || slugifyTitle(a.title),
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    date: a.date,
    author: a.author,
    authorSlug: a.author_slug ?? "redaksi-generic",
    authorRole: a.author_role ?? undefined,
    image: a.image ?? undefined,
    cover_image: a.image ?? undefined,
    image_caption: a.image_caption ?? undefined,
    image_credit: a.image_credit ?? undefined,
    lead: a.lead ?? a.excerpt ?? undefined,
    content,
    tags,
  };
}

async function fetchByCategory(label: string): Promise<Article[]> {
  if (!supabaseAnon) return [];
  try {
    const { data, error } = await supabaseAnon
      .from("articles")
      // DIET PAYLOAD: kartu daftar hanya butuh image/title/category — kolom
      // `content` (blok HTML panjang) tidak ikut diambil.
      .select("id,slug,title,category,excerpt,date,author,image")
      .ilike("category", label)
      .eq("status", "published")
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (e) {
    console.warn("Supabase category query gagal:", e);
    return [];
  }
}

const SITE_URL = siteUrl();

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = normalizeSlug(raw);
  const info = VALID_CATEGORIES.get(slug);
  if (!info) return { title: "Kategori tidak ditemukan" };
  const url = `${SITE_URL}/kategori/${slug}`;
  const title = info.metaTitle;
  const description = info.metaDescription;
  const banner = `${SITE_URL}/og-default.jpg`;
  return {
    // absolute agar tidak ganda dengan template "%s | GentaNusa" di layout.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      url,
      siteName: "GentaNusa",
      locale: "id_ID",
      type: "website",
      title,
      description,
      images: [{ url: banner, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [banner],
    },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug: raw } = await params;
  const slug = normalizeSlug(raw);
  const categoryInfo = VALID_CATEGORIES.get(slug);
  if (!categoryInfo) notFound();

  // Kanal "Peduli": render halaman khusus clothesline melalui rute dinamis sebagai fallback
  // untuk memastikan antarmuka Polaroid selalu tampil (rute spesifik tetap diutamakan).
  if (slug === "peduli") {
    return <PeduliPage />;
  }

  const articles = await fetchByCategory(categoryInfo.label);

  return (
    <>
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span aria-hidden="true"> &gt; </span>
          <Link href="/kategori">Kategori</Link>
          <span aria-hidden="true"> &gt; </span>
          <span aria-current="page">{categoryInfo.label}</span>
        </nav>

        {/* ===== Banner Kategori ===== */}
        <div className={styles.banner}>
          <div className={styles.bannerInner}>
            <span className={styles.bannerLabel}>Kategori</span>
            <h1 className={styles.title}>{categoryInfo.label}</h1>
            <p className={styles.subtitle}>{categoryInfo.description}</p>
          </div>
          <div className={styles.bannerAccent} />
        </div>

        {articles.length === 0 ? (
          <div className={styles.empty} role="status">
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9" />
                <path d="M18 14h-8M15 18h-5M10 6H8v4h2" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Belum Ada Berita di Kategori {categoryInfo.label}</h2>
            <p className={styles.emptyText}>
              Redaksi GentaNusa sedang menyiapkan liputan berita dan laporan mendalam
              untuk kategori ini. Silakan kunjungi kanal lainnya untuk berita terkini.
            </p>
            <Link href="/" className={styles.emptyButton}>
              Kembali ke Beranda
            </Link>
          </div>
        ) : (
          <div className={styles.compactGrid}>
            {articles.map((a) => (
              <a key={a.id} href={articleUrl(a)} className={styles.compactCard}>
                <div className={styles.compactThumb}>
                  <Image
                    src={a.image || "/images/placeholder-article.svg"}
                    alt={a.title}
                    width={1200}
                    height={630}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <h2 className={styles.compactTitle}>{a.title}</h2>
                <div className={styles.compactCat}>{a.category}</div>
              </a>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
