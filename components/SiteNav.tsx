"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "주간 동향" },
  { href: "/insights", label: "심화분석 (ISCU)" },
];

export default function SiteNav() {
  const path = usePathname();
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
        </div>
      </div>
    </nav>
  );
}
