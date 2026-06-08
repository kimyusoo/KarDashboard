"use client";

// 과거 주간/월간 리포트 다운로드 목록 (~2026.05)
function months(from: string, to: string) {
  const out: string[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return out.reverse();
}
function mondays(from: string, to: string) {
  const out: string[] = [];
  const d = new Date(from), end = new Date(to);
  while (d <= end) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 7); }
  return out.reverse();
}

export default function ReportArchive() {
  const monthList = months("2025-06", "2026-05");
  const weekList = mondays("2026-01-05", "2026-05-25");

  return (
    <div className="grid grid-2" style={{ marginTop: 20 }}>
      <div className="card">
        <div className="label" style={{ marginBottom: 10 }}>📆 월간 리포트 보관함 (2025.06 ~ 2026.05)</div>
        <div className="arch-list">
          {monthList.map((m) => (
            <div className="arch-row" key={m}>
              <span>{m.replace("-", "년 ")}월 시장동향</span>
              <a className="arch-dl" href={`/api/report-download?type=monthly&date=${m}`} download>⬇ 다운로드</a>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="label" style={{ marginBottom: 10 }}>🗓️ 주간 리포트 보관함 (~2026.05)</div>
        <div className="arch-list">
          {weekList.map((w) => (
            <div className="arch-row" key={w}>
              <span>{w} 기준 주간동향</span>
              <a className="arch-dl" href={`/api/report-download?type=weekly&date=${w}`} download>⬇ 다운로드</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
