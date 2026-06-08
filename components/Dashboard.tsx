"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardData, PeriodData, RegionBlock, RegionPoint, SidoChg, TrendPt } from "@/lib/reb";
import { SIDO } from "@/lib/reb";
import ChangeBarChart from "./ChangeBarChart";
import PriceIndexChart, { type IdxPt } from "./PriceIndexChart";
import DateSelector from "./DateSelector";
import InfoTip from "./InfoTip";

type Period = "weekly" | "monthly";
type Trade = "매매" | "전세" | "월세";

const EXPLAIN = {
  index: "가격지수: 특정 기준시점을 100으로 두고 현재 가격 수준을 나타내는 지표입니다. 100보다 크면 기준시점 대비 가격이 오른 상태이며, 변동률(%)은 직전 기간 대비 지수의 증감입니다. (한국부동산원)",
  매매: "매매가격지수: 아파트 매매(소유권 거래) 가격 수준의 변화를 지수화한 값입니다.",
  전세: "전세가격지수: 아파트 전세 보증금 수준의 변화를 지수화한 값입니다.",
  월세: "월세가격지수: 아파트 월세 가격 수준의 변화를 지수화한 값입니다. (월간 통계)",
  변동률: "변동률: 직전 기간(주간=전주, 월간=전월) 대비 가격지수의 증감률(%). 양(+)은 상승, 음(−)은 하락.",
  combo: "주황 선 = 가격지수(좌측 축), 막대 = 직전 기간 대비 변동률%(우측 축, 상승=빨강·하락=파랑).",
};

function pct(v: number) { return v > 0 ? `▲ ${v.toFixed(2)}%` : v < 0 ? `▼ ${Math.abs(v).toFixed(2)}%` : "― 보합"; }
function cls(v: number) { return v > 0 ? "up" : v < 0 ? "down" : "flat"; }
function trimRegion(full: string) { const p = full.split(">"); return p.length <= 1 ? full : `${p[0]} ${p[p.length - 1]}`; }
function toRP(name: string, chg: number, idx: number): RegionPoint {
  return { region: name, fullName: name, isSido: true, isGroup: false, index: idx, prevIndex: idx, changePct: chg };
}
function toIdxPts(trend: TrendPt[], key: Trade): IdxPt[] {
  return trend.map((p, i) => {
    const idx = (p[key] as number) ?? 0;
    const prev = i > 0 ? ((trend[i - 1][key] as number) ?? 0) : 0;
    const chg = prev ? Math.round(((idx - prev) / prev) * 10000) / 100 : 0;
    return { t: p.t, idx, chg };
  });
}

