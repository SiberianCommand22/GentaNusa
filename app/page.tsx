import type { Metadata } from "next";
import Image from "next/image";
import { Header, Footer } from "@/components/site";
import { getArticles, formatDate } from "@/lib/data";

export const metadata: Metadata = {
  title: "Beranda",
};

export const revalidate = 60;

export default async function Home() {
  const articles = (await getArticles()).sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const featured = articles[0];

  return (
    <main>
      <Header />

      {/* ===== Hero ===== */}
      <section className="section">
        <div className="container">
          <a href={`/artikel/${featured.id}`} className="hero">
            <div className="heroImageWrapper">
              <Image
                src={featured.image || "/images/placeholder-article.svg"}
                alt={featured.title}
                width={1200}
                height={500}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                priority
              />
              <div className="heroOverlay">
                <span className="badge" style={{ background: "#c8102e" }}>
                  {featured.category}
                </span>
                <h1 className="heroTitle">{featured.title}</h1>
                <p className="heroExcerpt">{featured.excerpt}</p>
                <div className="meta">
                  <span>{featured.author}</span>
                  <span>•</span>
                  <span>{formatDate(featured.date)}</span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* ===== Terbaru ===== */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, marginBottom: 20 }}>
            Terbaru
          </h2>
          <div className="grid">
            {articles.map((a: any) => (
              <a key={a.id} href={`/artikel/${a.id}`} className="card">
                <Image
                  src={a.image}
                  alt={a.title}
                  width={600}
                  height={340}
                  style={{ width: "100%", height: "auto" }}
                  className="cardImage"
                />
                <div className="cardBody">
                  <span className="cardBadge" style={{ background: "#c8102e" }}>
                    {a.category}
                  </span>
                  <h3 className="cardTitle">{a.title}</h3>
                  <p className="cardSummary">{a.excerpt}</p>
                  <span className="cardReadMore">Baca selengkapnya →</span>
                  <div className="cardMeta">
                    <span>{a.author}</span>
                    <span>•</span>
                    <span>{formatDate(a.date)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}