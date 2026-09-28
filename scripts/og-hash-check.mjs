// og-<hash>.jpg must be spelled the same way in Python and TypeScript, or the
// article page points at a file the renderer never wrote and every share
// preview silently falls back to the slow dynamic route.
//
//   node scripts/og-hash-check.mjs "Judul Artikel"
//   python scripts/og-render.py --id 145     (prints the same key)

function ogHash(title) {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

const titles = process.argv.slice(2);
for (const t of titles.length ? titles : ["Rahasia Kelam Perburuan dan Pemusnahan Jutaan Buku untuk Melatih AI"]) {
  console.log(`articles/og-${ogHash(t)}.jpg`);
}
