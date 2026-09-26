# Giscus Comment System — Setup Instructions

## Prerequisites
- GitHub account (public)
- GitHub repo must be public
- Discussions must be enabled

## Step 1: Create GitHub Repository
```bash
# 1. Buat repo baru di GitHub: https://github.com/new
#    Nama: gentanusa-comments (atau gunakan repo utama gentanusa)
#    Public, dengan checkbox "Add a README" dan "Add .gitignore" dicentang

# 2. Atau push repo lokal ke GitHub:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<username>/gentanusa-comments.git
git push -u origin main
```

## Step 2: Enable Discussions
1. Buka repo GitHub → tab **Settings** → **Features**
2. Scroll ke **Features** section
3. Centang **Discussions**
4. Buka tab **Discussions** → klik **New discussion** → pilih category **General**
5. Buat discussion pertama dengan judul: "GentaNusa Comments"

## Step 3: Get Giscus Configuration
1. Buka https://giscus.app/
2. Isi form:
   - **Script per page** → `/artikel/[id]` (gunakan `pathname` matching)
   - **Discussion category** → pilih category yang dibuat di Step 2
3. Copy kode script → paste di `.env.local`:
```
NEXT_PUBLIC_GISCUS_REPO=<username>/gentanusa-comments
NEXT_PUBLIC_GISCUS_REPO_ID=<repo-id>
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=<category-id>
NEXT_PUBLIC_GISCUS_MAPPING=pathname
```

## Step 4: Add Giscus Component
```bash
npm install @giscus/react
```

Tambahkan di `app/artikel/[id]/page.tsx`:
```tsx
import Giscus from '@giscus/react';

// Di dalam artikel page, setelah ShareButtons:
<Giscus
  repo={process.env.NEXT_PUBLIC_GISCUS_REPO!}
  repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
  category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}
  categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
  mapping="pathname"
  reactionsEnabled="1"
  emitMetadata="0"
  inputPosition="bottom"
  theme="light"
  lang="id"
/>
```

## Notes
- Giscus membutuhkan login GitHub untuk komentar
- Gratis, tidak ada server backend diperlukan
- Komentar tersimpan di GitHub Discussions (bisa diekspor/import)
- Theme dark/light: gunakan `var(--color-mode)` atau manual toggle
