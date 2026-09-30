import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Node belum auto-load .env.local — muat manual (env proses tetap menang).
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf-8");
  for (const raw of env.split("\n")) {
    const line = raw.trim();
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const newCategories = [
  { slug: "kesehatan", name: "Kesehatan", color: "#1a5c8a" },
  { slug: "teknologi", name: "Teknologi", color: "#1a5c8a" },
  { slug: "pendidikan", name: "Pendidikan", color: "#1a5c8a" },
  { slug: "budaya", name: "Budaya", color: "#1a5c8a" },
  { slug: "lingkungan", name: "Lingkungan", color: "#1a5c8a" },
  { slug: "dunia", name: "Dunia", color: "#1a5c8a" },
  { slug: "olahraga", name: "Olahraga", color: "#1a5c8a" },
  { slug: "pertahanan", name: "Pertahanan", color: "#0F2744" },
];

async function main() {
  const { data: existing, error: err1 } = await supabase
    .from("categories")
    .select("slug")
    .in(
      "slug",
      newCategories.map((c) => c.slug)
    );

  if (err1) {
    console.error("Gagal baca kategori:", err1.message);
    process.exit(1);
  }

  const existingSlugs = new Set((existing || []).map((c) => c.slug));
  const toInsert = newCategories.filter((c) => !existingSlugs.has(c.slug));

  if (toInsert.length === 0) {
    console.log("Semua kategori sudah ada di DB.");
    return;
  }

  const { error: err2 } = await supabase.from("categories").insert(toInsert);

  if (err2) {
    console.error("Gagal tambah kategori:", err2.message);
    process.exit(1);
  }

  console.log(`Berhasil menambah ${toInsert.length} kategori:`);
  toInsert.forEach((c) => console.log(`  - ${c.name} (${c.slug})`));
}

main();
