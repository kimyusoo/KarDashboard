"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "동향 · 핵심지표", icon: "📊" },
  { href: "/map", label: "통계기상도", icon: "🗺️" },
  { href: "/insights", label: "AI 빅데이터", icon: "🧠" },
  { href: "/branches", label: "지회 안내", icon: "📍" },
  { href: "/report", label: "리포트", icon: "📄" },
  { href: "/mobile", label: "모바일", icon: "📱" },
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
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">KAR</span>
            <span className="brand-tt">
              <span className="brand-name">부동산 인사이트</span>
              <span className="brand-sub">한국공인중개사협회 회원 전용</span>
            </span>
          </Link>
          <div className="topbar-spacer" />
          <div className="topbar-right">
            <button className="topbar-logout" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
      <div className="menubar">
        <div className="menubar-inner">
          <div className="menubar-nav">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="menubar-link"
                data-active={
                  l.href === "/" ? path === "/" : path.startsWith(l.href)
                }
              >
                <span className="mb-ico">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="menubar-srcs">
            <span className="src-chip src-gov">부동산원 API</span>
            <span className="src-chip src-kb">공공데이터</span>
            <span className="src-chip src-iscu">ISCU AI</span>
          </div>
        </div>
      </div>
    </>
  );
}
