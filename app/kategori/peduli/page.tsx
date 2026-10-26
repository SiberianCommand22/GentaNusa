// Segmen ini TIDAK lagi memuat implementasi sendiri: seluruh halaman Publik
// Peduli terpusat di /peduli (lihat app/peduli/page.tsx) agar tidak ada
// duplikasi. `next.config.ts` juga me-redirect permanen /kategori/peduli →
// /peduli; file ini dipertahankan agar impor "../peduli/page" (dari
// app/kategori/[slug]/page.tsx) tetap sah dan bila redirect diubah.
import PeduliPage from "@/app/peduli/page";

export const revalidate = 0;

export default PeduliPage;
