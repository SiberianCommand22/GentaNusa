/**
 * Audit pengguna Supabase Auth GentaNusa — READ-ONLY.
 *
 * Menampilkan: nama, email, role efektif, verifikasi email, login terakhir,
 * jumlah artikel (via `articles.user_id`), dan catatan/temuan per akun.
 *.skrip ini TIDAK menulis apa pun ke Supabase (tidak ada create/update/delete).
 *
 * Env (server-only):
 *   SUPABASE_SERVICE_ROLE_KEY (disarankan) / SUPABASE_SERVICE_KEY (fallback)
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL
 *   MASTER_ADMIN_EMAIL / ADMIN_EMAIL (opsional, override email master)
 *
 * Jalankan: npx tsx scripts/audit-users.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { ADMIN_ROLES, EDITORIAL_NON_ADMIN_ROLES } from "../lib/roles";

const ROOT = path.resolve(__dirname, "..");

/** Load `.env.local` tanpa menimpa env yang sudah ada di shell. */
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

// Email master dihitung LOKAL setelah `.env.local` dimuat. `lib/roles.ts`
// membaca env saat modul diimpor (sebelum loader berjalan), jadi override
// `.env.local` tidak akan terbaca bila hanya mengandalkan modul tersebut.
const MASTER_EMAIL = (
  process.env.MASTER_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "siberiantwotwo@gmail.com"
)
  .trim()
  .toLowerCase();

if (!SERVICE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY belum dikonfigurasi!"
  );
  process.exit(1);
}

const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const norm = (v: unknown): string =>
  typeof v === "string" ? v.trim().toLowerCase() : "";

const readString = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
};

const readMeta = (meta: unknown, key: string): string | null => {
  if (!meta || typeof meta !== "object") return null;
  return readString((meta as Record<string, unknown>)[key]);
};

const CONTRIBUTOR_ROLES = new Set(["kontributor", "contributor"]);
const EDITOR_ROLES = new Set(
  [...EDITORIAL_NON_ADMIN_ROLES].filter((r) => !CONTRIBUTOR_ROLES.has(r))
);

type Bucket = "Admin" | "Editor" | "Contributor" | "Tanpa Peran";

/** Prioritas nama identik dengan `lib/auth.ts`. */
function displayName(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = readString(user.email);
  return (
    readString(meta.full_name) ??
    readString(meta.name) ??
    readString(meta.display_name) ??
    (email ? email.split("@")[0].trim() : "") ??
    "(tanpa nama)"
  );
}

function bucketFor(appRole: string, email: string, verified: boolean): Bucket {
  // Jalur email master HANYA berlaku untuk identitas terverifikasi.
  if (verified && email === MASTER_EMAIL) return "Admin";
  if (ADMIN_ROLES.has(appRole)) return "Admin";
  if (EDITOR_ROLES.has(appRole)) return "Editor";
  if (CONTRIBUTOR_ROLES.has(appRole)) return "Contributor";
  return "Tanpa Peran";
}

type AuditRow = {
  id: string;
  name: string;
  email: string;
  bucket: Bucket;
  roleLabel: string;
  verified: boolean;
  lastSignIn: string | null;
  createdAt: string | null;
  articles: number | null;
  notes: string[];
  seedSource: string | null;
};

const fmtDateTime = (iso: string | null): string => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
};

const truncate = (s: string, width: number): string => {
  if (s.length <= width) return s;
  return `${s.slice(0, Math.max(1, width - 1))}…`;
};

/* ------------------------------------------------------------------ */
/* Pengambilan data                                                    */
/* ------------------------------------------------------------------ */

