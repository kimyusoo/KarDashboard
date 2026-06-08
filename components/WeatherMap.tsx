"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import { geoKeyFromFeature, rebKeyFromFullName, SIDO_PREFIX } from "@/lib/regions";
import { SIDO, type DashboardData } from "@/lib/reb";
import DateSelector from "./DateSelector";

type Period = "weekly" | "monthly";
type Trade = "매매" | "전세";
const W = 560, H = 700;

function weather(v: number | undefined) {
  if (v === undefined) return "·";
  if (v >= 0.3) return "☀️";
  if (v >= 0.08) return "🌤️";
  if (v > -0.08) return "⛅";
  if (v > -0.3) return "☁️";
  return "🌧️";
}
function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function wColor(v: number | undefined) {
  if (v === undefined) return "#eef1f7";
  const t = Math.max(-0.5, Math.min(0.5, v)) / 0.5;
  if (t >= 0) return `rgb(${lerp(255,214,t)},${lerp(255,35,t)},${lerp(255,42,t)})`;
  const k = -t;
  return `rgb(${lerp(255,30,k)},${lerp(255,91,k)},${lerp(255,191,k)})`;
}
function pct(v: number) {
  return v > 0 ? `▲${v.toFixed(2)}%` : v < 0 ? `▼${Math.abs(v).toFixed(2)}%` : "0.00%";
}
function colorCls(v: number) { return v > 0 ? "up" : v < 0 ? "down" : "flat"; }

