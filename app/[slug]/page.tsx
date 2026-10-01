import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Footer } from "@/components/site";
import {
  getArticles,
  getArticleAnyBySlugOrId,
  formatDate,
  articleUrl,
  slugifyTitle,
} from "@/lib/data";
import styles from "./page.module.css";
import { getArticleReadCount } from "@/lib/analytics-server";
import { ArticleContent } from "@/components/article-content";
import { CardImage } from "@/components/card-image";
import { AdSlot } from "@/components/ad-slot";
import { ShareButtons } from "@/components/share-buttons";

const RESERVED_SLUGS = [
  "admin",
  "api",
  "cari",
  "tentang",
  "kebijakan-privasi",
  "syarat-ketentuan",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "kategori",
  "penulis",
  "privasi",
  "syarat",
  "kontak",
  "susunan-redaksi",
  "sindikasi",
  "feed.xml",
  "news-sitemap.xml",
];

type Params = { params: Promise<{ slug: string }> };

async function isAdminSession(): Promise<boolean> {
  try {
    const store = await cookies();
    return store.get("genta_admin")?.value === "1";
  } catch {
    return false;
  }
}

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

// Lucuti tag HTML + entitas escape agar lead/excerpt selalu teks polos.
function stripHtml(s: string): string {
  return String(s || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;\s]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;

  if (RESERVED_SLUGS.includes(slug)) {
    return { title: "Halaman Tidak Ditemukan" };
  }

  const article = await getArticleAnyBySlugOrId(slug);
  if (!article) return { title: "Berita Tidak Ditemukan - GentaNusa" };

  // Draf tidak boleh diintip publik — metadata pun disamarkan bagi non-admin.
  if (article.status === "draft" && !(await isAdminSession())) {
    return { title: "Berita Tidak Ditemukan - GentaNusa" };
  }

  const siteUrl = "https://www.gentanusa.id";

  // Resolusi URL gambar WAJIB absolut: scraper medsos (WhatsApp, Telegram,
  // Facebook, X, LinkedIn) menolak path relatif. Relatif /media/... diberi
  // host kanonis; URL Supabase penuh dipakai langsung; kosong → fallback.
  const FALLBACK_IMAGE = `${siteUrl}/og-default.jpg`;
  let imageUrl = article.cover_image || article.image || FALLBACK_IMAGE;
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    imageUrl = `${siteUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }
  imageUrl = imageUrl.replace("http://", "https://");

  const articleUrl = `${siteUrl}/${article.slug || article.id}`;
  const title = article.title;
  const description = stripHtml(article.lead || article.excerpt || article.title).slice(0, 160);
  const mimeType = imageUrl.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

  return {
    title: `${title} - GentaNusa`,
    description: description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: articleUrl },
    openGraph: {
      title: title,
      description: description,
      url: articleUrl,
      siteName: "GentaNusa",
      locale: "id_ID",
      type: "article",
      publishedTime: article.created_at,
      authors: [article.author || "Redaksi GentaNusa"],
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          type: mimeType,
          alt: article.image_caption || title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

// Format tanggal redaksi WIB: "Kamis, 1 Oktober 2026 | 08:30 WIB".
function formatTanggalWIB(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+07:00");
  if (isNaN(d.getTime())) return formatDate(dateStr);
  const hari = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
  return `${hari} | 08:30 WIB`;
}

// Estimasi waktu baca ~200 kata/menit, minimal 1 menit.
function estimateReadMinutes(paras: string[], lead: string): number {
  const words = [...paras, lead]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;

  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  const article = await getArticleAnyBySlugOrId(slug);
  if (!article) notFound();

  // Isolasi draf: pengunjung non-admin langsung 404; admin dapat pratinjau.
  const isDraft = article.status === "draft";
  const isAdmin = isDraft ? await isAdminSession() : false;
  if (isDraft && !isAdmin) notFound();

  const readCount = await getArticleReadCount(article.id);
  const related = (await getArticles())
    .filter((a) => {
      if (a.id === article.id) return false;
      if (a.category === article.category) return true;
      const shared = a.tags.filter(
        (t) => t !== "headline" && article.tags.includes(t)
      );
      return shared.length > 0;
    })
    .slice(0, 3);

  const SITE_URL = "https://www.gentanusa.id";
  // Lead HARUS teks polos: blok mentah toolbar (<p class="...">) atau lead
  // yang mengandung tag dilucuti agar tidak tampil mentah di layar.
  const paras = Array.isArray(article.content)
    ? article.content
    : [String(article.content ?? "")];
  const [firstParagraph, ...body] = paras;
  const lead = stripHtml(article.lead || firstParagraph || "");
  const coverImage = article.cover_image || article.image;
  const readMinutes = estimateReadMinutes(paras, lead);

  return (
    <>
      <main className={styles.container}>
        {isDraft && (
          <div className={styles.draftBanner} role="status">
            ⚠️ Mode Pratinjau Draf (Belum Terbit)
          </div>
        )}
        {/* 1. Breadcrumb ringkas — hanya sampai kategori, tanpa duplikat judul */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Beranda</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link
            href={"/kategori/" + slugifyTitle(article.category)}
            className={styles.breadcrumbCategory}
          >
            {article.category || "Nasional"}
          </Link>
        </nav>

        <article className={styles.article}>
          {/* 2. Badge kategori */}
          <span className={styles.categoryBadge}>{article.category}</span>

          {/* 3. Judul utama */}
          <h1 className={styles.title}>{article.title}</h1>

          {/* 4. Byline penulis — nama terhubung ke profil redaksi */}
          <div className={styles.meta}>
            <span className={styles.avatar} aria-hidden="true">
              {(article.author || "G").charAt(0).toUpperCase()}
            </span>
            <span className={styles.authorBox}>
              <Link
                href={`/redaksi/${encodeURIComponent(
                  (article.author || "Redaksi GentaNusa").toLowerCase().trim().replace(/\s+/g, "-")
                )}`}
                className={styles.author}
                title={`Lihat tulisan ${article.author || "Redaksi GentaNusa"}`}
              >
                {article.author || "Redaksi GentaNusa"}
              </Link>
              <span className={styles.authorRole}>
                {article.authorRole || "Dewan Redaksi / Jurnalis Resmi"}
              </span>
            </span>
            <span className={styles.dot}>•</span>
            <time dateTime={article.date}>{formatTanggalWIB(article.date)}</time>
            <span className={styles.dot}>•</span>
            <span className={styles.readTime}>{readMinutes} menit membaca</span>
            <span className={styles.dot}>•</span>
            <span className={styles.readCount}>{readCount} kali dibaca</span>
          </div>

          {/* 5. Foto sampul + caption — rasio 16:9 presisi, zero layout shift */}
          {coverImage && (
            <figure className={styles.heroFigure}>
              <div className={styles.heroImageWrap}>
                <Image
                  src={coverImage}
                  alt={article.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 720px"
                  style={{ objectFit: "cover" }}
                />
              </div>
              {/* HANYA tampil bila caption/kredit asli ada di database */}
              {(article.image_caption || article.image_credit) && (
                <figcaption className={styles.caption}>
                  <span>{article.image_caption || ""}</span>
                  {article.image_credit && (
                    <span className={styles.credit}>
                      Foto: {article.image_credit}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          )}

          {/* 6. Lead pembuka */}
          {lead && <p className={styles.lead}>{lead}</p>}

          {/* 7. Isi artikel — render HTML toolbar via sanitasi, justify inter-word */}
          <div className={styles.content}>
            <ArticleContent content={body.length > 0 ? body : []} />
            {/* Google AdSense — In-article (tanpa placeholder abu-abu:
                div kolaps bila iklan diblokir, tidak ada kotak kosong) */}
            <AdSlot slot="1234567890" style={{ margin: "2rem 0" }} />
          </div>

          <div className={styles.tags}>
            {article.tags
              .filter((tag) => tag !== "headline")
              .map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                </span>
              ))}
          </div>

          {/* 8. Share bar — langsung tombol, tanpa kotak abu-abu kosong */}
          <ShareButtons
            title={article.title}
            url={`${SITE_URL}${articleUrl(article)}`}
          />
        </article>

        {related.length > 0 && (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>Berita Terkait</h2>
            <div className={styles.relatedGrid}>
              {related.map((a) => (
                <Link key={a.id} href={articleUrl(a)} className={styles.relatedCard}>
                  {a.image && (
                    <div className={styles.relatedImage}>
                      <CardImage src={a.image} alt={a.title} className={styles.cardImg} />
                    </div>
                  )}
                  <h3 className={styles.relatedCardTitle}>{a.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}