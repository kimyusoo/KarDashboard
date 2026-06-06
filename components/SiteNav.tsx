"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "주간 동향" },
  { href: "/insights", label: "심화분석 (ISCU)" },
  { href: "/branches", label: "지회 안내" },
  { href: "/report", label: "리포트" },
];

export default function SiteNav() {
  const path = usePathname();
  const router = useRouter();
  if (path === "/login") return null;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="brand">
          🏠 KAR 부동산 인사이트
        </Link>
        <div className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-link"
              data-active={
                l.href === "/" ? path === "/" : path.startsWith(l.href)
              }
            >
              {l.label}
            </Link>
          ))}
          <button className="nav-link nav-logout" onClick={logout}>
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
