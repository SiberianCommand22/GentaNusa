"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import styles from "./cms.module.css";

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const DASHBOARD = "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z";
const WRITE = "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z";
const POSTS = "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9M18 14h-8M15 18h-5M10 6H8v4h2";
const EXTERNAL = "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3";
const LOGOUT = "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9";
const SETTINGS = "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: DASHBOARD, exact: true },
  { href: "/admin/posts/new", label: "Tulis Berita", icon: WRITE, exact: false },
  { href: "/admin/posts", label: "Kelola Berita", icon: POSTS, exact: true },
  { href: "/admin/settings", label: "Pengaturan", icon: SETTINGS, exact: true },
];

const TITLES: Array<[string, string]> = [
  ["/admin/posts/new", "Tulis Berita"],
  ["/admin/posts/edit", "Edit Berita"],
  ["/admin/posts", "Kelola Berita"],
  ["/admin/settings", "Pengaturan"],
  ["/admin/login/gentanusa", "Login Redaksi"],
  ["/admin/login", "Login Redaksi"],
  ["/admin", "Dashboard"],
];

// Rute login privat. `/admin/login` sengaja disegel (notFound) — layout
// tetap memperlakukannya sebagai "login" supaya guard tidak mengarahkan
// pengunjung ke sana lewat pengalihan.
const LOGIN_PATH = "/admin/login/gentanusa";

type Profile = { display_name?: string | null; role?: string | null; is_admin?: boolean };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const isLogin = pathname === LOGIN_PATH || pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    fetch("/api/admin/check").then(async (r) => {
      if (!r.ok) {
        router.replace(LOGIN_PATH);
        return;
      }
      const j = (await r.json().catch(() => ({}))) as Profile;
      setProfile(j);
      setAuthed(true);
    });
  }, [isLogin, router]);

  async function logout() {
    await fetch("/api/admin/logout");
    router.replace(LOGIN_PATH);
  }

  if (isLogin) {
    return <>{children}</>;
  }

  if (!authed) {
    return <div className={styles.guard}>Memeriksa sesi...</div>;
  }

  const title = TITLES.find(([prefix]) => pathname?.startsWith(prefix))?.[1] ?? "Dashboard";
  const who = profile?.display_name ? profile.display_name : "Administrator";
  const greeting = profile?.is_admin
    ? `Selamat datang, ${who}`
    : `Selamat datang, ${who} (Penulis)`;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brand}>
            <BrandLogo theme="dark" size="md" href="/admin" />
          </div>
          <nav className={styles.nav}>
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
              // Halaman editor memuat chunk CSS/JS berat (rich-text) — jangan
              // prefetch saat sidebar tampil agar tak ada preload mubazir.
              const heavy = item.href.startsWith("/admin/posts");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={heavy ? false : undefined}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navIcon}>
                    <Icon d={item.icon} />
                  </span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}
            <a href="/" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
              <span className={styles.navIcon}>
                <Icon d={EXTERNAL} />
              </span>
              <span className={styles.navLabel}>Lihat Situs</span>
            </a>
          </nav>
        </div>
        <div className={styles.sideFooter}>
          <button className={styles.logoutBtn} onClick={logout}>
            <span className={styles.navIcon}>
              <Icon d={LOGOUT} />
            </span>
            <span className={styles.navLabel}>Keluar</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{title}</h1>
          <span className={styles.welcome}>{greeting}</span>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}