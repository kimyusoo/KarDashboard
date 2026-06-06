import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "KAR 부동산 인사이트 | 주간 시장 동향",
  description:
    "한국공인중개사협회 회원용 주간·월간 부동산 분석 대시보드 (한국부동산원·공공데이터 기반)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
