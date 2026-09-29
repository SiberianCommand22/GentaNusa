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

const NAV = [
  { href: "/admin", label: "Dashboard", icon: DASHBOARD, exact: true },
  { href: "/admin/posts/new", label: "Tulis Berita", icon: WRITE, exact: false },
  { href: "/admin/posts", label: "Kelola Berita", icon: POSTS, exact: true },
];

const TITLES: Array<[string, string]> = [
  ["/admin/posts/new", "Tulis Berita"],
  ["/admin/posts", "Kelola Berita"],
  ["/admin/login", "Login CMS"],
  ["/admin", "Dashboard"],
];

type Profile = { display_name?: string; role?: string };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    fetch("/api/admin/check").then(async (r) => {
      if (!r.ok) {
        router.replace("/admin/login");
        return;
      }
      const j = (await r.json().catch(() => ({}))) as Profile;
      setProfile(j);
      setAuthed(true);
    });
  }, [isLogin, router]);

  async function logout() {
    await fetch("/api/admin/logout");
    router.replace("/admin/login");
  }

  // Halaman login tampil mandiri — tanpa sidebar CMS.
  if (isLogin) {
    return <>{children}</>;
  }

  if (!authed) {
    return <div className={styles.guard}>Memeriksa sesi…</div>;
  }

  const title = TITLES.find(([prefix]) => pathname?.startsWith(prefix))?.[1] ?? "Dashboard";
  const greeting = profile?.display_name ? `Selamat datang, ${profile.display_name}` : "Selamat datang, Administrator";

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
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
