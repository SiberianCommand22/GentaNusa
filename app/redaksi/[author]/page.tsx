import { notFound, redirect } from "next/navigation";
import { getAuthors } from "@/lib/data";

// Alias editorial /redaksi/[author] → URL kanonis /penulis/[authorSlug].
// Alias TIDAK me-render konten sendiri (redirect) agar tidak terjadi
// duplikasi konten terindeks dan lookup selalu memakai kunci author_slug
// resmi dari database, bukan tebakan dari nama.
type Params = { params: Promise<{ author: string }> };

export async function generateStaticParams() {
  return (await getAuthors()).map((a) => ({
    author: encodeURIComponent(a.name.toLowerCase().trim().replace(/\s+/g, "-")),
  }));
}

function normalize(raw: string): string {
  try {
    return decodeURIComponent(raw).replace(/-/g, " ").toLowerCase().trim();
  } catch {
    return raw.replace(/-/g, " ").toLowerCase().trim();
  }
}

export default async function RedaksiAlias({ params }: Params) {
  const { author } = await params;
  const key = String(author || "").trim();
  const want = normalize(key);
  const authors = await getAuthors();
  const match =
    authors.find((a) => a.slug === key) ??
    authors.find((a) => a.name.toLowerCase().trim() === want);
  if (!match) notFound();
  redirect(`/penulis/${match.slug}`);
}
