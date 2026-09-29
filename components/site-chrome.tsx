"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BackToTop } from "@/components/back-to-top";

// Pembungkus chrome situs: halaman /admin (panel + login) tampil mandiri
// tanpa Navbar umum / tombol Login dan tanpa BackToTop.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname?.startsWith("/admin/");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <BackToTop />
    </>
  );
}
