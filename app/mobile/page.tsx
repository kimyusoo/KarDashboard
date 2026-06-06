import Link from "next/link";
import { getMarketSnapshot, getMonthlySnapshot } from "@/lib/reb";
import Sparkline from "@/components/Sparkline";

export const revalidate = 21600;
export const metadata = { title: "모바일 — 현장 상담용 | KAR 부동산 인사이트" };

function fmtPct(v: number) {
  return v > 0 ? `+${v.toFixed(2)}%` : v < 0 ? `${v.toFixed(2)}%` : "0.00%";
}
function signColor(v: number) {
  return v > 0 ? "var(--up)" : v < 0 ? "var(--down)" : "var(--flat)";
}
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
  } catch {
    /* ignore */
  }

  const sale = snap.nationwide.매매;
  const jeonse = snap.nationwide.전세;
  const heroes = [
    { t: "매매", v: sale.changePct },
    { t: "전세", v: jeonse.changePct },
    { t: "월세", v: wolseChange },
  ];
  const series = snap.trend.map((t) => t.매매);
  const top3 = snap.sigunguSaleTop.slice(0, 3);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>📱 모바일 — 현장 상담용</h1>
          <div className="sub">고객 앞에서 바로 보여주는 컴팩트 화면 · 한국부동산원 {snap.latestWeek}</div>
        </div>
      </div>

      <div className="section-title">
        <span className="num">M</span> 언제 어디서나, 고객 옆에서
        <span className="pill" style={{ marginLeft: 4 }}>현장 상담</span>
      </div>

      <div className="mobile-stage">
        {/* 폰 목업 */}
        <div className="phone">
          <div className="phone-notch" />
          <div className="phone-screen">
            <div className="m-app">
              <div className="m-top">
                <div className="m-brand">
                  <span className="m-mark">KAR</span>
                  <span>부동산 인사이트</span>
                </div>
                <span className="m-bell">🔔</span>
              </div>
              <div className="m-region">
                <span className="m-region-name">전국 ▾</span>
                <span className="m-cyc">주간</span>
              </div>
              <div className="m-scroll">
                <div className="m-hero">
                  <span className="m-hero-lab">한국부동산원 {snap.latestWeek} 기준</span>
                  <div className="m-hero-row">
                    {heroes.map((h) => (
                      <div key={h.t} className="m-hero-i">
                        <span className="m-hero-t">{h.t}</span>
                        <span className="m-hero-v" style={{ color: signColor(h.v) }}>
                          {fmtPct(h.v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="m-card">
                  <div className="m-card-h">매매가격지수 추이</div>
                  <Sparkline data={series} w={250} h={56} />
                </div>

                <div className="m-card">
                  <div className="m-card-h">매매 상승률 1위</div>
                  {top3.map((r, i) => (
                    <div key={i} className="m-rank">
                      <span className="m-rank-no">{i + 1}</span>
                      <span className="m-rank-name">{trimRegion(r.fullName)}</span>
                      <span className="m-rank-v" style={{ color: "var(--up)" }}>
                        {fmtPct(r.changePct)}
                      </span>
                    </div>
                  ))}
                </div>

                <button className="m-aibtn">✦ 고객용 AI 리포트 생성</button>
                <div className="m-foot">서울사이버대 AI빅데이터 · 공공데이터 · 한국부동산원</div>
              </div>
              <div className="m-tabbar">
                <span className="m-tab on">📊 동향</span>
                <span className="m-tab">🏠 실거래</span>
                <span className="m-tab">📍 지회</span>
                <span className="m-tab">≡ 더보기</span>
              </div>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="mobile-aside">
          <h3>언제 어디서나, 고객 옆에서</h3>
          <p>
            회원이 현장에서 스마트폰으로 즉시 관할 지역의 시세·거래량·상승 단지를 확인하고,
            고객에게 신뢰도 높은 데이터를 바로 보여줄 수 있습니다.
          </p>
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
        ※ 모바일 화면은 현재 데스크톱 대시보드와 동일한 실데이터를 기반으로 한 미리보기이며,
        전용 모바일 앱/PWA 및 푸시 알림·QR 공유는 다음 단계로 확장 가능합니다.
      </div>
    </main>
  );
}
