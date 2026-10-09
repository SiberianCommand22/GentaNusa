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
import { ArticleContent } from "@/components/article-content";
import { CardImage } from "@/components/card-image";
import { ShareButtons } from "@/components/share-buttons";
import { cleanLead, sanitizeEditorialText } from "@/lib/text-formatter";

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
  if (!article) return { title: "Berita Tidak Ditemukan" };

  // Draf tidak boleh diintip publik — metadata pun disamarkan bagi non-admin.
  if (article.status === "draft" && !(await isAdminSession())) {
    return { title: "Berita Tidak Ditemukan" };
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
    title: title,
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
  // MODUL 2 — Sanitasi naskah lama SEBELUM dipecah menjadi paragraf:
  // spasi tak terlihat, spasi ganda, dan spasi liar tanda baca otomatis
  // rapi saat ditampilkan tanpa mengubah data mentah di database.
  const rawParas = Array.isArray(article.content)
    ? article.content
    : [String(article.content ?? "")];
  const paras = rawParas.map((b) => sanitizeEditorialText(String(b ?? "")));
  const [firstParagraph, ...body] = paras;
  const rawLead = article.lead || firstParagraph || "";
  const lead = cleanLead(sanitizeEditorialText(rawLead));
  const coverImage = article.cover_image || article.image;
  // MODUL 2.1 — Query Supabase (via lib/data select("*")) WAJIB menyertakan:
  // image, image_caption, optional_image, optional_image_caption.
  // Resolusi dual-mode: kanonis `optional_image*` + alias `secondary_image*`.
  const optionalImage =
    article.optional_image || article.secondary_image || null;
  const optionalCaption =
    article.optional_image_caption ||
    article.secondary_image_caption ||
    "";
  const optionalCredit =
    article.optional_image_credit || article.secondary_image_credit || "";
  const hasSecondPhoto = Boolean(
    optionalImage && String(optionalImage).trim()
  );
  // TIPE 2: sisipkan Foto Kedua setelah paragraf ke-2/ke-3 isi
  // (body = content minus paragraf pertama yang dipakai lead fallback).
  const insertAt = body.length >= 4 ? 3 : 2;
  const headParas = hasSecondPhoto ? body.slice(0, insertAt) : body;
  const tailParas = hasSecondPhoto ? body.slice(insertAt) : [];
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
            href={"/" + slugifyTitle(article.category)}
            className={styles.breadcrumbCategory}
          >
            {article.category || "Nasional"}
          </Link>
        </nav>

        <article
          className={styles.article}
          data-article-id={article.id}
          data-article-slug={article.slug}
        >
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
          </div>

          {/* 5. Foto sampul (Hero) — TIPE 1 & TIPE 2 identik di paling atas.
              Rasio aspect-video w-full, zero layout shift via fill.
              MODUL 3: `sizes` presisi agar preload `priority` cocok dengan
              permintaan akhir browser (eliminasi galat preload console). */}
          {coverImage && (
            <figure className="max-w-3xl mx-auto w-full">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-sm:rounded-xl">
                <Image
                  src={coverImage}
                  alt={article.image_caption || article.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 768px, 800px"
                  className="object-cover"
                />
              </div>
              {/* HANYA tampil bila caption/kredit asli ada di database */}
              {(article.image_caption || article.image_credit) && (
                <figcaption className="text-xs text-slate-500 italic mt-2 leading-normal">
                  <span>{article.image_caption || ""}</span>
                  {article.image_credit && (
                    <span> Foto: {article.image_credit}</span>
                  )}
                </figcaption>
              )}
            </figure>
          )}

          {/* 6. Lead pembuka — MODUL 1: rata kanan-kiri editorial. */}
          {lead && (
            <p className="text-justify [text-align-last:left] [hyphens:auto] font-medium text-slate-700 text-lg sm:text-xl leading-relaxed sm:leading-loose mb-6 border-b border-slate-100 pb-6">
              {lead}
            </p>
          )}

          {/* 7. Isi artikel — DUAL-MODE + MODUL 1: kontainer body justify. */}
          {!hasSecondPhoto ? (
            <div className="text-justify [text-align-last:left] [hyphens:auto] text-slate-800 text-base sm:text-lg leading-relaxed sm:leading-loose font-normal tracking-normal space-y-6 sm:space-y-7">
              <ArticleContent content={body.length > 0 ? body : []} />
            </div>
          ) : (
            <>
              {headParas.length > 0 && (
                <div className="text-justify [text-align-last:left] [hyphens:auto] text-slate-800 text-base sm:text-lg leading-relaxed sm:leading-loose font-normal tracking-normal space-y-6 sm:space-y-7">
                  <ArticleContent content={headParas} />
                </div>
              )}
              {/* Komponen Foto Kedua di Tengah Naskah */}
              {optionalImage && (
                <figure className="my-8 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-sm max-w-3xl mx-auto w-full max-sm:rounded-xl">
                  <div className="relative aspect-video w-full bg-slate-100">
                    <Image
                      src={optionalImage}
                      alt={optionalCaption || article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 720px"
                      className="object-cover"
                    />
                  </div>
                  {(optionalCaption || optionalCredit) && (
                    <figcaption className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-start justify-between gap-4 text-xs text-slate-600 leading-normal">
                      <span className="italic leading-relaxed">
                        {optionalCaption}
                        {optionalCredit ? ` Foto: ${optionalCredit}` : ""}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                        Dokumentasi Tambahan
                      </span>
                    </figcaption>
                  )}
                </figure>
              )}
              {tailParas.length > 0 && (
                <div className="text-justify [text-align-last:left] [hyphens:auto] text-slate-800 text-base sm:text-lg leading-relaxed sm:leading-loose font-normal tracking-normal space-y-6 sm:space-y-7">
                  <ArticleContent content={tailParas} />
                </div>
              )}
            </>
          )}

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
            <div className={styles.relatedWrapper}>
              <div className={styles.relatedMain}>
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
              </div>
            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  );
}