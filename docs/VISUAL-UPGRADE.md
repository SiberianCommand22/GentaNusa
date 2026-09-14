## GentaNusa — Visual Upgrade (Mode Terang)

### Background Canvas (`components/background-canvas.tsx`)
- **Berubah dari dark → terang**: gradien dasar `#fff → #f8f6f4 → #f0eef0 → #f5f3f6` (warm off-white palette)
- **Glow radial** (2 sumber):
  - Pojok kanan atas: merah muda-biru (identitas GentaNusa)
  - Pojok kiri bawah: hijau kebumian hangat
- **Grid geometris**: garis `#c8102e` (merah GentaNusa) opacity 5%, size 96px (lebih besar dari sebelumnya 72px)
- **Jaringan info**: garis + titik koneksi warna merah, opacity 50%
- **Motif kawung**: pojok kiri bawah, warna merah, opacity 30%
- **Motif parang**: pojok kanan atas (Yogyakarta culture), warna biru, opacity 18% — baru
- **2 cahaya lembut**: merah hangat (atas tengah) + biru (kiri atas) — baru

### CSS (`app/globals.css`)
- `.bg-canvas`: opacity default 0.85 (terang terlihat tapi tidak mengganggu baca), dark mode: 1.0
- `.article-hero` (baru): card hero artikel dengan:
  - Header bar merah-biru gradien (4px atas)
  - Background gradient lembut putih-merah
  - Soft glow di bawah

### Yang tidak berubah
- Layout, komponen, font, navigasi, artikel, API
- Mode gelap tetap berfungsi penuh (sekarang jadi premium dark version)
