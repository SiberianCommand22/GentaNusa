/**
 * Master kategori GentaNusa — satu sumber kebenaran untuk seluruh portal.
 *
 * Kontrak:
 *  - `CategorySlug` adalah union type tertutup; slug di luar daftar ini
 *    dianggap bukan kanal resmi (dipakai `isCategorySlug`).
 *  - `CATEGORIES` memuat label + teks SEO per kanal. Halaman kategori
 *    (mis. /dunia) membaca `metaTitle` / `metaDescription` dari sini
 *    agar judul & deskripsi konsisten dengan data kategori.
 *  - Urutan array = urutan dropdown redaksi (`components/post-editor.tsx`),
 *    sehingga item seperti "Dunia" ikut terpanggil otomatis.
 *
 * Catatan: kanal "Peduli" ada di sini (dropdown redaksi) tetapi belum
 * punya halaman publik — belum masuk `STATIC_CATEGORIES` di lib/data.ts.
 */

export type CategorySlug =
  | "nasional"
  | "pertahanan"
  | "politik"
  | "ekonomi"
  | "dunia"
  | "peduli"
  | "sosial-budaya"
  | "kesehatan"
  | "olahraga"
  | "keamanan";

export type CategoryDefinition = {
  slug: CategorySlug;
  name: string;
  label: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
};

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    slug: "nasional",
    name: "Nasional",
    label: "Nasional",
    description: "Berita dan peristiwa terkini seputar kebijakan nasional dan dinamika tanah air.",
    metaTitle: "Berita Nasional Terkini | GentaNusa",
    metaDescription: "Berita dan peristiwa terkini seputar kebijakan nasional dan dinamika tanah air.",
  },
  {
    slug: "pertahanan",
    name: "Pertahanan",
    label: "Pertahanan",
    description: "Sorotan strategis militer, alutsista, dan kedaulatan wilayah Indonesia.",
    metaTitle: "Berita Pertahanan Terkini | GentaNusa",
    metaDescription: "Sorotan strategis militer, alutsista, dan kedaulatan wilayah Indonesia.",
  },
  {
    slug: "politik",
    name: "Politik",
    label: "Politik",
    description: "Dinamika parlemen, kebijakan publik, dan lanskap demokrasi nasional.",
    metaTitle: "Berita Politik Terkini | GentaNusa",
    metaDescription: "Dinamika parlemen, kebijakan publik, dan lanskap demokrasi nasional.",
  },
  {
    slug: "ekonomi",
    name: "Ekonomi",
    label: "Ekonomi",
    description: "Perkembangan pasar modal, perbankan, dan kebijakan makroekonomi.",
    metaTitle: "Berita Ekonomi Terkini | GentaNusa",
    metaDescription: "Perkembangan pasar modal, perbankan, dan kebijakan makroekonomi.",
  },
  {
    slug: "dunia",
    name: "Dunia",
    label: "Dunia",
    description: "Kabar, peristiwa global, isu geopolitik, dan dinamika internasional terkini.",
    metaTitle: "Berita Dunia Hari Ini | GentaNusa",
    metaDescription:
      "Kumpulan berita dunia terkini, kabar luar negeri, dan peristiwa geopolitik global.",
  },
  {
    slug: "peduli",
    name: "Peduli",
    label: "Peduli",
    description:
      "Dokumentasi kegiatan sosial, aksi kemanusiaan, dan bakti nusantara GentaNusa.",
    metaTitle: "Berita Peduli Terkini | GentaNusa",
    metaDescription:
      "Dokumentasi kegiatan sosial, aksi kemanusiaan, dan bakti nusantara GentaNusa.",
  },
  {
    slug: "sosial-budaya",
    name: "Sosial Budaya",
    label: "Sosial Budaya",
    description: "Kehidupan masyarakat, tradisi, seni budaya, dan dinamika sosial nusantara.",
    metaTitle: "Berita Sosial Budaya Terkini | GentaNusa",
    metaDescription: "Kehidupan masyarakat, tradisi, seni budaya, dan dinamika sosial nusantara.",
  },
  {
    slug: "kesehatan",
    name: "Kesehatan",
    label: "Kesehatan",
    description: "Layanan kesehatan, kebijakan publik bidang kesehatan, dan gaya hidup sehat.",
    metaTitle: "Berita Kesehatan Terkini | GentaNusa",
    metaDescription: "Layanan kesehatan, kebijakan publik bidang kesehatan, dan gaya hidup sehat.",
  },
  {
    slug: "olahraga",
    name: "Olahraga",
    label: "Olahraga",
    description: "Prestasi atlet, kompetisi, dan pembinaan olahraga Indonesia.",
    metaTitle: "Berita Olahraga Terkini | GentaNusa",
    metaDescription: "Prestasi atlet, kompetisi, dan pembinaan olahraga Indonesia.",
  },
  {
    slug: "keamanan",
    name: "Keamanan",
    label: "Keamanan",
    description: "Ketertiban umum, penegakan hukum, dan keamanan masyarakat.",
    metaTitle: "Berita Keamanan Terkini | GentaNusa",
    metaDescription: "Ketertiban umum, penegakan hukum, dan keamanan masyarakat.",
  },
];

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORIES as readonly CategoryDefinition[]).some((c) => c.slug === value);
}

/** Lookup wajib-ada: melempar error bila slug hilang dari master.
 *  Dipakai halaman kategori statis (mis. /dunia) agar build gagal keras
 *  ketika master kategori tidak konsisten. */
export function requireCategoryDefinition(slug: CategorySlug): CategoryDefinition {
  const found = CATEGORIES.find((c) => c.slug === slug);
  if (!found) {
    throw new Error(`Kategori '${slug}' tidak terdaftar di lib/categories.ts`);
  }
  return found;
}
