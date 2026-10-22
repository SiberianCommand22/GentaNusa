/**
 * Set password seragam untuk seluruh akun redaksi GentaNusa.
 *
 * Format password baru: `Genta#<NamaDepan>2026!`
 *   - NamaDepan diambil dari `user_metadata.full_name` → `name` → `display_name`
 *     → prefix email (sebelum "@", lalu sebelum separator).
 *   - Nama dibersihkan: hanya huruf/angka ASCII, kapital di awal.
 *
 * Akun master admin DILEWATI (password-nya tidak diubah):
 *   `siberiantwotwo@gmail.com` (atau MASTER_ADMIN_EMAIL / ADMIN_EMAIL).
 *
 * Setiap akun non-master dipaksa:
 *   - password baru
 *   - `app_metadata.role = "editor"` (key app_metadata lain dipertahankan)
 *   - `user_metadata.role = "editor"` (label disinkronkan; metadata lain dipertahankan)
 *   - `email_confirm = true`
 *
 * Output:
 *   - tabel ringkasan di terminal
 *   - salinan plaintext di `kredensial-redaksi.txt` (sudah masuk .gitignore)
 *
 * Env (server-only):
 *   SUPABASE_SERVICE_ROLE_KEY (disarankan) / SUPABASE_SERVICE_KEY (fallback)
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL
 *   MASTER_ADMIN_EMAIL / ADMIN_EMAIL (opsional, override email master)
 *
 * Jalankan:
 *   npx tsx scripts/set-all-passwords.ts            # terapkan
 *   npx tsx scripts/set-all-passwords.ts --dry-run  # pratinjau, tanpa menulis
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const ROOT = path.resolve(__dirname, "..");
const OUT_FILE = path.join(ROOT, "kredensial-redaksi.txt");
const PASSWORD_PREFIX = "Genta#";
const PASSWORD_SUFFIX = "2026!";
const TARGET_ROLE = "editor";
const DRY_RUN = process.argv.slice(2).includes("--dry-run");

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

const readString = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
};

const readMeta = (meta: unknown, key: string): string | null => {
  if (!meta || typeof meta !== "object") return null;
  return readString((meta as Record<string, unknown>)[key]);
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Buang diakritik, sisakan A-Z/0-9 saja. */
function sanitizeName(raw: string): string {
  const ascii = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "");
  if (!ascii) return "";
  return ascii.charAt(0).toUpperCase() + ascii.slice(1).toLowerCase();
}

type NameSource = "full_name" | "name" | "display_name" | "email";

type NameResult = {
  firstName: string;
  source: NameSource;
  raw: string;
  emailPrefix: string;
};

const EMAIL_PREFIX_SEPARATOR = /[.\-_]+/;

/** Token pertama dari nama; dipakai untuk `full_name` / `name` / `display_name`. */
function firstToken(raw: string): string {
  return raw.split(/[\s]+/).filter(Boolean)[0] ?? "";
}

/**
 * Ambil nama depan: `full_name` → `name` → `display_name` → prefix email.
 * Prefix email diambil sebelum "@" lalu sebelum separator (`.`, `_`, `-`).
 */
function resolveFirstName(user: User, email: string): NameResult {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const emailPrefix = email.split("@")[0] ?? "";
  const emailFirst = sanitizeName(emailPrefix.split(EMAIL_PREFIX_SEPARATOR)[0] ?? "");

  const candidates: { key: NameSource; value: string }[] = [
    { key: "full_name", value: readMeta(meta, "full_name") ?? "" },
    { key: "name", value: readMeta(meta, "name") ?? "" },
    { key: "display_name", value: readMeta(meta, "display_name") ?? "" },
  ];

  for (const candidate of candidates) {
    if (!candidate.value) continue;
    const cleaned = sanitizeName(firstToken(candidate.value));
    if (cleaned) {
      return {
        firstName: cleaned,
        source: candidate.key,
        raw: candidate.value,
        emailPrefix,
      };
    }
  }

  return {
    firstName: emailFirst || "User",
    source: "email",
    raw: emailPrefix,
    emailPrefix,
  };
}

function buildPassword(firstName: string): string {
  return `${PASSWORD_PREFIX}${firstName}${PASSWORD_SUFFIX}`;
}

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

type Row = {
  name: string;
  email: string;
  firstName: string;
  source: NameSource;
  password: string;
  status: "OK" | "GAGAL" | "DILEWATI";
  detail: string;
};

