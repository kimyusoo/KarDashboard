import { getMarketSnapshot, type RegionPoint } from "@/lib/reb";
import PrintButton from "@/components/PrintButton";
import DateSelector from "@/components/DateSelector";

export const revalidate = 21600;
export const metadata = { title: "주간 리포트 | KAR 부동산 인사이트" };

function sign(v: number) {
  return v > 0 ? `▲ ${v.toFixed(2)}%` : v < 0 ? `▼ ${Math.abs(v).toFixed(2)}%` : "― 보합";
}
function cls(v: number) {
  return v > 0 ? "r-up" : v < 0 ? "r-down" : "";
}
function trimRegion(full: string) {
  const p = full.split(">");
  return p.length <= 1 ? full : `${p[0]} ${p[p.length - 1]}`;
}

function MiniTable({ rows, title }: { rows: RegionPoint[]; title: string }) {
  return (
    <div className="r-block">
      <h3>{title}</h3>
      <table className="r-table">
        <thead>
          <tr><th>순위</th><th>지역</th><th>지수</th><th>전주대비</th></tr>
        </thead>
        <tbody>
          {rows.slice(0, 5).map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{trimRegion(r.fullName)}</td>
              <td className="r-num">{r.index.toFixed(2)}</td>
              <td className={`r-num ${cls(r.changePct)}`}>{sign(r.changePct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function WeeklyReport({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const snap = await getMarketSnapshot(dateParam);
  const { 매매: sale, 전세: jeonse } = snap.nationwide;
  const sidoSaleTop = snap.sidoSale[0];
  const sidoJeonseTop = snap.sidoJeonse[0];

  return (
    <main className="report-page">
      <div className="report-toolbar no-print">
        <a href="/report" className="back-link">← 리포트 목록</a>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <DateSelector
            resolvedDate={snap.latestWeek}
            selected={dateParam}
            basePath="/report/weekly"
          />
          <PrintButton />
        </div>
      </div>

      <div className="report-sheet">
        <header className="r-header">
          <div>
            <div className="r-kicker">한국공인중개사협회 · 주간 분석 리포트</div>
            <h1 className="r-title">주간 아파트 시장동향</h1>
          </div>
          <div className="r-meta">
            <div>기준일 <strong>{snap.latestWeek}</strong></div>
            <div>출처: 한국부동산원 · 공공데이터</div>
          </div>
        </header>

        <section className="r-summary">
          <p>
            금주 전국 주간 아파트 <b className={cls(sale.changePct)}>매매가격 {sign(sale.changePct)}</b>,{" "}
            <b className={cls(jeonse.changePct)}>전세가격 {sign(jeonse.changePct)}</b>를 기록했습니다.
            매매 상승률 1위 시도는 <b>{sidoSaleTop?.region}</b>({sign(sidoSaleTop?.changePct ?? 0)}),
            전세 상승률 1위 시도는 <b>{sidoJeonseTop?.region}</b>({sign(sidoJeonseTop?.changePct ?? 0)})이며,
            시군구 단위 최고 상승은 <b>{trimRegion(snap.sigunguSaleTop[0]?.fullName ?? "")}</b>
            (매매 {sign(snap.sigunguSaleTop[0]?.changePct ?? 0)})입니다.
          </p>
        </section>

        <section className="r-kpis">
          {[
            { k: "전국 매매지수", v: sale.index.toFixed(2), d: sale.changePct },
            { k: "전국 전세지수", v: jeonse.index.toFixed(2), d: jeonse.changePct },
            { k: "매매 1위 시도", v: sidoSaleTop?.region ?? "-", d: sidoSaleTop?.changePct ?? 0 },
            { k: "전세 1위 시도", v: sidoJeonseTop?.region ?? "-", d: sidoJeonseTop?.changePct ?? 0 },
          ].map((x, i) => (
            <div className="r-kpi" key={i}>
              <div className="r-kpi-label">{x.k}</div>
              <div className="r-kpi-value">{x.v}</div>
              <div className={`r-kpi-delta ${cls(x.d)}`}>{sign(x.d)}</div>
            </div>
          ))}
        </section>

        <div className="r-cols">
          <MiniTable rows={snap.sidoSale} title="시도별 매매 상승률 TOP5" />
          <MiniTable rows={snap.sidoJeonse} title="시도별 전세 상승률 TOP5" />
        </div>
        <div className="r-cols">
          <MiniTable rows={snap.sigunguSaleTop} title="시군구 매매 상승률 TOP5" />
          <MiniTable rows={snap.sigunguJeonseTop} title="시군구 전세 상승률 TOP5" />
        </div>

        <footer className="r-footer">
          본 리포트는 한국부동산원 R-ONE 주간 통계와 공공데이터를 바탕으로 자동 생성되었습니다. ·
          KAR 부동산 인사이트
        </footer>
      </div>
    </main>
  );
}
