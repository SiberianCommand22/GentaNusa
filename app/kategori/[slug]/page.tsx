import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/site";
import { supabaseAnon } from "@/lib/supabase";
import { formatDate, articleUrl, type Article } from "@/lib/data";
import styles from "./category.module.css";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const VALID_CATEGORIES: Record<string, { label: string; desc: string }> = {
  nasional: {
    label: "Nasional",
    desc: "Berita dan peristiwa terkini seputar kebijakan nasional dan dinamika tanah air.",
  },
  pertahanan: {
    label: "Pertahanan",
    desc: "Sorotan strategis militer, alutsista, dan kedaulatan wilayah Indonesia.",
  },
  politik: {
    label: "Politik",
    desc: "Dinamika parlemen, kebijakan publik, dan lanskap demokrasi nasional.",
  },
  ekonomi: {
    label: "Ekonomi",
    desc: "Perkembangan pasar modal, perbankan, dan kebijakan makroekonomi.",
  },
  dunia: {
    label: "Dunia",
    desc: "Kabar internasional, geopolitik kawasan, dan hubungan diplomatik global.",
  },
  peduli: {
    label: "Peduli",
    desc: "Dokumentasi kegiatan sosial, aksi kemanusiaan, dan bakti nusantara GentaNusa.",
  },
};

// Kanal "Peduli" belum punya ruang publik. Halaman kategori khusus ini
// menampilkan editorial "coming soon" dan tidak pernah menanyakan DB.
const COMING_SOON_SLUGS = new Set(["peduli"]);

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
      .select("*")
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gentanusa.id";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = normalizeSlug(raw);
  const info = VALID_CATEGORIES[slug];
  if (!info) return { title: "Kategori tidak ditemukan" };
  const url = `${SITE_URL}/kategori/${slug}`;
  const title = `Berita ${info.label} Terkini | GentaNusa`;
  const banner = `${SITE_URL}/og-default.jpg`;
  return {
    // absolute agar tidak ganda dengan template "%s | GentaNusa" di layout.
    title: { absolute: title },
    description: info.desc,
    alternates: { canonical: url },
    openGraph: {
      url,
      siteName: "GentaNusa",
      locale: "id_ID",
      type: "website",
      title,
      description: info.desc,
      images: [{ url: banner, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: info.desc,
      images: [banner],
    },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug: raw } = await params;
  const slug = normalizeSlug(raw);
  const categoryInfo = VALID_CATEGORIES[slug];
  if (!categoryInfo) notFound();

  // Kanal "Peduli": tampilkan halaman Coming Soon, tanpa query database.
  if (COMING_SOON_SLUGS.has(slug)) {
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

          <div className={styles.banner}>
            <div className={styles.bannerInner}>
              <span className={styles.bannerLabel}>Kategori</span>
              <h1 className={styles.title}>{categoryInfo.label}</h1>
              <p className={styles.subtitle}>{categoryInfo.desc}</p>
            </div>
            <div className={styles.bannerAccent} />
          </div>

          <section className={styles.comingSoon} aria-labelledby="peduli-title">
            <span className={styles.soonBadge}>GENTANUSA PEDULI</span>
            <h2 id="peduli-title" className={styles.soonTitle}>
              Kanal Dokumentasi Aksi Sosial Segera Hadir
            </h2>
            <p className={styles.soonText}>
              Redaksi GentaNusa sedang mempersiapkan ruang khusus peliputan dan
              dokumentasi program kepedulian sosial, bakti masyarakat, dan aksi
              kemanusiaan di berbagai pelosok negeri.
            </p>

            <div className={styles.soonCard} role="img" aria-label="Ilustrasi kegiatan sosial danocumentedasi aksi humanity GentaNusa">
              <div className={styles.soonCardArt} aria-hidden="true">
                <svg
                  viewBox="0 0 120 120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="60" cy="42" r="16" />
                  <path d="M28 104c0-17.7 14.3-32 32-32s32 14.3 32 32" />
                  <path d="M22 30h12l4-8 4 8h12" />
                  <path d="M98 52v-12M92 46h12" />
                  <path d="M60 84c-4-3-9 1-9 5 0 5 9 11 9 11s9-6 9-11c0-4-5-8-9-5z" />
                </svg>
              </div>
              <div className={styles.soonCardBody}>
                <h3 className={styles.soonCardTitle}>Ruang Liputan Sosial &amp; Kemanusiaan</h3>
                <p className={styles.soonCardText}>
                  Liputan lapangan, bakti masyarakat, bantuan bencana, dan cerita
                  inspiratif warga akan hadir di kanal ini.
                </p>
                <ul className={styles.soonList}>
                  <li>Dokumentasi bakti dan bhakti sosial desa</li>
                  <li>Aksi kemanusiaan dan bantuan bencana</li>
                  <li>Program Posyandu &amp; Pemberdayaan Desa</li>
                </ul>
              </div>
            </div>

            <span className={styles.soonStatus}>Segera hadir</span>

            <div className={styles.soonActions}>
              <Link href="/" className={styles.emptyButton}>
                Kembali ke Beranda
              </Link>
              <Link href="/kategori" className={styles.soonGhostButton}>
                Lihat Semua Kanal
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
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
            <p className={styles.subtitle}>{categoryInfo.desc}</p>
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
          <div className={styles.grid}>
            {articles.map((a) => (
              <a key={a.id} href={articleUrl(a)} className={styles.card}>
                {a.image && (
                  <div className={styles.cardImage}>
                    <Image
                      src={a.image}
                      alt={a.title}
                      width={1200}
                      height={630}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
                <div className={styles.cardBody}>
                  <div className={styles.cardBadge}>{a.category}</div>
                  <h2 className={styles.cardTitle}>{a.title}</h2>
                  <p className={styles.cardExcerpt}>{a.excerpt}</p>
                  <div className={styles.meta}>
                    <span>{a.author}</span>
                    <span>•</span>
                    <span>{formatDate(a.date)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
