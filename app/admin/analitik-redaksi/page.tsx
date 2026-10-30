"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../cms.module.css";

type RangeKey = "hari-ini" | "7-hari" | "bulan-ini" | "semua";

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "hari-ini", label: "Hari Ini" },
  { key: "7-hari", label: "7 Hari" },
  { key: "bulan-ini", label: "Bulan Ini" },
  { key: "semua", label: "Semua Waktu" },
];

type CategoryStat = {
  slug: string;
  name: string;
  label: string;
  count: number;
  countToday: number;
  totalAll: number;
  hasUpload: boolean;
  latest: { title: string; createdAt: string | null } | null;
};

type RedakturStat = {
  name: string;
  email: string | null;
  slug: string;
  uploadsInRange: number;
  uploadsToday: number;
  totalAll: number;
  lastArticle: { title: string; createdAt: string | null } | null;
};

type Payload = {
  range: RangeKey;
  rangeLabel: string;
  summary: {
    totalInRange: number;
    totalToday: number;
    kategoriTerisi: number;
    kategoriTotal: number;
    redakturAktif: number;
    redakturTerdaftar: number;
    kategoriTerpopuler: { name: string; count: number } | null;
  };
  categories: CategoryStat[];
  redaktur: RedakturStat[];
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export default function AnalitikRedaksiPage() {
  const [range, setRange] = useState<RangeKey>("hari-ini");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"today" | "total">("today");

  const load = useCallback(async (r: RangeKey) => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/admin/analitik-redaksi?range=${r}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const detail =
          typeof j.error === "string" && j.error ? j.error : `kode ${res.status}`;
        setLoadError(`Gagal memuat analitik: ${detail}`);
        setData(null);
        return;
      }
      const json = (await res.json()) as Payload;
      setData(json);
    } catch {
      setLoadError("Gagal memuat analitik: server tidak terjangkau.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => load(range), 0);
    return () => window.clearTimeout(t);
  }, [load, range]);

  const redakturFiltered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const list = q
      ? data.redaktur.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.slug.toLowerCase().includes(q) ||
            (r.email !== null && r.email.toLowerCase().includes(q))
        )
      : data.redaktur;
    return [...list].sort((a, b) =>
      sort === "today"
        ? b.uploadsToday - a.uploadsToday || b.totalAll - a.totalAll
        : b.totalAll - a.totalAll || b.uploadsToday - a.uploadsToday
    );
  }, [data, search, sort]);

  const summary = data?.summary;

  return (
    <div>
      <div className={styles.pageHead}>
        <div>
          <h2 className={styles.pageHeading}>Analitik & Monitoring Redaksi</h2>
          <p className={styles.pageSub}>
            Status unggahan per kategori dan produktivitas redaktur
            {data ? ` — rentang ${data.rangeLabel}` : ""}
          </p>
        </div>
        <Link href="/admin/posts" className={styles.primaryBtn}>
          Kelola Berita
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={styles.primaryBtn}
            style={{
              opacity: range === r.key ? 1 : 0.6,
              outline: range === r.key ? "2px solid #2563eb" : undefined,
            }}
            aria-pressed={range === r.key}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loadError && (
        <p className={styles.err} role="alert" style={{ marginBottom: 16 }}>
          {loadError}
        </p>
      )}

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Total Berita Hari Ini</p>
          <p className={`${styles.metricValue} ${styles.metricAccent}`}>
            {loading ? "…" : summary?.totalToday ?? 0}
          </p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Kategori Terisi</p>
          <p className={`${styles.metricValue} ${styles.metricGreen}`}>
            {loading
              ? "…"
              : `${summary?.kategoriTerisi ?? 0} / ${summary?.kategoriTotal ?? 0}`}
          </p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Redaktur Aktif Hari Ini</p>
          <p className={`${styles.metricValue} ${styles.metricAmber}`}>
            {loading
              ? "…"
              : `${summary?.redakturAktif ?? 0} / ${summary?.redakturTerdaftar ?? 0}`}
          </p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Kategori Paling Produktif</p>
          <p className={`${styles.metricValue} ${styles.metricAccent}`}>
            {loading
              ? "…"
              : summary?.kategoriTerpopuler
                ? `${summary.kategoriTerpopuler.name} (${summary.kategoriTerpopuler.count})`
                : "—"}
          </p>
        </div>
      </div>

      {/* Panel 1: matriks status unggahan per kategori */}
      <section style={{ marginTop: 28 }}>
        <h3 className={styles.pageHeading} style={{ fontSize: 18, marginBottom: 12 }}>
          Status Unggahan per Kategori
        </h3>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.metricCard} style={{ minHeight: 84 }}>
                  …
                </div>
              ))
            : (data?.categories ?? []).map((c) => (
                <div key={c.slug} className={styles.metricCard}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <p style={{ fontWeight: 600, margin: 0 }}>{c.label}</p>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: c.hasUpload ? "#dcfce7" : "#fee2e2",
                        color: c.hasUpload ? "#166534" : "#991b1b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.hasUpload
                        ? `✓ Sudah Upload (${c.countToday} Berita)`
                        : "! Belum Ada Berita Hari Ini"}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#334155",
                    }}
                  >
                    {c.countToday} hari ini · {c.totalAll} total
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#64748b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={c.latest?.title ?? undefined}
                  >
                    {c.latest
                      ? `${c.latest.title} · ${formatTime(c.latest.createdAt)}`
                      : "Belum ada berita terbit di kategori ini."}
                  </p>
                </div>
              ))}
        </div>
      </section>

      {/* Panel 2: leaderboard produktivitas redaktur */}
      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <h3 className={styles.pageHeading} style={{ fontSize: 18, margin: 0 }}>
            Produktivitas Redaktur
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / email…"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                minWidth: 180,
              }}
              aria-label="Cari redaktur"
            />
            <button
              type="button"
              onClick={() => setSort((s) => (s === "today" ? "total" : "today"))}
              className={styles.primaryBtn}
            >
              Urut: {sort === "today" ? "Upload Hari Ini" : "Total Kontribusi"}
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "10px 8px" }}>Redaktur</th>
                <th style={{ padding: "10px 8px" }}>Status</th>
                <th style={{ padding: "10px 8px" }}>Upload Hari Ini</th>
                <th style={{ padding: "10px 8px" }}>Total Kontribusi</th>
                <th style={{ padding: "10px 8px" }}>Artikel Terakhir</th>
                <th style={{ padding: "10px 8px" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: "#64748b" }}>
                    Memuat…
                  </td>
                </tr>
              ) : redakturFiltered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: "#64748b" }}>
                    {data?.redaktur.length === 0
                      ? "Belum ada akun redaksi terdaftar."
                      : "Tidak ada redaktur yang cocok dengan pencarian."}
                  </td>
                </tr>
              ) : (
                redakturFiltered.map((r) => (
                  <tr
                    key={r.slug || r.email || r.name}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "10px 8px" }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{r.name}</p>
                      {r.email && (
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: 12,
                            color: "#64748b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 220,
                          }}
                          title={r.email}
                        >
                          {r.email}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: r.uploadsToday > 0 ? "#dcfce7" : "#f1f5f9",
                          color: r.uploadsToday > 0 ? "#166534" : "#64748b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.uploadsToday > 0 ? "Aktif Hari Ini" : "Belum Ada Rilis"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: r.uploadsToday > 0 ? "#dcfce7" : "#f1f5f9",
                          color: r.uploadsToday > 0 ? "#166534" : "#64748b",
                        }}
                      >
                        {r.uploadsToday}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px" }}>{r.totalAll}</td>
                    <td
                      style={{
                        padding: "10px 8px",
                        maxWidth: 280,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#64748b",
                      }}
                      title={r.lastArticle?.title ?? undefined}
                    >
                      {r.lastArticle
                        ? `${r.lastArticle.title} · ${formatTime(r.lastArticle.createdAt)}`
                        : "—"}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <Link
                        href={r.slug ? `/penulis/${r.slug}` : `/cari?q=${encodeURIComponent(r.name)}`}
                        className={styles.navLink}
                        style={{ fontSize: 13 }}
                        prefetch={false}
                      >
                        Lihat Arsip →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
