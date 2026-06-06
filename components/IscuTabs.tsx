"use client";

import { useState } from "react";
import type { IscuSystemData } from "@/lib/iscu";

function deltaClass(t?: "up" | "down" | "flat") {
  return t === "up" ? "up" : t === "down" ? "down" : "flat";
}
function arrow(t?: "up" | "down" | "flat") {
  return t === "up" ? "▲" : t === "down" ? "▼" : t === "flat" ? "―" : "";
}

export default function IscuTabs({ data }: { data: IscuSystemData[] }) {
  const [active, setActive] = useState(0);
  const d = data[active];
  const s = d.system;

  return (
    <div className="iscu-grid">
      {/* 좌측 시스템 메뉴 */}
      <div className="iscu-menu">
        {data.map((item, i) => (
          <button
            key={item.system.id}
            className="iscu-menu-item"
            data-active={i === active}
            onClick={() => setActive(i)}
          >
            <span className="mtitle">
              {item.system.icon} {item.system.title}
            </span>
            <span className="mreq">제안서 항목 #{item.system.reqNo}</span>
          </button>
        ))}
      </div>

      {/* 우측 상세 */}
      <div>
        <div className="status-banner">
          🔌 연동 상태: {d.status} · 분석지역 <strong>{d.region}</strong>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              {s.icon} {s.title}
            </h2>
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="pill"
              style={{ textDecoration: "none" }}
            >
              원본 시스템 ↗
            </a>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
            {s.summary}
          </p>
        </div>

        {/* 대시보드로 가져올 핵심 결과물(지표) */}
        <div className="label" style={{ margin: "4px 0 10px" }}>
          대시보드 연동 지표 {d.live ? "" : "(예시 값)"}
        </div>
        <div className="grid grid-2" style={{ marginBottom: 16 }}>
          {s.metrics.map((m) => {
            const val = d.live?.[m.key] ?? m.sample;
            return (
              <div className="card" key={m.key}>
                <div className="label">{m.label}</div>
                <div className={`value ${deltaClass(m.trend)}`} style={{ fontSize: 22 }}>
                  {arrow(m.trend)} {val}
                </div>
                {m.hint && (
                  <div className="label" style={{ fontSize: 11, marginTop: 4 }}>
                    {m.hint}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 활용 시나리오 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            공인중개사 상담 활용
          </div>
          {s.useCases.map((u, i) => (
            <div className="usecase" key={i}>
              · {u}
            </div>
          ))}
        </div>

        {/* 임베드/연동 영역 */}
        <div className="card">
          <div className="label" style={{ marginBottom: 10 }}>
            원본 시스템 보기
          </div>
          {s.mode === "embed" && s.embedUrl ? (
            <iframe
              className="embed-frame"
              src={s.embedUrl}
              title={s.title}
              loading="lazy"
            />
          ) : (
            <div className="embed-placeholder">
              현재 <strong>연동 협의 대기</strong> 상태입니다.
              <br />
              ISCU와 데이터 제공(API/CSV) 또는 임베드 허용이 확정되면,
              <br />
              이 영역에 실시간 결과가 표시됩니다.
              <div style={{ marginTop: 12 }}>
                <a
                  href={s.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tab"
                  style={{ textDecoration: "none", display: "inline-block" }}
                >
                  ISCU 원본 시스템 새 창으로 열기 ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
