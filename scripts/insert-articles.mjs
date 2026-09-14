import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf-8");
const getKey = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1];

const SUPABASE_URL = getKey("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = getKey("SUPABASE_SERVICE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("ERROR: .env.local tidak lengkap (butuh NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_KEY)");
  process.exit(1);
}

// 3 artikel konten asli — riset web September 2026
const articles = [
  {
    id: 90,
    title: "Gugatan MK Ditolak: Gibran Tetap Resmi Sebagai Wakil Presiden",
    category: "Politik",
    excerpt:
      "Mahkamah Konstitusi menolak gugatan Denny Indrayana yang ingin mendiskualifikasi Gibran Rakabuming Raka. Apa implikasi hukum dan politiknya?",
    content: JSON.stringify([
      "Mahkamah Konstitusi (MK) resmi menolak gugatan yang diajukan Denny Indrayana terkait kelayakan Gibran Rakabuming Raka sebagai calon wakil presiden. Gugatan ini menilai bahwa Gibran tidak memenuhi syarat pendidikan sebagaimana diatur dalam UU Pemilu.",
      "Dalam putusannya, MK menyatakan bahwa syarat pendidikan calon presiden dan wakil presiden merupakan ketentuan yang sudah final. MK menegaskan bahwa perubahan syarat tidak bisa diterapkan secara retrospektif untuk mendiskualifikasi seseorang yang sudah melalui proses pemilihan.",
      "Denny Indrayana mengajukan permohonan ke MK untuk mendiskualifikasi Gibran karena dianggap tidak memenuhi syarat pencalonan, terutama terkait pendidikan. Denny mempertanyakan bukti ijazah SMA Gibran dan mengaitkannya dengan Pasal 169 huruf r UU No. 7 Tahun 2017 tentang Pemilu.",
      "Pengamat hukum tata negara menilai putusan ini menegaskan stabilitas kerangka hukum pemilu di Indonesia. Meskipun gugatan ditolak, isu syarat calon pemimpin tetap menjadi perbincangan publik ke depannya.",
      "Sementara itu, Presiden Prabowo Subianto menegaskan bahwa kabinetnya terus bekerja untuk rakyat. Gibran terus menjalankan tugasnya sebagai wakil presiden tanpa hambatan hukum yang berarti."
    ]),
    image: "/images/articles/artikel-gugatan-konstitusi-gibran.svg",
    tags: JSON.stringify(["Politik", "MK", "Gibran", "Pemilu 2024", "Konstitusi"]),
    author: "Redaksi GentaNusa",
    author_slug: "redaksi-gentanusa",
    author_role: "Jurnalis Politik",
    date: "2026-09-14",
  },
  {
    id: 91,
    title: "Suahasil Nazara Resmi Jadi Menteri Keuangan Baru, Rp17.669 ke Dolar",
    category: "Ekonomi",
    excerpt:
      "Reshuffle kabinet membawa wajah baru di Kementerian Keuangan. Nilai tukar rupiah melemah di tengah kabar ini, namun analis bilang bukan karena reshuffle.",
    content: JSON.stringify([
      "Suahasil Nazara resmi dilantik sebagai Menteri Keuangan Republik Indonesia, menggantikan Purbaya Yudhi Sadewa. Pelantikan ini dilakukan oleh Presiden Prabowo Subianto dalam Sidang Kabinet Paripurna di Istana Negara.",
      "Perubahan kursi menteri keuangan ini muncul di tengah tekanan nilai tukar rupiah. Rupiah ditutup melemah 58 poin ke level 17.669 per dolar AS pada perdagangan Senin (14/9). Namun, pengamat ekonomi menilai pelemahan ini bukan dampak langsung reshuffle.",
      "Pengamat Ekonomi Ibrahim Assuaibi menyatakan bahwa pergerakan rupiah lebih banyak dipengaruhi oleh kondisi fiskal Indonesia dan kenaikan harga minyak mentah. 'Saat ini yang mempengaruhi rupiah, masih seputar defisit anggaran dan naiknya harga minyak mentah,' ujarnya.",
      "Di sisi lain, Suahasil Nazara memiliki rekam jejak panjang di bidang keuangan. Ia sebelumnya menjabat sebagai Direktur Jenderal Pengelolaan Risiko dan Kualitas di Kementerian Keuangan. Pengalaman ini dianggap penting mengingat tantangan fiskal Indonesia yang semakin kompleks.",
      "Harga minyak mentah dunia melampaui US$100 per barel, posisi Indonesia sebagai importir neto minyak menjadi tantangan berat. Pemerintah dihadapkan pada dilema: menaikkan harga BBM berisiko inflasi, tetapi tidak menaikkan beban fiskal meningkat."
    ]),
    image: "/images/articles/artikel-rupiah-reshuffle.svg",
    tags: JSON.stringify(["Ekonomi", "Kementerian Keuangan", "Rupiah", "Reshuffle", "Suahasil Nazara"]),
    author: "Redaksi GentaNusa",
    author_slug: "redaksi-gentanusa",
    author_role: "Jurnalis Ekonomi",
    date: "2026-09-14",
  },
  {
    id: 92,
    title: "Gunung Semeru Erupsi Lagi: BMKG Naikkan Status ke Siaga, Warga Diimbau Waspada",
    category: "Nasional",
    excerpt:
      "Erupsi Gunung Semeru terjadi pukul 09:41 WIB dengan kolom abu setinggi 400 meter. BMKG mengingatkan 3 gunung lain juga menunjukkan aktivitas tinggi.",
    content: JSON.stringify([
      "Gunung Semeru di Jawa Timur kembali menunjukkan aktivitas erupsi pada Senin (14/9) pukul 09:41 WIB. Kolom abu vulkanik teramati setinggi sekitar 400 meter di atas puncak, setara 4.076 meter di atas permukaan laut.",
      "BMKG mencatat erupsi ini terjadi di tengah pengawasan ketat terhadap 3 gunung api aktif di Indonesia. Selain Semeru, Gunung Ibu di Maluku Utara dan Gunung Lewotolo di NTT juga menunjukkan peningkatan aktivitas seismik.",
      "Status Semeru tetap pada Level III (Siaga). BMKG mengeluarkan rekomendasi: tidak beraktivitas dalam radius 5 km dari puncak, mewaspadai potensi awan panas dan guguran lava, serta waspada terhadap bahaya lahar di sungai-sungai kecil yang merupakan anak sungai dari Besuk Kobokan.",
      "Peringatan dini ini menjadi penting mengingat letak Semeru yang berdekatan dengan pemukiman warga. Kasembar, Lumajang, dan wilayah sekitarnya menjadi zona perhatian utama. BPBD setempat telah menyiapkan posko dan jalur evakuasi.",
      "Sementara itu, data historis menunjukkan Semeru erupsi rata-rata setiap 2-3 tahun. Erupsi terbesar dalam dekade terakhir terjadi pada Desember 2014 dan Februari 2021, keduanya menimbulkan korban jiwa."
    ]),
    image: "/images/articles/artikel-semeru-erupsi.svg",
    tags: JSON.stringify(["Nasional", "Semeru", "BMKG", "Gunung Api", "Erupsi", "Jawa Timur"]),
    author: "Redaksi GentaNusa",
    author_slug: "redaksi-gentanusa",
    author_role: "Jurnalis Sains & Bencana",
    date: "2026-09-14",
  },
];

async function insertArticle(article) {
  const body = JSON.stringify(article);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body,
  });
  return res.status;
}

async function main() {
  console.log("=== INSERT 3 ARTIKEL KE SUPABASE ===\n");
  for (const a of articles) {
    try {
      const status = await insertArticle(a);
      console.log(`[${status}] ${a.id} — ${a.title.substring(0, 50)}...`);
    } catch (e) {
      console.log(`[ERROR] ${a.id} — ${e.message}`);
    }
  }
  console.log("\n=== SELESAI ===");
  console.log("Cek di admin panel: http://localhost:3000/admin");
  console.log("Atau via API: curl -H 'Authorization: Bearer <service_role>' ${SUPABASE_URL}/rest/v1/articles");
}

main();