/**
 * Terapkan password + role + verifikasi ke satu akun.
 * `app_metadata`/`user_metadata` lama disalin lalu di-override per key,
 * sehingga metadata lain tetap utuh.
 */
async function applyToUser(
  user: User,
  password: string
): Promise<{ ok: boolean; message: string }> {
  const appMeta = { ...((user.app_metadata ?? {}) as Record<string, unknown>) };
  const userMeta = { ...((user.user_metadata ?? {}) as Record<string, unknown>) };
  appMeta.role = TARGET_ROLE;
  userMeta.role = TARGET_ROLE;

  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      app_metadata: appMeta,
      user_metadata: userMeta,
    });
    if (!error) return { ok: true, message: "password & role diperbarui" };
    lastError = error.message;
    await sleep(400 * attempt);
  }
  return { ok: false, message: lastError || "gagal memperbarui akun" };
}

/* ------------------------------------------------------------------ */
/* Output helpers                                                       */
/* ------------------------------------------------------------------ */

const RULE = "═".repeat(78);
const THIN = "─".repeat(78);

const truncate = (s: string, width: number): string =>
  s.length <= width ? s : `${s.slice(0, Math.max(1, width - 1))}…`;

function renderTable(rows: Row[]): void {
  const cols = [
    { header: "Email", width: 32, get: (r: Row) => r.email },
    { header: "Nama Depan", width: 14, get: (r: Row) => r.firstName },
    { header: "Sumber", width: 12, get: (r: Row) => r.source },
    { header: "Password Baru", width: 24, get: (r: Row) => r.password },
    { header: "Status", width: 8, get: (r: Row) => r.status },
  ];
  const sep = cols.map((c) => "─".repeat(c.width)).join("─┼─");
  console.log(sep);
  console.log(cols.map((c) => c.header.toUpperCase().padEnd(c.width)).join(" │ "));
  console.log(sep);
  for (const row of rows) {
    console.log(
      cols.map((c) => truncate(c.get(row) || "-", c.width).padEnd(c.width)).join(" │ ")
    );
  }
  console.log(sep);
}

