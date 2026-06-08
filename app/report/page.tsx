import Link from "next/link";
import ReportArchive from "@/components/ReportArchive";

export const metadata = { title: "리포트 | KAR 부동산 인사이트" };

export default function ReportHub() {
  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>📄 분석 리포트</h1>
          <div className="sub">주간·월간 부동산 분석 리포트 — PDF로 저장해 고객 상담·배포에 활용</div>
        </div>
      </div>

      <div className="summary-box" style={{ marginBottom: 20 }}>
        최신 데이터를 자동으로 반영한 <strong>인쇄용 리포트</strong>입니다. 리포트를 연 뒤
        “PDF로 저장” 버튼(또는 브라우저 인쇄 → PDF로 저장)으로 내려받아 고객에게 제공하거나
        지회 게시용으로 활용할 수 있습니다.
      </div>

      <div className="grid grid-2">
        <Link href="/report/weekly" className="report-card">
          <div className="rc-icon">🗓️</div>
          <div className="rc-title">주간 시장동향 리포트</div>
          <div className="rc-desc">전국·시도·시군구 매매/전세 가격지수와 변동률, 상승률 TOP 지역</div>
          <div className="rc-cta">리포트 열기 →</div>
        </Link>
        <Link href="/report/monthly" className="report-card">
          <div className="rc-icon">📆</div>
          <div className="rc-title">월간 시장동향 리포트</div>
          <div className="rc-desc">월간 매매/전세/월세 가격지수와 시도별 변동률 종합</div>
          <div className="rc-cta">리포트 열기 →</div>
        </Link>
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        <span className="num">⤓</span> 리포트 보관함 · 파일 다운로드
      </div>
      <ReportArchive />

      <div className="footer">
        ※ 향후 협회 회원에게 주간·월간 리포트를 이메일/알림으로 자동 발송하는 기능으로 확장할 수
        있습니다(서버리스 PDF 자동 생성 + 발송).
      </div>
    </main>
  );
}
