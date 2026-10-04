// Kanal resmi GentaNusa — sumber tunggal untuk seluruh situs.
// Tiap kontak WhatsApp memakai wa.me + teks pragma agar pengunjung menekan
// sekali dan langsung masuk ke chat Redaksi tanpa menyalin nomor manual.

export const OFFICIAL_WA_NUMBER = "6285134977073";
export const OFFICIAL_WA_DISPLAY = "+62 851-3497-7073";
export const OFFICIAL_WA_PREFILL =
  "Halo Redaksi GentaNusa, saya ingin berkomunikasi mengenai:";

/** Direct chat backlink: buka WhatsApp dengan pesan awal terisi. */
export const OFFICIAL_WA_URL = `https://wa.me/${OFFICIAL_WA_NUMBER}?text=${encodeURIComponent(
  OFFICIAL_WA_PREFILL
)}`;

export const OFFICIAL_WA_LABEL = `WhatsApp (${OFFICIAL_WA_DISPLAY})`;

export const OFFICIAL_IG_URL =
  "https://www.instagram.com/gentanusa_id?stkn=MXEzZXVlYWZyZnE4Zw==";

export const OFFICIAL_IG_LABEL = "@gentanusa_id";

export const OFFICIAL_EMAIL_REDAKSI = "redaksi@gentanusa.id";
export const OFFICIAL_EMAIL_BISNIS = "bisnis@gentanusa.id";