export default function WeatherMap({ data, selectedDate }: { data: DashboardData; selectedDate?: string }) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [period, setPeriod] = useState<Period>("weekly");
  const [trade, setTrade] = useState<Trade>("매매");
  const [hover, setHover] = useState<{ x: number; y: number; label: string; v?: number } | null>(null);

  useEffect(() => {
    fetch("/sgg.geojson?v=20260606b").then((r) => r.json()).then(setGeo).catch(() => setGeo(null));
  }, []);

  const pd = data[period];

  // 시군구 변동률 매핑 (geoKey -> chg)
  const sgValues = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of pd.sigungu) {
      const k = rebKeyFromFullName(s.fullName);
      if (k) m[k] = trade === "매매" ? s.매매 : s.전세;
    }
    return m;
  }, [pd, trade]);

  // 시도 랭킹
  const ranking = useMemo(() => {
    return [...pd.sido].sort((a, b) => (trade === "매매" ? b.매매 - a.매매 : b.전세 - a.전세));
  }, [pd, trade]);

  const { pathGen, centroids } = useMemo(() => {
    if (!geo) return { pathGen: null, centroids: [] as { sido: string; x: number; y: number }[] };
    const proj = geoMercator().fitSize([W, H], geo as never);
    const path = geoPath(proj);
    // 시도별 중심점 (면적 가중 평균)
    const acc: Record<string, { x: number; y: number; a: number }> = {};
    for (const f of geo.features as Feature<Geometry, { name: string; code: string }>[]) {
      const sido = SIDO_PREFIX[f.properties.code.slice(0, 2)];
      if (!sido) continue;
      const c = path.centroid(f as never);
      const a = path.area(f as never) || 0.01;
      if (!acc[sido]) acc[sido] = { x: 0, y: 0, a: 0 };
      acc[sido].x += c[0] * a; acc[sido].y += c[1] * a; acc[sido].a += a;
    }
    // 밀집(수도권) 라벨 충돌 완화 오프셋(px)
    const OFF: Record<string, [number, number]> = {
      서울: [-14, -26], 인천: [-30, 6], 경기: [18, 22], 세종: [-20, 2], 대전: [6, 8], 광주: [-6, 6],
    };
    const centroids = Object.entries(acc).map(([sido, v]) => {
      const o = OFF[sido] ?? [0, 0];
      return { sido, x: v.x / v.a + o[0], y: v.y / v.a + o[1] };
    });
    return { pathGen: path, centroids };
  }, [geo]);

  const periodLabel = period === "weekly" ? "주간" : "월간";
  const sidoGauge = (name: string) => {
    const r = pd.regions[name];
    if (!r) return { idx: 0, chg: 0 };
    return trade === "매매" ? r.매매 : r.전세;
  };

  return (
    <div className="wmap">
      {/* 필터바 */}
      <div className="wmap-filterbar">
        <div className="wmap-metrics">
          <span className="wm-metric on">{trade}가격지수</span>
          <span className="wm-metric" title="준비 중">평균가격</span>
          <span className="wm-metric" title="준비 중">전세가율</span>
        </div>
        <div className="wmap-filters">
          <div className="seg seg-sm">
            <button className="seg-btn" data-on={period === "weekly"} onClick={() => setPeriod("weekly")}>주간</button>
            <button className="seg-btn" data-on={period === "monthly"} onClick={() => setPeriod("monthly")}>월간</button>
          </div>
          <div className="seg seg-sm">
            <button className="seg-btn" data-on={trade === "매매"} onClick={() => setTrade("매매")}>매매</button>
            <button className="seg-btn" data-on={trade === "전세"} onClick={() => setTrade("전세")}>전세</button>
          </div>
          <DateSelector resolvedDate={pd.asOf} selected={selectedDate} cycleLabel={periodLabel} monthMode={period === "monthly"} basePath="/map" />
        </div>
      </div>

      <div className="wmap-body">
        {/* 좌측 랭킹 패널 */}
        <div className="wmap-panel">
          <div className="wmap-panel-h">전국 아파트 {trade} 가격지수</div>
          <div className="wmap-list">
            <div className="wmap-list-head"><span>지역</span><span>지수</span><span>변동률</span></div>
            {ranking.map((r) => {
              const g = trade === "매매" ? { idx: r.idx매매, chg: r.매매 } : { idx: r.idx전세, chg: r.전세 };
              return (
                <div className="wmap-row" key={r.name}>
                  <span className="wmap-ic">{weather(g.chg)}</span>
                  <span className="wmap-rn">{r.name}</span>
                  <span className="wmap-rv">{g.idx.toFixed(1)}</span>
                  <span className={`wmap-rd ${colorCls(g.chg)}`}>{pct(g.chg)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 지도 */}
        <div className="wmap-stage">
          {!geo || !pathGen ? (
            <div className="label" style={{ padding: 40, textAlign: "center" }}>지도 불러오는 중…</div>
          ) : (
            <div style={{ position: "relative", width: "100%" }}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} onMouseLeave={() => setHover(null)}>
                {(geo.features as Feature<Geometry, { name: string; code: string }>[]).map((f, i) => {
                  const key = geoKeyFromFeature(f.properties);
                  const v = sgValues[key];
                  return (
                    <path key={i} d={pathGen(f) ?? undefined} fill={wColor(v)} stroke="#ffffff" strokeWidth={0.5}
                      onMouseMove={(e) => {
                        const box = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect();
                        setHover({ x: e.clientX - box.left, y: e.clientY - box.top, label: f.properties.name, v });
                      }}
                      style={{ cursor: "crosshair" }} />
                  );
                })}
              </svg>
              {/* 시도 배지 */}
              {centroids.map((c) => {
                const g = sidoGauge(c.sido);
                return (
                  <div key={c.sido} className="wmap-badge" style={{ left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%` }}>
                    <span className="wb-ic">{weather(g.chg)}</span>
                    <span className="wb-nm">{c.sido}</span>
                    <span className={`wb-v ${colorCls(g.chg)}`}>{pct(g.chg)}</span>
                  </div>
                );
              })}
              {hover && (
                <div className="wmap-tip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
                  <b>{hover.label}</b><br />
                  {hover.v === undefined ? "미조사" : `${weather(hover.v)} ${pct(hover.v)}`}
                </div>
              )}
              {/* 범례 */}
              <div className="wmap-legend">
                <span>아파트 {trade}가격지수 변동률 (단위: %)</span>
                <div className="wmap-legend-bar">
                  <i>🌧️</i>
                  <span style={{ background: wColor(-0.5) }} />
                  <span style={{ background: wColor(-0.2) }} />
                  <span style={{ background: wColor(0) }} />
                  <span style={{ background: wColor(0.2) }} />
                  <span style={{ background: wColor(0.5) }} />
                  <i>☀️</i>
                </div>
                <div className="wmap-legend-sc"><span>하락</span><span>보합</span><span>상승</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
