## Logo Per-Mode (Solusi Jelek di Malam)

### Masalah
Logo PNG `logo-gentanusa.png` punya background putih. Di mode gelap, background putih tampil kotak pada sidebar gelap — jadi jelek.

### Solusi: 2 versi logo, switch via React state
1. **Mode terang**: `/images/logo-gentanusa.png` (PNG asli, background putih — cocok)
2. **Mode gelap**: `/images/logo-gentanusa-dark.svg` (SVG tanpa background — transparan, elemen berwarna kuning-emas + putih, kontras sempurna)

### Logika switch (`components/site.tsx`)
- State `dark` dibaca dari localStorage + prefers-color-scheme (hydrasi aman)
- `Header` dan `Footer` sama-sama pilih logo berdasarkan `dark`
- `ThemeToggle` juga sync state ke DOM (supaya CSS `[data-theme="dark"]` selektif)

### File baru
- `public/images/logo-gentanusa-dark.svg` — SVG transparan, warna gold/amber, cocok di background gelap

### CSS tambahan (`app/globals.css`)
- `[data-theme="dark"] .logoImg` — drop-shadow glow amber untuk kilau emas
- `[data-theme="dark"] .footer` — background lebih gelap + border atas
- `[data-theme="dark"] .navLink` — warna link disesuaikan

### Catatan
- `logoImgLight` (filter invert) tetap ada sebagai fallback di footer untuk jika SVG tidak tampil
- Mode terang: semua tidak berubah (PNG tetap tampil normal)
- Build sukses, semua route 200, deploy ready