function buildCredentialFile(rows: Row[], skipped: Row[]): string {
  const ok = rows.filter((r) => r.status === "OK");
  const lines: string[] = [];
  lines.push("KREDENSIAL REDAKSI GENTANUSA");
  lines.push("=".repeat(60));
  lines.push(`Dibuat       : ${new Date().toLocaleString("id-ID")}`);
  lines.push(`Sumber       : Supabase Auth (${SUPABASE_URL})`);
  lines.push(`Format       : ${PASSWORD_PREFIX}<NamaDepan>${PASSWORD_SUFFIX}`);
  lines.push(`Jumlah akun  : ${ok.length} (master admin dikecualikan)`);
  lines.push(
    `Perhatian    : file plaintext — jangan commit, jangan bagikan lewat chat publik.`
  );
  lines.push(`              Hapus file ini setelah kredensial didistribusikan.`);
  lines.push("");
  lines.push("EMAIL".padEnd(34) + "PASSWORD");
  lines.push("-".repeat(34) + "-".repeat(24));
  for (const row of ok) {
    lines.push(row.email.padEnd(34) + row.password);
  }
  if (skipped.length > 0) {
    lines.push("");
    lines.push("DILEWATI (TIDAK DIUBAH):");
    for (const row of skipped) {
      lines.push(`- ${row.email} — ${row.detail}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  console.log(RULE);
  console.log("SET PASSWORD SERAGAM — AKUN REDAKSI GENTANUSA");
  console.log(RULE);
  console.log(`URL      : ${SUPABASE_URL}`);
  console.log(`Master   : ${MASTER_EMAIL} (dikecualikan)`);
  console.log(`Format   : ${PASSWORD_PREFIX}<NamaDepan>${PASSWORD_SUFFIX}`);
  console.log(`Role     : app_metadata.role = "${TARGET_ROLE}"`);
  console.log(`Mode     : ${DRY_RUN ? "DRY-RUN (tidak menulis apa pun)" : "TERAPAN"}`);
  console.log("");

  const users = await fetchAllUsers();
  console.log(`Akun ditemukan: ${users.length}`);

  const rows: Row[] = [];
  const skipped: Row[] = [];
  const mismatch: Row[] = [];

  for (const user of users) {
    const email = (readString(user.email) ?? "").toLowerCase();
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const display =
      readString(meta.full_name) ??
      readString(meta.name) ??
      readString(meta.display_name) ??
      email;

    if (!email) {
      skipped.push({
        name: display,
        email: "(tanpa email)",
        firstName: "-",
        source: "email",
        password: "-",
        status: "DILEWATI",
        detail: "akun tanpa email dilewati",
      });
      continue;
    }

    if (email === MASTER_EMAIL) {
      skipped.push({
        name: display,
        email,
        firstName: "-",
        source: "email",
        password: "(tidak diubah)",
        status: "DILEWATI",
        detail: "akun master admin — password tidak diubah",
      });
      continue;
    }

    const name = resolveFirstName(user, email);
    const password = buildPassword(name.firstName);
    const row: Row = {
      name: display,
      email,
      firstName: name.firstName,
      source: name.source,
      password,
      status: "OK",
      detail: "",
    };

    // Nama depan dari metadata berbeda dari prefix email → potensi kebingungan.
    const emailFirst = sanitizeName(
      name.emailPrefix.split(EMAIL_PREFIX_SEPARATOR)[0] ?? ""
    );
    if (emailFirst && emailFirst.toLowerCase() !== name.firstName.toLowerCase()) {
      row.detail = `nama depan dari ${name.source} (prefix email: ${emailFirst})`;
      mismatch.push(row);
    }

    if (DRY_RUN) {
      row.detail = row.detail || "dry-run — belum ditulis";
      rows.push(row);
      continue;
    }

    const result = await applyToUser(user, password);
    row.status = result.ok ? "OK" : "GAGAL";
    row.detail = row.detail || result.message;
    rows.push(row);
    if (!result.ok) {
      console.error(`  ! ${email} gagal: ${result.message}`);
    }
    await sleep(120);
  }

  console.log("");
  console.log(THIN);
  console.log(DRY_RUN ? "PRATINJAU (DRY-RUN)" : "TABEL RINGKASAN");
  console.log(THIN);
  renderTable(rows);

  const okRows = rows.filter((r) => r.status === "OK");
  const failed = rows.filter((r) => r.status === "GAGAL");
  const dupes = new Map<string, string[]>();
  for (const row of okRows) {
    const list = dupes.get(row.password) ?? [];
    list.push(row.email);
    dupes.set(row.password, list);
  }
  const dupeRows = [...dupes.entries()].filter(([, list]) => list.length > 1);

  console.log("");
  console.log(`Berhasil diubah : ${okRows.length}`);
  console.log(`Gagal           : ${failed.length}`);
  console.log(`Dilewati        : ${skipped.length}`);

  if (skipped.length > 0) {
    console.log("");
    console.log("AKUN YANG DILEWATI:");
    for (const row of skipped) console.log(`  • ${row.email} — ${row.detail}`);
  }

  if (dupeRows.length > 0) {
    console.log("");
    console.log("PERINGATAN — password sama dipakai lebih dari satu akun:");
    for (const [password, list] of dupeRows) {
      console.log(`  • ${password} → ${list.join(", ")}`);
    }
  }

  if (mismatch.length > 0) {
    console.log("");
    console.log(
      "PERINGATAN — nama depan diambil dari metadata, berbeda dari prefix email:"
    );
    for (const row of mismatch) {
      console.log(`  • ${row.email} → ${row.firstName} (${row.detail})`);
    }
  }

  if (!DRY_RUN) {
    if (failed.length > 0) {
      console.error(
        "\nAda akun yang gagal diperbarui — file kredensial TIDAK ditulis."
      );
      process.exit(1);
    }
    const content = buildCredentialFile(rows, skipped);
    fs.writeFileSync(OUT_FILE, content, { encoding: "utf8", mode: 0o600 });
    console.log("");
    console.log(`Kredensial tersimpan : ${path.relative(ROOT, OUT_FILE)}`);
    console.log(
      "File ini sudah masuk .gitignore. Hapus setelah kredensial didistribusikan."
    );
  }

  console.log("");
  console.log(RULE);
  console.log(
    DRY_RUN
      ? "Dry-run selesai — tidak ada data yang diubah."
      : "Selesai — password seragam, role editor aktif, email terverifikasi."
  );
  console.log(RULE);
}

main().catch((e) => {
  console.error("Gagal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
