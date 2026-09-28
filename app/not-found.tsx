import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/site";

export default function NotFound() {
  return (
    <>
      <main className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <Image
          src="/images/illustration-404.svg"
          alt="404 - Halaman tidak ditemukan"
          width={200}
          height={200}
          className="mb-6 opacity-70"
        />
        <h1 className="text-5xl font-bold mb-2">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Halaman yang kamu cari sudah <strong>bersyuhada</strong>.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          ← Kembali ke Beranda
        </Link>
      </main>
      <Footer />
    </>
  );
}