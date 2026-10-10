"use client";

import { useEffect, useState } from "react";
import styles from "../cms.module.css";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

const LABELS: Record<Field, string> = {
  currentPassword: "Kata Sandi Saat Ini",
  newPassword: "Kata Sandi Baru",
  confirmPassword: "Konfirmasi Kata Sandi Baru",
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Record<Field, string>>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visible, setVisible] = useState<Record<Field, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Profil penulis: email read-only + nama tampilan editable.
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/check")
      .then(async (r) => {
        if (!r.ok) return;
        const j = (await r.json().catch(() => ({}))) as {
          email?: string;
          display_name?: string;
        };
        if (typeof j.email === "string") setEmail(j.email);
        if (typeof j.display_name === "string") setDisplayName(j.display_name);
      })
      .catch(() => {});
  }, []);

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileNotice(null);
    try {
      const r = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        error?: string;
        user?: { display_name?: string };
      };
      if (r.ok && j.success) {
        if (typeof j.user?.display_name === "string") setDisplayName(j.user.display_name);
        setProfileNotice({ ok: true, text: j.message || "Nama penulis berhasil diperbarui" });
      } else {
        setProfileNotice({ ok: false, text: j.error || `Gagal menyimpan (kode ${r.status}).` });
      }
    } catch {
      setProfileNotice({ ok: false, text: "Jaringan bermasalah. Coba lagi." });
    } finally {
      setProfileLoading(false);
    }
  }

  function set(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggle(field: Field) {
    setVisible((v) => ({ ...v, [field]: !v[field] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = (await r.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        error?: string;
      };
      if (r.ok && (j.success || j.message)) {
        setNotice({ ok: true, text: j.message || "Kata sandi berhasil diperbarui" });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setNotice({ ok: false, text: j.error || `Gagal memperbarui (kode ${r.status}).` });
      }
    } catch {
      setNotice({ ok: false, text: "Jaringan bermasalah. Coba lagi." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageHeading}>Pengaturan</h2>
          <p className={styles.pageSub}>Kelola profil penulis dan kata sandi akun redaksi Anda.</p>
        </div>
      </div>

      <section className={styles.panel} style={{ maxWidth: 560, marginBottom: 20 }}>
        <h3 className={styles.panelTitle}>Profil Penulis / Nama Tampilan</h3>
        {profileNotice && (
          <p className={profileNotice.ok ? styles.msg : styles.err} role="status">
            {profileNotice.text}
          </p>
        )}
        <form onSubmit={submitProfile}>
          <div className={styles.field} style={{ marginBottom: 14 }}>
            <label className={styles.fieldLabel} htmlFor="field-email">
              Email Login
            </label>
            <input
              id="field-email"
              type="email"
              className={styles.input}
              value={email}
              readOnly
              disabled
              aria-describedby="field-email-help"
            />
            <p className={styles.help} id="field-email-help">
              Email login tidak dapat diubah.
            </p>
          </div>
          <div className={styles.field} style={{ marginBottom: 14 }}>
            <label className={styles.fieldLabel} htmlFor="field-display-name">
              Nama Tampilan / Nama Penulis
            </label>
            <input
              id="field-display-name"
              type="text"
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={profileLoading}
              placeholder="Nama pena atau nama lengkap"
              maxLength={60}
            />
          </div>
          <button type="submit" className={styles.primaryBtn} disabled={profileLoading}>
            {profileLoading ? "Menyimpan..." : "Simpan Nama Penulis"}
          </button>
        </form>
      </section>

      <section className={styles.panel} style={{ maxWidth: 560 }}>
        <h3 className={styles.panelTitle}>Ganti Password</h3>
        {notice && (
          <p className={notice.ok ? styles.msg : styles.err} role="status">
            {notice.text}
          </p>
        )}
        <form onSubmit={submit}>
          {(Object.keys(LABELS) as Field[]).map((field) => (
            <div key={field} className={styles.field} style={{ marginBottom: 14 }}>
              <label className={styles.fieldLabel} htmlFor={`field-${field}`}>
                {LABELS[field]}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id={`field-${field}`}
                  type={visible[field] ? "text" : "password"}
                  autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                  className={styles.input}
                  style={{ paddingRight: 64 }}
                  value={form[field]}
                  onChange={(e) => set(field, e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => toggle(field)}
                  aria-label={visible[field] ? "Sembunyikan" : "Tampilkan"}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    color: "#64748B",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  {visible[field] ? "Sembunyi" : "Lihat"}
                </button>
              </div>
            </div>
          ))}
          <p className={styles.help}>
            Minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.
          </p>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </section>
    </div>
  );
}
