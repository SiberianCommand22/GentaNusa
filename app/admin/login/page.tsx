import { notFound } from "next/navigation";

/**
 * RUTE DISEGEL — login lama.
 *
 * Form login redaksi hanya hidup di /admin/login/gentanusa. Rute ini sengaja
 * dibuang supaya tidak ada "shortcut" yang mudah ditebak; pengunjung yang
 * mendarat di /admin/login akan melihat halaman 404, bukan form login.
 */
export default function SealedAdminLoginPage(): never {
  notFound();
}