export default function Dashboard({ data, selectedDate }: { data: DashboardData; selectedDate?: string }) {
  const [period, setPeriod] = useState<Period>("weekly");
  const [sidoSel, setSidoSel] = useState<string>("전국");
  const [sgSel, setSgSel] = useState<string>(""); // 시군구 fullName ("" = 시도 전체)
  const [showMore, setShowMore] = useState(false);
  const [comboTrade, setComboTrade] = useState<Trade>("매매");

  const [sgBlock, setSgBlock] = useState<{ weekly: RegionBlock | null; monthly: RegionBlock | null } | null>(null);
  const [sgLoading, setSgLoading] = useState(false);

  const pd: PeriodData = data[period];
  const monthly = data.monthly;
  const periodLabel = period === "weekly" ? "주간" : "월간";
  const prevLabel = period === "weekly" ? "전주" : "전월";

  // 시군구 온디맨드 로드
  useEffect(() => {
    if (!sgSel) { setSgBlock(null); return; }
    setSgLoading(true);
    const q = `/api/region?region=${encodeURIComponent(sgSel)}${selectedDate ? `&date=${selectedDate}` : ""}`;
    fetch(q).then((r) => r.json()).then((d) => setSgBlock(d)).catch(() => setSgBlock(null)).finally(() => setSgLoading(false));
  }, [sgSel, selectedDate]);

  // 시도 변경 시 시군구 초기화
  function changeSido(v: string) { setSidoSel(v); setSgSel(""); }

  const regionName = sgSel ? trimRegion(sgSel) : sidoSel;
  const sigunguOptions = useMemo(
    () => (sidoSel === "전국" ? [] : pd.sigungu.filter((s) => s.parent === sidoSel)),
    [pd, sidoSel],
  );

  // 현재 표시 블록
  const block: RegionBlock | null = sgSel ? (sgBlock?.[period] ?? null) : (pd.regions[sidoSel] ?? pd.regions["전국"]);
  const wolseBlock = sgSel ? sgBlock?.monthly?.월세 : (monthly.regions[sidoSel]?.월세 ?? monthly.regions["전국"]?.월세);
  const loading = sgSel ? sgLoading : false;

  // 콤보차트 데이터
  const comboData = useMemo(() => {
    if (!block) return [];
    return toIdxPts(block.trend, comboTrade);
  }, [block, comboTrade]);

  // 요약
  const summary = useMemo(() => {
    const nat = pd.regions["전국"];
    const natWolse = monthly.regions["전국"]?.월세?.chg ?? 0;
    const upS = pd.sido.filter((s) => s.매매 > 0).length;
    const downS = pd.sido.filter((s) => s.매매 < 0).length;
    const flatS = pd.sido.length - upS - downS;
    const bySaleDesc = [...pd.sido].sort((a, b) => b.매매 - a.매매);
    const topUp = bySaleDesc.filter((s) => s.매매 > 0).slice(0, 2).map((s) => s.name);
    const topDown = bySaleDesc.filter((s) => s.매매 < 0).slice(-2).reverse().map((s) => s.name);
    const sgUp = [...pd.sigungu].sort((a, b) => b.매매 - a.매매)[0];
    const sgDown = [...pd.sigungu].sort((a, b) => a.매매 - b.매매)[0];
    const short = `${pd.asOf} 기준 전국 아파트 매매가격은 ${pct(nat.매매.chg)} (상승 ${upS}곳·보합 ${flatS}곳·하락 ${downS}곳), 전세 ${pct(nat.전세.chg)}, 월세 ${pct(natWolse)}. 상승은 ${topUp.join("·") || "—"} 중심, 하락은 ${topDown.join("·") || "—"} 중심입니다.`;
    return { short, nat, natWolse, bySaleDesc, sgUp, sgDown };
  }, [pd, monthly]);

  const sidoSale = useMemo(() => [...pd.sido].sort((a, b) => b.매매 - a.매매), [pd]);
  const sidoJeonse = useMemo(() => [...pd.sido].sort((a, b) => b.전세 - a.전세), [pd]);

  const parentSido = sgSel ? sgSel.split(">")[0] : (sidoSel !== "전국" ? sidoSel : null);
  const sgScope = useMemo(() => (parentSido ? pd.sigungu.filter((s) => s.parent === parentSido) : pd.sigungu), [pd, parentSido]);
  const sgSaleTop = useMemo(() => [...sgScope].sort((a, b) => b.매매 - a.매매).slice(0, 10), [sgScope]);
  const sgJeonseTop = useMemo(() => [...sgScope].sort((a, b) => b.전세 - a.전세).slice(0, 10), [sgScope]);
  const sgScopeName = parentSido ?? "전국";

  const tradesForCombo: Trade[] = period === "monthly" ? ["매매", "전세", "월세"] : ["매매", "전세"];

  return (
    <div>
      {/* 컨트롤 바 */}
      <div className="ctrlbar">
        <div className="ctrl-left">
          <span className="ctrl-label">지역</span>
          <select className="region-select" value={sidoSel} onChange={(e) => changeSido(e.target.value)}>
            <option value="전국">전국</option>
            {SIDO.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {sidoSel !== "전국" && (
            <select className="region-select" value={sgSel} onChange={(e) => setSgSel(e.target.value)}>
              <option value="">{sidoSel} 전체</option>
              {sigunguOptions.map((s) => <option key={s.fullName} value={s.fullName}>{trimRegion(s.fullName)}</option>)}
            </select>
          )}
        </div>
        <div className="ctrl-right">
          <div className="seg">
            <button className="seg-btn" data-on={period === "weekly"} onClick={() => setPeriod("weekly")}>주간</button>
            <button className="seg-btn" data-on={period === "monthly"} onClick={() => setPeriod("monthly")}>월간</button>
          </div>
          <DateSelector resolvedDate={pd.asOf} selected={selectedDate} cycleLabel={periodLabel} monthMode={period === "monthly"} />
        </div>
      </div>

      {/* 1. 요약 */}
      <div className="section-title"><span className="num">1</span> {regionName} 시장 동향 요약 <span className="pill">{periodLabel}</span></div>
      <div className="summary-box">
        {summary.short}
        {!showMore && <button className="more-btn" onClick={() => setShowMore(true)}>＋ 더보기</button>}
        {showMore && (
          <div className="summary-more">
            <div className="sm-row"><b>매매</b> 상승 1위 {summary.bySaleDesc[0]?.name}({pct(summary.bySaleDesc[0]?.매매 ?? 0)}), 하락 1위 {summary.bySaleDesc[summary.bySaleDesc.length - 1]?.name}({pct(summary.bySaleDesc[summary.bySaleDesc.length - 1]?.매매 ?? 0)}). 시군구 최고 상승 {trimRegion(summary.sgUp?.fullName ?? "")}({pct(summary.sgUp?.매매 ?? 0)}), 최대 하락 {trimRegion(summary.sgDown?.fullName ?? "")}({pct(summary.sgDown?.매매 ?? 0)}).</div>
            <div className="sm-row"><b>전세</b> 전국 {pct(summary.nat.전세.chg)} — {[...pd.sido].sort((a, b) => b.전세 - a.전세)[0]?.name} 상승세, {[...pd.sido].sort((a, b) => a.전세 - b.전세)[0]?.name} 약세.</div>
            <div className="sm-row"><b>월세</b> 전국 {pct(summary.natWolse)} (월간 기준) — 전월세 전환 수요와 함께 해석이 필요합니다.</div>
            <button className="more-btn" onClick={() => setShowMore(false)}>− 접기</button>
          </div>
        )}
      </div>

      {/* 2. 가격지수 + 콤보차트 */}
      <div className="section-title"><span className="num">2</span> {regionName} 가격지수 <InfoTip text={EXPLAIN.index} /></div>
      {loading ? (
        <div className="card"><div className="label">{regionName} 데이터를 불러오는 중…</div></div>
      ) : !block ? (
        <div className="card"><div className="label">해당 지역의 공표 데이터가 없습니다.</div></div>
      ) : (
        <>
          <div className="grid grid-3">
            <GaugeCard label="매매가격지수" tip={EXPLAIN.매매} g={block.매매} sub={periodLabel} />
            <GaugeCard label="전세가격지수" tip={EXPLAIN.전세} g={block.전세} sub={periodLabel} />
            <GaugeCard label="월세가격지수" tip={EXPLAIN.월세} g={wolseBlock ?? { idx: 0, chg: 0 }} sub="월간" />
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span className="label" style={{ margin: 0 }}>{regionName} {comboTrade}가격지수 추이 ({periodLabel})</span>
              <InfoTip text={EXPLAIN.combo} />
              <div className="seg seg-sm" style={{ marginLeft: "auto" }}>
                {tradesForCombo.map((t) => (
                  <button key={t} className="seg-btn" data-on={comboTrade === t} onClick={() => setComboTrade(t)}>{t}</button>
                ))}
              </div>
            </div>
            <PriceIndexChart data={comboData} label={comboTrade} />
          </div>
        </>
      )}

      {/* 3. 시도별 변동률 */}
      <div className="section-title"><span className="num">3</span> 시도별 가격 변동률 <span className="pill">{periodLabel}</span> <span className="sel-region">· 선택: {regionName}</span><InfoTip text={EXPLAIN.변동률} /></div>
      <div className="grid grid-2">
        <SidoCard title={`매매가격지수 변동률 (${periodLabel})`} rows={sidoSale} kind="매매" highlight={parentSido} />
        <SidoCard title={`전세가격지수 변동률 (${periodLabel})`} rows={sidoJeonse} kind="전세" highlight={parentSido} />
      </div>

      {/* 4. 시군구 TOP10 */}
      <div className="section-title"><span className="num">4</span> {sgScopeName} 시군구 상승률 TOP10 <span className="pill">{periodLabel}</span> <span className="sel-region">· 선택: {regionName}</span></div>
      <div className="grid grid-2">
        <RankTable rows={sgSaleTop} kind="매매" title="매매 상승률 TOP10" prevLabel={prevLabel} selFull={sgSel} />
        <RankTable rows={sgJeonseTop} kind="전세" title="전세 상승률 TOP10" prevLabel={prevLabel} selFull={sgSel} />
      </div>
    </div>
  );
}

function GaugeCard({ label, tip, g, sub }: { label: string; tip: string; g: { idx: number; chg: number }; sub: string }) {
  return (
    <div className="card">
      <div className="label">{label} <InfoTip text={tip} /></div>
      <div className="value">{g.idx.toFixed(2)}</div>
      <div className={`delta ${cls(g.chg)}`}>{pct(g.chg)} <span className="delta-sub">{sub}</span></div>
    </div>
  );
}

function SidoCard({ title, rows, kind, highlight }: { title: string; rows: SidoChg[]; kind: "매매" | "전세"; highlight: string | null }) {
  const chartData = rows.map((r) => toRP(r.name, kind === "매매" ? r.매매 : r.전세, kind === "매매" ? r.idx매매 : r.idx전세));
  return (
    <div className="card">
      <div className="label" style={{ marginBottom: 8 }}>{title}</div>
      <div className="sido-2col">
        <ChangeBarChart data={chartData} />
        <div className="sido-table">
          <table>
            <thead><tr><th>지역</th><th className="num">변동률</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const v = kind === "매매" ? r.매매 : r.전세;
                return (
                  <tr key={r.name} data-hl={highlight === r.name}>
                    <td>{r.name}</td>
                    <td className={`num ${cls(v)}`}>{pct(v)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RankTable({ rows, kind, title, prevLabel, selFull }: { rows: { name: string; fullName: string; 매매: number; 전세: number; idx매매: number }[]; kind: "매매" | "전세"; title: string; prevLabel: string; selFull: string }) {
  return (
    <div className="card">
      <div className="label" style={{ marginBottom: 12 }}>{title}</div>
      {rows.length === 0 ? (
        <div className="label">해당 지역의 공표 시군구 데이터가 없습니다.</div>
      ) : (
        <table>
          <thead><tr><th className="rank">#</th><th>지역</th><th className="num">{prevLabel}대비</th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const v = kind === "매매" ? r.매매 : r.전세;
              return (
                <tr key={r.fullName + i} data-hl={selFull === r.fullName}>
                  <td className="rank">{i + 1}</td>
                  <td>{trimRegion(r.fullName)}</td>
                  <td className={`num ${cls(v)}`}>{pct(v)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
