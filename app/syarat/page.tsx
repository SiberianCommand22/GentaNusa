import { redirect } from "next/navigation";

// URL kanonis kini /syarat-ketentuan — route lama dipertahankan sebagai
// redirect permanen agar tautan lama tidak 404.
export default function TermsLegacyRedirect() {
  redirect("/syarat-ketentuan");
}