async function fetchAllUsers(): Promise<User[]> {
  const users: User[] = [];
  const perPage = 100;
  for (let page = 1; page <= 200; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers gagal: ${error.message}`);
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
  }
  return users;
}

type OwnerIndex = {
  counts: Map<string, number>;
  total: number;
  withoutOwner: number;
  orphanOwners: Set<string>;
  available: boolean;
  note: string | null;
};

async function fetchArticleOwners(users: User[]): Promise<OwnerIndex> {
  const index: OwnerIndex = {
    counts: new Map(),
    total: 0,
    withoutOwner: 0,
    orphanOwners: new Set(),
    available: true,
    note: null,
  };
  const known = new Set(users.map((u) => u.id));
  const pageSize = 1000;

  for (let offset = 0; offset < 200_000; offset += pageSize) {
    const { data, error } = await admin
      .from("articles")
      .select("user_id")
      .range(offset, offset + pageSize - 1);
    if (error) {
      const code = (error as { code?: string }).code ?? "";
      const msg = error.message ?? "";
      index.available = false;
      if (code === "42703" || /user_id/i.test(msg)) {
        index.note =
          "kolom `articles.user_id` belum ada — jalankan `scripts/migrate-articles.sql` (jumlah artikel tidak dihitung)";
      } else if (code === "42P01" || /does not exist/i.test(msg)) {
        index.note = "tabel `articles` tidak ditemukan — jumlah artikel tidak dihitung";
      } else {
        index.note = `gagal membaca artikel: ${msg}`;
      }
      return index;
    }
    const rows = (data ?? []) as { user_id: string | null }[];
    for (const row of rows) {
      index.total += 1;
      if (!row.user_id) {
        index.withoutOwner += 1;
        continue;
      }
      index.counts.set(row.user_id, (index.counts.get(row.user_id) ?? 0) + 1);
      if (!known.has(row.user_id)) index.orphanOwners.add(row.user_id);
    }
    if (rows.length < pageSize) break;
  }
  return index;
}

/* ------------------------------------------------------------------ */
/* Parsing akun seed lokal (read-only, tanpa menyentuh kredensial)      */
/* ------------------------------------------------------------------ */

type SeedAccount = {
  name: string;
  email: string;
  source: string;
  appRoleAtCreate: boolean;
};

/**
 * Ambil pasangan name/email dari skrip seed dengan regex. Sengaja TIDAK
 * membaca atau mencetak password/salt/hash — kredensial tidak pernah keluar.
 */
function parseSeedFile(file: string, appRoleAtCreate: boolean): SeedAccount[] {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return [];
  const src = fs.readFileSync(full, "utf8");
  const names = [...src.matchAll(/\bname\s*:\s*["']([^"']+)["']/g)].map((m) =>
    m[1].trim()
  );
  const emails = [...src.matchAll(/\bemail\s*:\s*["']([^"']+)["']/g)].map((m) =>
    m[1].trim().toLowerCase()
  );
  const size = Math.min(names.length, emails.length);
  if (names.length !== emails.length) {
    console.warn(
      `[PERINGATAN] ${file}: jumlah name (${names.length}) != email (${emails.length}); ` +
        `${size} pasangan pertama yang dipakai.`
    );
  }
  const out: SeedAccount[] = [];
  for (let i = 0; i < size; i++) {
    out.push({
      name: names[i],
      email: emails[i],
      source: file,
      appRoleAtCreate,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Output helpers                                                       */
/* ------------------------------------------------------------------ */

const RULE = "═".repeat(78);
const THIN = "─".repeat(78);

type Column = { header: string; width: number; get: (r: AuditRow) => string };

function renderTable(columns: Column[], rows: AuditRow[]): void {
  const sep = columns.map((c) => "─".repeat(c.width)).join("─┼─");
  console.log(sep);
  console.log(
    columns
      .map((c) => c.header.toUpperCase().padEnd(c.width))
      .join(" │ ")
  );
  console.log(sep);
  for (const row of rows) {
    console.log(
      columns
        .map((c) => truncate(c.get(row) || "-", c.width).padEnd(c.width))
        .join(" │ ")
    );
  }
  console.log(sep);
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  console.log(RULE);
  console.log("AUDIT PENGGUNA SUPABASE AUTH — GENTANUSA (READ-ONLY)");
  console.log(RULE);
  console.log(`URL      : ${SUPABASE_URL}`);
  console.log(`Master   : ${MASTER_EMAIL}`);
  console.log("");

  const users = await fetchAllUsers();
  const owners = await fetchArticleOwners(users);
  const seeds = [
    ...parseSeedFile("scripts/seed-users.js", false),
    ...parseSeedFile("scripts/seed-additional-users.ts", true),
  ];
  const seedByEmail = new Map(seeds.map((s) => [s.email, s]));

  const rows: AuditRow[] = [];
  for (const user of users) {
    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const appRole = norm(readMeta(appMeta, "role"));
    const userRole = norm(readMeta(userMeta, "role"));
    const email = (readString(user.email) ?? "").toLowerCase();
    const verified = Boolean(user.email_confirmed_at || user.confirmed_at);
    const notes: string[] = [];

    if (!email) notes.push("email kosong");
    if (!verified) notes.push("email belum diverifikasi");
    if (!appRole) {
      if (EDITORIAL_NON_ADMIN_ROLES.has(userRole)) {
        notes.push(`role '${userRole}' hanya label (user_metadata)`);
      } else if (userRole) {
        notes.push(`role '${userRole}' hanya label (user_metadata)`);
      } else {
        notes.push("tidak ada role sama sekali");
      }
    } else if (
      !ADMIN_ROLES.has(appRole) &&
      !EDITORIAL_NON_ADMIN_ROLES.has(appRole)
    ) {
      notes.push(`role app_metadata tidak dikenal: '${appRole}'`);
    }
    if (verified && email === MASTER_EMAIL) notes.push("email master");
    if (!user.last_sign_in_at) notes.push("belum pernah login");
    const bannedUntil = readMeta(user, "banned_until");
    if (bannedUntil && new Date(bannedUntil).getTime() > Date.now()) {
      notes.push("akun dibekukan (banned)");
    }
    if (appRole && userRole && appRole !== userRole) {
      notes.push(`label '${userRole}' beda dari app role '${appRole}'`);
    }

    const seed = seedByEmail.get(email) ?? null;
    if (!seed) notes.push("di luar seed lokal");

    rows.push({
      id: user.id,
      name: displayName(user),
      email,
      bucket: bucketFor(appRole, email, verified),
      roleLabel: appRole || (userRole ? `${userRole} (label)` : "-"),
      verified,
      lastSignIn: user.last_sign_in_at ?? null,
      createdAt: user.created_at ?? null,
      articles: owners.available ? (owners.counts.get(user.id) ?? 0) : null,
      notes,
      seedSource: seed ? seed.source : null,
    });
  }

  // Akun seed yang belum terdaftar sama sekali.
  const authEmails = new Set(rows.map((r) => r.email));
  for (const seed of seeds) {
    if (authEmails.has(seed.email)) continue;
    rows.push({
      id: `-${seed.email}`,
      name: seed.name,
      email: seed.email,
      bucket: "Tanpa Peran",
      roleLabel: "-",
      verified: false,
      lastSignIn: null,
      createdAt: null,
      articles: null,
      notes: ["seed lokal — akun TIDAK ada di Supabase Auth"],
      seedSource: seed.source,
    });
  }

  const order: Record<Bucket, number> = {
    Admin: 0,
    Editor: 1,
    Contributor: 2,
    "Tanpa Peran": 3,
  };
  rows.sort(
    (a, b) =>
      order[a.bucket] - order[b.bucket] ||
      a.name.localeCompare(b.name, "id") ||
      a.email.localeCompare(b.email)
  );

  console.log(THIN);
  console.log("DAFTAR PENGGUNA");
  console.log(THIN);
  renderTable(
    [
      { header: "Nama", width: 22, get: (r) => r.name },
      { header: "Email", width: 30, get: (r) => r.email },
      { header: "Role", width: 18, get: (r) => `${r.bucket} (${r.roleLabel})` },
      { header: "Verifikasi", width: 9, get: (r) => (r.verified ? "Ya" : "Belum") },
      { header: "Login Terakhir", width: 16, get: (r) => fmtDateTime(r.lastSignIn) },
      {
        header: "Artikel",
        width: 7,
        get: (r) => (r.articles === null ? "n/a" : String(r.articles)),
      },
      { header: "Catatan", width: 30, get: (r) => r.notes.join("; ") },
    ],
    rows
  );

  /* ---------------- Ringkasan ---------------- */
  const authRows = rows.filter((r) => !r.id.startsWith("-"));
  const seedOnlyRows = rows.filter((r) => r.id.startsWith("-"));

  console.log("");
  console.log(THIN);
  console.log("RINGKASAN");
  console.log(THIN);
  console.log(`Total akun Supabase Auth : ${authRows.length}`);
  console.log(`Total akun seed lokal    : ${seeds.length}`);
  console.log(`Seed terdaftar di Auth   : ${seeds.length - seedOnlyRows.length}`);
  console.log(`Seed belum terdaftar     : ${seedOnlyRows.length}`);

  const buckets = new Map<Bucket, number>();
  for (const r of authRows) buckets.set(r.bucket, (buckets.get(r.bucket) ?? 0) + 1);
  console.log("");
  console.log("Distribusi role efektif (hanya akun Auth):");
  for (const b of ["Admin", "Editor", "Contributor", "Tanpa Peran"] as Bucket[]) {
    console.log(`  - ${b.padEnd(12)} : ${buckets.get(b) ?? 0}`);
  }

  const verifiedCount = authRows.filter((r) => r.verified).length;
  const neverLogged = authRows.filter((r) => !r.lastSignIn).length;
  const labelOnly = authRows.filter((r) =>
    r.notes.some((n) => n.includes("hanya label"))
  );
  console.log("");
  console.log(`Email terverifikasi      : ${verifiedCount}/${authRows.length}`);
  console.log(`Belum pernah login       : ${neverLogged}/${authRows.length}`);
  console.log(`Role label saja (x-user) : ${labelOnly.length}`);
  console.log(`Di luar seed lokal       : ${authRows.filter((r) => !r.seedSource).length}`);

  console.log("");
  console.log("Kepemilikan artikel (`articles.user_id`):");
  if (owners.available) {
    console.log(`  Total artikel           : ${owners.total}`);
    console.log(`  Dengan owner            : ${owners.total - owners.withoutOwner}`);
    console.log(`  Tanpa owner (null)      : ${owners.withoutOwner}`);
    console.log(`  Owner orphan (tanpa akun): ${owners.orphanOwners.size}`);
  } else {
    console.log(`  n/a — ${owners.note}`);
  }

  /* ---------------- Temuan ---------------- */
  const findings = authRows.filter((r) => r.notes.length > 0);
  console.log("");
  console.log(THIN);
  console.log(`TEMUAN PER AKUN (${findings.length})`);
  console.log(THIN);
  if (findings.length === 0) console.log("  (tidak ada)");
  for (const r of findings) {
    console.log(`  • ${r.name} <${r.email}>`);
    for (const note of r.notes) console.log(`      - ${note}`);
  }

  if (seedOnlyRows.length > 0) {
    console.log("");
    console.log(THIN);
    console.log(`AKUN SEED YANG BELUM TERDAFTAR (${seedOnlyRows.length})`);
    console.log(THIN);
    for (const r of seedOnlyRows) {
      console.log(`  • ${r.name} <${r.email}>  [${r.seedSource}]`);
    }
  }

  /* ---------------- Audit seed vs app_metadata ---------------- */
  console.log("");
  console.log(THIN);
  console.log("AUDIT SEED — STATUS `app_metadata.role`");
  console.log(THIN);
  console.log(
    "email".padEnd(32) +
      "│ " +
      "sumber".padEnd(30) +
      "│ app_metadata.role" +
      "│ role dibuat via"
  );
  console.log(
    "─".repeat(32) +
      "┼─" +
      "─".repeat(30) +
      "┼─" +
      "─".repeat(20) +
      "┼─" +
      "─".repeat(22)
  );
  const appRoleByEmail = new Map<string, string>();
  for (const user of users) {
    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    appRoleByEmail.set(
      (readString(user.email) ?? "").toLowerCase(),
      norm(readMeta(appMeta, "role"))
    );
  }
  let seedMissingRole = 0;
  for (const seed of seeds) {
    const appRole = appRoleByEmail.get(seed.email);
    const status =
      appRole === undefined
        ? "TIDAK ADA DI AUTH"
        : appRole === ""
          ? "KOSONG (jalankan backfill-editor-roles.ts --apply)"
          : appRole;
    if (appRole === "") seedMissingRole += 1;
    console.log(
      seed.email.padEnd(32) +
        "│ " +
        seed.source.replace("scripts/", "").padEnd(30) +
        "│ " +
        status.padEnd(20) +
        "│ " +
        (seed.appRoleAtCreate
          ? "app_metadata"
          : "user_metadata (label)")
    );
  }
  console.log(
    "─".repeat(32) +
      "┼─" +
      "─".repeat(30) +
      "┼─" +
      "─".repeat(20) +
      "┼─" +
      "─".repeat(22)
  );
  console.log(
    `Catatan: ${seedMissingRole} akun seed terdaftar tetapi ` +
      "`app_metadata.role` masih kosong — akun tersebut TIDAK bisa masuk /admin."
  );

  console.log("");
  console.log(RULE);
  console.log("Audit selesai (read-only — tidak ada data yang diubah).");
  console.log(RULE);
}

main().catch((e) => {
  console.error("Audit gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
