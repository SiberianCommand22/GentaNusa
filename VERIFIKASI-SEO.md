# Verifikasi Google Search Console & Publisher Center — GentaNusa
#
# CARA PAKAI (tanpa ubah kode):
#   1. https://search.google.com/search-console → Add property → Domain: gentanusa.id
#   2. Google kasih kode, contoh:  AbCdEf1234567890xYz=
#   3. Salin NILAI SAJA (tanpa "google-site-verification=") ke bawah
#   4. Jalankan (PowerShell, dari folder project):
#        vercel env add GOOGLE_SITE_VERIFICATION production
#        (tempel nilai, Enter, lalu Enter lagi untuk konfirmasi)
#   5. Deploy ulang:
#        npx vercel --prod --yes
#   6. Balik ke Search Console → Verify
#
# Selesai. app/layout.tsx sudah membaca env var ini otomatis.
# Setelah terverifikasi boleh hapus env var-nya.
# ---------------------------------------------------------------------------

# Nilai dari Google (tanpa prefix "google-site-verification=")
GOOGLE_SITE_VERIFICATION=

# Bing Webmaster Tools (opsional, untuk bonus traffic dari Bing)
# https://www.bing.com/webmasters → Add site → pilih "Import from GSC" paling gampang
BING_SITE_VERIFICATION=
