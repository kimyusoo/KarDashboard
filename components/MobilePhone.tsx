"use client";

import { useState } from "react";
import Sparkline from "./Sparkline";

interface Props {
  asOf: string;
  heroes: { t: string; v: number }[];
  series: number[];
  top3: { name: string; chg: number }[];
}
function fmtPct(v: number) { return v > 0 ? `+${v.toFixed(2)}%` : v < 0 ? `${v.toFixed(2)}%` : "0.00%"; }
function signColor(v: number) { return v > 0 ? "var(--up)" : v < 0 ? "var(--down)" : "var(--flat)"; }

function MApp({ asOf, heroes, series, top3 }: Props) {
  return (
    <div className="m-app">
      <div className="m-top">
        <div className="m-brand"><span className="m-mark">KAR</span><span>부동산 인사이트</span></div>
        <span className="m-bell">🔔</span>
      </div>
      <div className="m-region"><span className="m-region-name">전국 ▾</span><span className="m-cyc">주간</span></div>
      <div className="m-scroll">
        <div className="m-hero">
          <span className="m-hero-lab">한국부동산원 {asOf} 기준</span>
          <div className="m-hero-row">
            {heroes.map((h) => (
              <div key={h.t} className="m-hero-i">
                <span className="m-hero-t">{h.t}</span>
                <span className="m-hero-v" style={{ color: signColor(h.v) }}>{fmtPct(h.v)}</span>
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
              <span className="m-rank-name">{r.name}</span>
              <span className="m-rank-v" style={{ color: "var(--up)" }}>{fmtPct(r.chg)}</span>
            </div>
          ))}
        </div>
        <button className="m-aibtn">✦ 고객용 AI 리포트 생성</button>
        <div className="m-foot">서울사이버대 AI빅데이터 · 공공데이터 · 한국부동산원</div>
      </div>
      <div className="m-tabbar">
        <span className="m-tab on">📊 동향</span><span className="m-tab">🏠 실거래</span>
        <span className="m-tab">📍 지회</span><span className="m-tab">≡ 더보기</span>
      </div>
    </div>
  );
}

export default function MobilePhone(props: Props) {
  const [full, setFull] = useState(false);
  return (
    <>
      <button className="phone phone-clickable" onClick={() => setFull(true)} aria-label="모바일 화면 크게 보기">
        <div className="phone-notch" />
        <div className="phone-screen"><MApp {...props} /></div>
        <span className="phone-hint">👆 클릭하면 모바일 화면으로 보기</span>
      </button>

      {full && (
        <div className="phone-overlay" onClick={() => setFull(false)}>
          <div className="phone-overlay-inner" onClick={(e) => e.stopPropagation()}>
            <div className="phone phone-big">
              <div className="phone-notch" />
              <div className="phone-screen"><MApp {...props} /></div>
            </div>
            <button className="phone-close" onClick={() => setFull(false)}>✕ 닫기</button>
          </div>
        </div>
      )}
    </>
  );
}
