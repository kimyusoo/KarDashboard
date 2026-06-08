"use client";

import { useEffect, useState } from "react";
import { LAWD_LIST, TRADE_LABEL, type TradeType } from "@/lib/molit";
import InfoTip from "./InfoTip";

const TYPES: TradeType[] = ["sale", "jeonse", "wolse"];

function fmtAmount(type: TradeType, v: number) {
  if (v <= 0) return "—";
  if (type === "wolse") return `월 ${v.toLocaleString()}만`;
  return `${(v / 10000).toFixed(2)}억`;
}
function ym(s: string) { return `${s.slice(0, 4)}.${s.slice(4)}`; }

function Controls({ type, setType, code, setCode }: {
  type: TradeType; setType: (t: TradeType) => void; code: string; setCode: (c: string) => void;
}) {
  return (
    <div className="rt-controls">
      <div className="seg seg-sm">
        {TYPES.map((t) => (
          <button key={t} className="seg-btn" data-on={type === t} onClick={() => setType(t)}>{TRADE_LABEL[t]}</button>
        ))}
      </div>
      <select className="region-select" value={code} onChange={(e) => setCode(e.target.value)}>
        {LAWD_LIST.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
      </select>
    </div>
  );
}

interface RankResp { curMonth: string; prevMonth: string; type: TradeType; risers: { apt: string; umd: string; prevAvg: number; curAvg: number; changePct: number; deals: number }[] }
interface VolResp { type: TradeType; curMonth: string; prevMonth: string; count: number; prevCount: number; avg: number; prevAvg: number }

export default function RealtimeSection() {
  const [rType, setRType] = useState<TradeType>("sale");
  const [rCode, setRCode] = useState("11680");
  const [rank, setRank] = useState<RankResp | null>(null);
  const [rankLoading, setRankLoading] = useState(true);

  const [vType, setVType] = useState<TradeType>("sale");
  const [vCode, setVCode] = useState("11680");
  const [vol, setVol] = useState<VolResp | null>(null);
  const [volLoading, setVolLoading] = useState(true);

  useEffect(() => {
    setRankLoading(true);
    fetch(`/api/realtime?kind=ranking&type=${rType}&code=${rCode}`)
      .then((r) => r.json()).then(setRank).catch(() => setRank(null)).finally(() => setRankLoading(false));
  }, [rType, rCode]);

  useEffect(() => {
    setVolLoading(true);
    fetch(`/api/realtime?kind=volume&type=${vType}&code=${vCode}`)
      .then((r) => r.json()).then(setVol).catch(() => setVol(null)).finally(() => setVolLoading(false));
  }, [vType, vCode]);

  const volDelta = vol && vol.prevCount ? Math.round(((vol.count - vol.prevCount) / vol.prevCount) * 1000) / 10 : 0;

  return (
    <>
      {/* 7. 단지별 평균 거래가 상승률 */}
      <div className="section-title">
        <span className="num">5</span> 단지별 {TRADE_LABEL[rType]} 평균가 상승률 TOP
        <InfoTip text="국토부 실거래가 기준, 선택 지역에서 동일 단지의 전월·당월 평균(매매가/전세보증금/월세)을 비교한 상승률입니다. 면적 혼합·표본 적어 변동성이 있을 수 있어 참고용입니다." />
      </div>
      <div className="card">
        <Controls type={rType} setType={setRType} code={rCode} setCode={setRCode} />
        {rankLoading ? (
          <div className="label" style={{ marginTop: 14 }}>불러오는 중…</div>
        ) : rank && rank.risers.length > 0 ? (
          <table style={{ marginTop: 12 }}>
            <thead><tr><th className="rank">#</th><th>단지</th><th>동</th><th className="num">전월</th><th className="num">당월</th><th className="num">상승률</th></tr></thead>
            <tbody>
              {rank.risers.map((a, i) => (
                <tr key={a.apt + i}>
                  <td className="rank">{i + 1}</td>
                  <td>{a.apt}</td>
                  <td>{a.umd}</td>
                  <td className="num">{fmtAmount(rType, a.prevAvg)}</td>
                  <td className="num">{fmtAmount(rType, a.curAvg)}</td>
                  <td className={`num ${a.changePct > 0 ? "up" : a.changePct < 0 ? "down" : "flat"}`}>
                    {a.changePct > 0 ? "▲" : a.changePct < 0 ? "▼" : "―"} {Math.abs(a.changePct).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="label" style={{ marginTop: 14 }}>해당 조건의 데이터가 없습니다. (양월 모두 거래된 단지 기준)</div>
        )}
        {rank && <div className="label" style={{ marginTop: 10, fontSize: 11 }}>기준: {ym(rank.prevMonth)} → {ym(rank.curMonth)}</div>}
      </div>

      {/* 8. 아파트 거래량 평균가 */}
      <div className="section-title">
        <span className="num">6</span> 아파트 {TRADE_LABEL[vType]} 거래량 · 평균가
        <InfoTip text="국토부 실거래가 신고 기준 월별 거래건수와 평균 금액(매매가/전세보증금/월세)입니다. 신고지연을 고려해 직전월 기준으로 표시합니다." />
      </div>
      <div className="card">
        <Controls type={vType} setType={setVType} code={vCode} setCode={setVCode} />
        {volLoading ? (
          <div className="label" style={{ marginTop: 14 }}>불러오는 중…</div>
        ) : vol ? (
          <div className="grid grid-3" style={{ marginTop: 12 }}>
            <div className="card">
              <div className="label">거래건수 ({ym(vol.curMonth)})</div>
              <div className="value">{vol.count.toLocaleString()}건</div>
              <div className={`delta ${volDelta > 0 ? "up" : volDelta < 0 ? "down" : "flat"}`}>
                전월 {vol.prevCount.toLocaleString()}건 · {volDelta > 0 ? "▲" : volDelta < 0 ? "▼" : "―"} {Math.abs(volDelta).toFixed(1)}%
              </div>
            </div>
            <div className="card">
              <div className="label">평균 {TRADE_LABEL[vType]}{vType === "wolse" ? "(월)" : vType === "jeonse" ? "(보증금)" : "가"}</div>
              <div className="value">{fmtAmount(vType, vol.avg)}</div>
              <div className="label" style={{ marginTop: 6 }}>전월 {fmtAmount(vType, vol.prevAvg)}</div>
            </div>
            <div className="card">
              <div className="label">기준월</div>
              <div className="value" style={{ fontSize: 20 }}>{ym(vol.curMonth)}</div>
              <div className="label" style={{ marginTop: 6 }}>국토부 실거래 신고 기준</div>
            </div>
          </div>
        ) : (
          <div className="label" style={{ marginTop: 14 }}>데이터를 불러오지 못했습니다.</div>
        )}
      </div>
    </>
  );
}
