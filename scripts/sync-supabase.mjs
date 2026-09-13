// Sinkronisasi: Supabase (sumber kebenaran) → lib/data/*.json (hasil salinan untuk build)
// Jalan otomatis saat `npm run build` (pakai SUPABASE_SERVICE_KEY server-side)
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Node belum auto-load .env.local — muat manual
try {
  const envPath = path.join(process.cwd(), ".env.local");
  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.error("⚠️  SUPABASE env belum di-set. Lanjut dengan data JSON lama.");
  process.exit(0);
}

const supabase = createClient(url, serviceKey);
const dataDir = path.join(process.cwd(), "lib", "data");

async function fetchAll(table, orderCol = "id") {
  const { data, error } = await supabase.from(table).select("*").order(orderCol, { ascending: false });
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

async function sync() {
  const [articles, categories, sources] = await Promise.all([
    fetchAll("articles", "id"),
    fetchAll("categories", "slug"),
    fetchAll("sources", "id"),
  ]);

  // articles: ubah nama kolom DB (snake) → format JSON (camel)
  const mapped = articles.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    date: a.date,
    author: a.author,
    authorSlug: a.author_slug ?? "redaksi-generic",
    authorRole: a.author_role ?? undefined,
    image: a.image ?? undefined,
    content: a.content ?? [],
    tags: a.tags ?? [],
  }));

  fs.writeFileSync(
    path.join(dataDir, "articles.json"),
    JSON.stringify(mapped, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(dataDir, "categories.json"),
    JSON.stringify(categories, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(dataDir, "sources.json"),
    JSON.stringify(sources, null, 2),
    "utf-8"
  );

  console.log(`✅ Sinkron: ${mapped.length} artikel, ${categories.length} kategori, ${sources.length} sumber`);
}

sync().catch((e) => {
  console.error("❌ Sinkron gagal:", e.message);
  process.exit(1);
});