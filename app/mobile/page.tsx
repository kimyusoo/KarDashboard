import Link from "next/link";
import { getMarketSnapshot, getMonthlySnapshot } from "@/lib/reb";
import MobilePhone from "@/components/MobilePhone";

export const revalidate = 21600;
export const metadata = { title: "모바일 — 현장 상담용 | KAR 부동산 인사이트" };

function trimRegion(full: string) {
  const p = full.split(">");
  return p.length <= 1 ? full : `${p[0]} ${p[p.length - 1]}`;
}

export default async function MobilePage() {
  const snap = await getMarketSnapshot();
  let wolseChange = 0;
  try {
    const m = await getMonthlySnapshot();
    wolseChange = m.nationwide.월세.changePct;
  } catch { /* ignore */ }

  const heroes = [
    { t: "매매", v: snap.nationwide.매매.changePct },
    { t: "전세", v: snap.nationwide.전세.changePct },
    { t: "월세", v: wolseChange },
  ];
  const series = snap.trend.map((t) => t.매매);
  const top3 = snap.sigunguSaleTop.slice(0, 3).map((r) => ({ name: trimRegion(r.fullName), chg: r.changePct }));

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>📱 모바일 — 현장 상담용</h1>
          <div className="sub">고객 앞에서 바로 보여주는 컴팩트 화면 · 한국부동산원 {snap.latestWeek}</div>
        </div>
      </div>

      <div className="section-title">
        <span className="num">M</span> 언제 어디서나, 고객 옆에서 <span className="pill">현장 상담</span>
      </div>

      <div className="mobile-stage">
        <MobilePhone asOf={snap.latestWeek} heroes={heroes} series={series} top3={top3} />
        <div className="mobile-aside">
          <h3>언제 어디서나, 고객 옆에서</h3>
          <p>회원이 현장에서 스마트폰으로 즉시 관할 지역의 시세·거래량·상승 단지를 확인하고, 고객에게 신뢰도 높은 데이터를 바로 보여줄 수 있습니다. <b>왼쪽 화면을 클릭</b>하면 실제 모바일 화면처럼 크게 볼 수 있습니다.</p>
          <ul>
            <li><b>오프라인 상담</b> 매물 브리핑 시 객관적 근거 제시</li>
            <li><b>푸시 알림</b> 주간·월간 리포트 발행 알림</li>
            <li><b>QR 공유</b> 고객에게 분석 리포트 즉시 전달</li>
            <li><b>실시간 데이터</b> 한국부동산원 주간 통계 자동 반영</li>
          </ul>
          <div style={{ marginTop: 22 }}>
            <Link href="/report" className="login-btn" style={{ display: "inline-block", width: "auto", padding: "11px 20px", textDecoration: "none" }}>
              주간·월간 리포트 보기 →
            </Link>
          </div>
        </div>
      </div>

      <div className="footer">
        ※ 모바일 화면은 현재 데스크톱 대시보드와 동일한 실데이터 기반 미리보기이며, 전용 모바일 앱/PWA·푸시 알림·QR 공유는 다음 단계로 확장 가능합니다.
      </div>
    </main>
  );
}
