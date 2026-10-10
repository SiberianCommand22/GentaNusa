"use client";

import { useState } from "react";
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
          <p className={styles.pageSub}>Kelola kata sandi akun redaksi Anda.</p>
        </div>
      </div>

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
