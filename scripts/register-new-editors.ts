/**
 * scripts/register-new-editors.ts
 *
 * Pendaftaran akun redaktur/penulis baru ke Supabase Auth dengan hak akses
 * editor. Idempoten: akun yang sudah ada disinkronkan (password + role).
 *
 * Env (server-only):
 *   SUPABASE_SERVICE_ROLE_KEY (disarankan) / SUPABASE_SERVICE_KEY (fallback)
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL
 *
 * Jalankan: npx tsx scripts/register-new-editors.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type NewEditor = {
  name: string;
  email: string;
  password: string;
  slug: string;
};

const EDITORS: NewEditor[] = [
  {
    name: "Redya Dhaneswara",
    email: "redya.dhaneswara@gentanusa.id",
    password: "Genta#Redya2026!",
    slug: "redya-dhaneswara",
  },
  {
    name: "Gathan Prasasta",
    email: "gathan.prasasta@gentanusa.id",
    password: "Genta#Gathan2026!",
    slug: "gathan-prasasta",
  },
  {
    name: "Mochammad Naufal",
    email: "mochammad.naufal@gentanusa.id",
    password: "Genta#Naufal2026!",
    slug: "mochammad-naufal",
  },
];

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://dxysjpuisahujjacwvua.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY belum terkonfigurasi di environment!"
  );
  process.exit(1);
}

const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(
  email: string
): Promise<{ id: string; app_metadata: Record<string, unknown>; user_metadata: Record<string, unknown> } | null> {
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error || !data?.users) return null;
    const found = data.users.find(
      (u) => (u.email ?? "").trim().toLowerCase() === email.toLowerCase()
    );
    if (found) {
      return {
        id: found.id,
        app_metadata: (found.app_metadata ?? {}) as Record<string, unknown>,
        user_metadata: (found.user_metadata ?? {}) as Record<string, unknown>,
      };
    }
    if (data.users.length < 100) return null;
    page++;
    if (page > 100) return null;
  }
}

/**
 * Sinkronisasi baris profil ke tabel `profiles` (id = UUID auth) dan
 * `authors` (user_id = UUID auth) bila tabel tersebut ada di proyek.
 * Best-effort: tabel tidak ada = diabaikan, BUKAN kegagalan. Sumber
 * kebenaran tetap Supabase Auth `user_metadata`.
 */
async function syncProfileRow(
  userId: string,
  editor: NewEditor
): Promise<void> {
  const headers = {
    apikey: SERVICE_KEY as string,
    Authorization: `Bearer ${SERVICE_KEY as string}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal,resolution=merge-duplicates",
  };
  const role = "editor";
  // Tabel `profiles` (id = UUID auth).
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: userId,
        email: editor.email,
        full_name: editor.name,
        display_name: editor.name,
        role,
      }),
    });
    if (res.ok || res.status === 409) {
      console.log(`  [PROFIL] profiles tersinkron untuk ${editor.email}`);
    }
  } catch {
    // abaikan — tabel opsional
  }
  // Tabel `authors` (user_id = UUID auth).
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/authors`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        email: editor.email,
        name: editor.name,
        full_name: editor.name,
        slug: editor.slug,
        role,
      }),
    });
    if (res.ok || res.status === 409) {
      console.log(`  [PROFIL] authors tersinkron untuk ${editor.email}`);
    }
  } catch {
    // abaikan — tabel opsional
  }
}

async function registerEditor(editor: NewEditor): Promise<void> {
  const role = "editor";
  const existing = await findUserByEmail(editor.email);

  if (existing) {
    // Sinkronkan password + app_metadata.role untuk akun yang sudah ada.
    const mergedAppMeta = { ...existing.app_metadata, role };
    const mergedUserMeta = {
      ...existing.user_metadata,
      full_name: editor.name,
      role,
      author_slug: editor.slug,
      author_role: "Redaktur GentaNusa",
    };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      existing.id,
      {
        password: editor.password,
        app_metadata: mergedAppMeta,
        user_metadata: mergedUserMeta,
      }
    );
    if (error) {
      console.warn(`[GAGAL] ${editor.email}: gagal diperbarui — ${error.message}`);
      return;
    }
    console.log(
      `[SINKRON] ${editor.email}: password diperbarui, app_metadata.role=${role}.`
    );
    await syncProfileRow(existing.id, editor);
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: editor.email,
    password: editor.password,
    email_confirm: true,
    // AKAR BUG LOGIN EDITOR: versi lama hanya menulis user_metadata.role
    // (bisa diubah user, diabaikan middleware) sehingga akun jurnalis
    // selalu ditolak gerbang /admin. app_metadata.role inilah yang dibaca
    // middleware + login API.
    app_metadata: { role },
    user_metadata: {
      full_name: editor.name,
      role,
      author_slug: editor.slug,
      author_role: "Redaktur GentaNusa",
    },
  });
  if (error) {
    console.warn(`[GAGAL] ${editor.email}: ${error.message}`);
    return;
  }
  const userId = data.user?.id;
  console.log(`[SUKSES] Akun aktif: ${editor.name} (${editor.email})`);
  if (userId) {
    await syncProfileRow(userId, editor);
  }
}

async function main(): Promise<void> {
  console.log("Mendaftarkan redaktur GentaNusa baru...");
  for (const editor of EDITORS) {
    await registerEditor(editor);
  }
  console.log("Proses registrasi selesai.");
}

main().catch((e) => {
  console.error("Registrasi gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
