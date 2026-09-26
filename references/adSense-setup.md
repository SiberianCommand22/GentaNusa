# Google AdSense Integration — GentaNusa

## Progress
✅ Script utama sudah dipasang di `app/layout.tsx`:
```html
<script async src="https://pagead2.googlesource.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXX" crossOrigin="anonymous"></script>
```

✅ Komponen AdSlot dibuat: `components/ad-slot.tsx`

✅ AdSlot dipasang di:
- Halaman artikel: setelah konten utama (in-article)
- Homepage: setelah hero section (in-feed)

## Langkah Selanjutnya (Manual - Requires User Action)

1. **Buka dashboard Google AdSense**: https://adsense.google.com
2. **Tambahkan situs**:
   - Site URL: `https://gentanusa.id`
   - Content type: Web site
   - Klik "Tersembunyi" untuk dapatkan ID unit iklan
3. **Minta Review**:
   - Policies → Content policy → "Minta tinjauan"
   - Tunggu 1-3 hari kerja

## Unit Ikon yang Dibuat

| Lokasi | Slot ID | Fungsi |
|--------|---------|--------|
| `app/layout.tsx` | — | Script utama `ca-pub-XXXXXX` |
| Artikel page | `1234567890` | In-article (setelah konten) |
| Homepage | `0987654321` | In-feed (setelah hero) |

## Verifikasi After Approval
Setelah approval:
```bash
curl -s https://www.gentanusa.id | grep -i "adsbygoogle"
```
Harus nemu `<script>` & `<ins class="adsbygoogle"`

## Troubleshooting
- **Iklan tidak muncul**: pastikan `site` di AdSense approved
- **Page load error**: cek console Chrome → jaringan → ad-related error