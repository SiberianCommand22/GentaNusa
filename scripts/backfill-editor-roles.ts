/**
 * scripts/backfill-editor-roles.ts
 *
 * Perbaikan satu-kali untuk AKAR BUG "Editor mental ke web utama (/)" :
 * akun jurnalis lama hanya punya `user_metadata.role` (diabaikan middleware)
 * tanpa `app_metadata.role`, sehingga gerbang /admin selalu menolaknya.
 *
 * Skrip ini memindai seluruh user Supabase Auth dan menanam
 * `app_metadata.role = "editor"` pada akun yang:
 *   1. BELUM punya app_metadata.role yang termasuk EDITORIAL_ROLES, DAN
 *   2. punya user_metadata.role termasuk varian redaksi non-admin
 *      (editor/author/writer/penulis/jurnalis/reporter/redaksi/...), DAN
 *   3. email terkonfirmasi.
 *
 * AMAN: hanya berjalan eksplisit oleh Administrator (butuh Service Role Key),
 * tidak ada auto-promosi saat login. Akun tanpa sinyal peran redaksi di
 * user_metadata TIDAK disentuh — daftarkan manual via assign-admin-role.ts.
 *
 * Pemakaian:
 *   npx tsx scripts/backfill-editor-roles.ts            # dry-run (daftar saja)
 *   npx tsx scripts/backfill-editor-roles.ts --apply    # terapkan perubahan
 */

import { createClient } from "@supabase/supabase-js";

const EDITORIAL_VARIANTS = new Set([
  "admin",
  "superadmin",
  "super_admin",
  "administrator",
  "editor",
  "author",
  "writer",
  "penulis",
  "jurnalis",
  "journalist",
  "reporter",
  "redaksi",
  "redaktur",
  "kontributor",
  "contributor",
]);

// Hanya varian NON-admin yang boleh di-backfill otomatis menjadi "editor".
// Akun yang mengklaim "admin" di user_metadata TIDAK dipromosikan otomatis
// (butuh keputusan administrator via assign-admin-role.ts).
const BACKFILLABLE = new Set(
  [...EDITORIAL_VARIANTS].filter(
    (r) => !["admin", "superadmin", "super_admin", "administrator"].includes(r)
  )
);

const norm = (v: unknown): string =>
  String((v as Record<string, unknown> | null)?.role ?? v ?? "")
    .trim()
    .toLowerCase();

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Env belum lengkap: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY wajib ada."
    );
    process.exit(1);
  }
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let page = 1;
  let scanned = 0;
  let fixed = 0;
  const skippedAdminClaim: string[] = [];
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error || !data?.users) {
      console.error(`Gagal membaca user: ${error?.message ?? "unknown"}`);
      process.exit(1);
    }
    for (const u of data.users) {
      scanned++;
      const appRole = norm(u.app_metadata);
      if (EDITORIAL_VARIANTS.has(appRole)) continue; // sudah benar
      const userRole = norm(u.user_metadata);
      const confirmed = Boolean(
        (u as { email_confirmed_at?: string | null }).email_confirmed_at ||
          (u as { confirmed_at?: string | null }).confirmed_at
      );
      if (!BACKFILLABLE.has(userRole) || !confirmed) continue;
      if (apply) {
        const { error: upErr } = await admin.auth.admin.updateUserById(u.id, {
          app_metadata: { ...(u.app_metadata ?? {}), role: "editor" },
        });
        if (upErr) {
          console.warn(`[GAGAL] ${u.email}: ${upErr.message}`);
          continue;
        }
        fixed++;
        console.log(`[OK] ${u.email}: app_metadata.role "editor" (dari "${userRole}")`);
      } else {
        console.log(
          `[CALON] ${u.email}: user_metadata.role="${userRole}" -> akan ditanam app_metadata.role="editor"`
        );
        fixed++;
      }
      void skippedAdminClaim;
    }
    if (data.users.length < 100) break;
    page++;
    if (page > 100) break;
  }
  console.log(
    apply
      ? `Selesai: ${fixed} akun diperbaiki dari ${scanned} dipindai.`
      : `Dry-run: ${fixed} akun CALON dari ${scanned} dipindai. Jalankan dengan --apply untuk menerapkan.`
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
