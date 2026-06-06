import { getMonthlySnapshot, type RegionPoint } from "@/lib/reb";
import PrintButton from "@/components/PrintButton";

export const revalidate = 21600;
export const metadata = { title: "월간 리포트 | KAR 부동산 인사이트" };

function sign(v: number) {
  return v > 0 ? `▲ ${v.toFixed(2)}%` : v < 0 ? `▼ ${Math.abs(v).toFixed(2)}%` : "― 보합";
}
function cls(v: number) {
  return v > 0 ? "r-up" : v < 0 ? "r-down" : "";
}

function SidoTable({ rows, title }: { rows: RegionPoint[]; title: string }) {
  return (
    <div className="r-block">
      <h3>{title}</h3>
      <table className="r-table">
        <thead><tr><th>순위</th><th>시도</th><th>지수</th><th>전월대비</th></tr></thead>
        <tbody>
          {rows.slice(0, 6).map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{r.region}</td>
              <td className="r-num">{r.index.toFixed(2)}</td>
              <td className={`r-num ${cls(r.changePct)}`}>{sign(r.changePct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function MonthlyReport() {
  const m = await getMonthlySnapshot();
  const { 매매, 전세, 월세 } = m.nationwide;

  return (
    <main className="report-page">
      <div className="report-toolbar no-print">
        <a href="/report" className="back-link">← 리포트 목록</a>
        <PrintButton />
      </div>

      <div className="report-sheet">
        <header className="r-header">
          <div>
            <div className="r-kicker">한국공인중개사협회 · 월간 분석 리포트</div>
            <h1 className="r-title">월간 아파트 시장동향</h1>
          </div>
          <div className="r-meta">
            <div>기준월 <strong>{m.latestMonth}</strong></div>
            <div>출처: 한국부동산원</div>
          </div>
        </header>

        <section className="r-summary">
          <p>
            {m.latestMonth} 기준 전국 아파트{" "}
            <b className={cls(매매.changePct)}>매매 {sign(매매.changePct)}</b>,{" "}
            <b className={cls(전세.changePct)}>전세 {sign(전세.changePct)}</b>,{" "}
            <b className={cls(월세.changePct)}>월세 {sign(월세.changePct)}</b>의 변동을 보였습니다.
            (전월대비)
          </p>
        </section>

        <section className="r-kpis">
          {[
            { k: "매매가격지수", v: 매매.index.toFixed(2), d: 매매.changePct },
            { k: "전세가격지수", v: 전세.index.toFixed(2), d: 전세.changePct },
            { k: "월세가격지수", v: 월세.index.toFixed(2), d: 월세.changePct },
          ].map((x, i) => (
            <div className="r-kpi" key={i}>
              <div className="r-kpi-label">{x.k}</div>
              <div className="r-kpi-value">{x.v}</div>
              <div className={`r-kpi-delta ${cls(x.d)}`}>{sign(x.d)}</div>
            </div>
          ))}
        </section>

        <div className="r-cols">
          <SidoTable rows={m.sidoByType.매매} title="시도별 매매 변동률 TOP6" />
          <SidoTable rows={m.sidoByType.전세} title="시도별 전세 변동률 TOP6" />
        </div>
        <div className="r-cols">
          <SidoTable rows={m.sidoByType.월세} title="시도별 월세 변동률 TOP6" />
          <div className="r-block r-note">
            <h3>참고</h3>
            <p>
              월세 지수는 한국부동산원 월간 아파트 월세가격지수를 기준으로 합니다. 매매·전세 대비
              월세는 변동폭이 작은 경향이 있으며, 전월세 전환 추세와 함께 해석하는 것이 유용합니다.
            </p>
          </div>
        </div>

        <footer className="r-footer">
          본 리포트는 한국부동산원 월간 통계를 바탕으로 자동 생성되었습니다. · KAR 부동산 인사이트
        </footer>
      </div>
    </main>
  );
}
