import { redirect } from "next/navigation";

// URL kanonis kini /kebijakan-privasi — route lama dipertahankan sebagai
// redirect permanen agar tautan lama tidak 404.
export default function PrivacyLegacyRedirect() {
  redirect("/kebijakan-privasi");
}
