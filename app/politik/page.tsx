import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/site";
import { supabaseAnon } from "@/lib/supabase";
import { articleUrl, type Article } from "@/lib/data";
import styles from "@/app/kategori/[slug]/category.module.css";

export const dynamic = "force-dynamic";

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

function slugifyTitle(title: string): string {
  const slug = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug || "artikel";
}

async function fetchPolitikArticles(): Promise<Article[]> {
  if (!supabaseAnon) return [];
  try {
    const { data, error } = await supabaseAnon
      .from("articles")
      .select("*")
      .ilike("category", "politik")
      .eq("status", "published")
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (e) {
    console.warn("Supabase politik query gagal:", e);
    return [];
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export const metadata: Metadata = {
  title: { absolute: "Berita Politik Terkini | GentaNusa" },
  description:
    "Dinamika parlemen, kebijakan publik, dan lanskap demokrasi nasional.",
  alternates: { canonical: `${SITE_URL}/politik` },
  openGraph: {
    url: `${SITE_URL}/politik`,
    siteName: "GentaNusa",
    locale: "id_ID",
    type: "website",
    title: "Berita Politik Terkini | GentaNusa",
    description:
      "Dinamika parlemen, kebijakan publik, dan lanskap demokrasi nasional.",
    images: [
      {
        url: `${SITE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "Berita Politik GentaNusa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Berita Politik Terkini | GentaNusa",
    description:
      "Dinamika parlemen, kebijakan publik, dan lanskap demokrasi nasional.",
    images: [`${SITE_URL}/og-default.jpg`],
  },
};

export default async function PolitikPage() {
  const articles = await fetchPolitikArticles();

  return (
    <>
      <main className={styles.container}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span aria-hidden="true"> {" > "} </span>
          <span aria-current="page">Politik</span>
        </nav>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs uppercase tracking-widest text-blue-600 font-bold">Kanal Liputan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Politik</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Dinamika parlemen, kebijakan publik, dan lanskap demokrasi nasional.</p>
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
            <h2 className={styles.emptyTitle}>Belum Ada Berita di Kategori Politik</h2>
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