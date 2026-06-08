"use client";

import { useState } from "react";
import type { IscuSystemData } from "@/lib/iscu";
import { LAWD_BY_SIDO, LAWD_SIDO_LIST } from "@/lib/molit";
import IscuSample from "./IscuSample";
import DateSelector from "./DateSelector";

function deltaClass(t?: "up" | "down" | "flat") { return t === "up" ? "up" : t === "down" ? "down" : "flat"; }
function arrow(t?: "up" | "down" | "flat") { return t === "up" ? "▲" : t === "down" ? "▼" : t === "flat" ? "―" : ""; }

const USECASE_VISIBLE = 10;

function SystemImage({ id, title }: { id: string; title: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="iscu-img-ph">
        <div style={{ fontSize: 26 }}>🖼️</div>
        <div style={{ fontWeight: 700, marginTop: 6 }}>{title} 화면 이미지</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          <code>public/iscu/{id}.png</code> 파일을 추가하면 이 위치에 표시됩니다.
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="iscu-img" src={`/iscu/${id}.png`} alt={`${title} 화면`} onError={() => setErr(true)} />
  );
}

export default function IscuTabs({ data, selectedDate }: { data: IscuSystemData[]; selectedDate?: string }) {
  const [active, setActive] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [sido, setSido] = useState("전국");
  const [sg, setSg] = useState("");

  const d = data[active];
  const s = d.system;
  const periodLabel = period === "weekly" ? "주간" : "월간";
  const regionName = sido === "전국" ? "전국" : sg ? `${sido} ${sg}` : sido;
  const sgList = sido === "전국" ? [] : (LAWD_BY_SIDO[sido] ?? []);
  const today = new Date().toISOString().slice(0, 10);
  const resolvedDate = selectedDate || (period === "monthly" ? today.slice(0, 7) : today);

  function pick(i: number) { setActive(i); setShowAll(false); }

  const visibleUseCases = showAll ? s.useCases : s.useCases.slice(0, USECASE_VISIBLE);

  return (
    <div>
      {/* 컨트롤 바 (동향·핵심지표와 동일) */}
      <div className="ctrlbar">
        <div className="ctrl-left">
          <span className="ctrl-label">지역</span>
          <select className="region-select" value={sido} onChange={(e) => { setSido(e.target.value); setSg(""); }}>
            <option value="전국">전국</option>
            {LAWD_SIDO_LIST.map((s2) => <option key={s2} value={s2}>{s2}</option>)}
          </select>
          {sido !== "전국" && (
            <select className="region-select" value={sg} onChange={(e) => setSg(e.target.value)}>
              <option value="">{sido} 전체</option>
              {sgList.map((r) => <option key={r.code} value={r.name}>{r.name}</option>)}
            </select>
          )}
        </div>
        <div className="ctrl-right">
          <div className="seg">
            <button className="seg-btn" data-on={period === "weekly"} onClick={() => setPeriod("weekly")}>주간</button>
            <button className="seg-btn" data-on={period === "monthly"} onClick={() => setPeriod("monthly")}>월간</button>
          </div>
          <DateSelector resolvedDate={resolvedDate} selected={selectedDate} cycleLabel={periodLabel} monthMode={period === "monthly"} basePath="/insights" />
        </div>
      </div>

      <div className="iscu-grid">
        {/* 좌측 시스템 메뉴 */}
        <div className="iscu-menu">
          {data.map((item, i) => (
            <button key={item.system.id} className="iscu-menu-item" data-active={i === active} onClick={() => pick(i)}>
              <span className="mtitle">{item.system.icon} {item.system.title}</span>
              <span className="mreq">제안서 항목 #{item.system.reqNo}</span>
            </button>
          ))}
        </div>

        {/* 우측 상세 */}
        <div>
          <div className="status-banner">
            🔌 연동 상태: {d.status} · 분석지역 <strong>{regionName}</strong> · <strong>{periodLabel} {resolvedDate}</strong>
          </div>

          {/* 시스템 소개 */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{s.icon} {s.title}</h2>
              <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="pill" style={{ textDecoration: "none" }}>원본 시스템 ↗</a>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{s.summary}</p>
          </div>

          {/* 시스템 화면 이미지 (요청: 시스템 소개와 대시보드 연동지표 사이) */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="label" style={{ marginBottom: 10 }}>🖥️ {s.title} 화면</div>
            <SystemImage id={s.id} title={s.title} />
          </div>

          {/* 대시보드 연동 지표 */}
          <div className="label" style={{ margin: "4px 0 10px" }}>대시보드 연동 지표 {d.live ? "" : "(예시 값)"}</div>
          <div className="grid grid-2" style={{ marginBottom: 16 }}>
            {s.metrics.map((m) => {
              const val = d.live?.[m.key] ?? m.sample;
              return (
                <div className="card" key={m.key}>
                  <div className="label">{m.label}</div>
                  <div className={`value ${deltaClass(m.trend)}`} style={{ fontSize: 22 }}>{arrow(m.trend)} {val}</div>
                  {m.hint && <div className="label" style={{ fontSize: 11, marginTop: 4 }}>{m.hint}</div>}
                </div>
              );
            })}
          </div>

          {/* 예시 시각화 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="pill" style={{ background: "rgba(107,63,214,.1)", color: "#6b3fd6" }}>예시 시각화</span>
              <span className="label" style={{ fontSize: 12 }}>데이터 연동 시 이런 형태로 제공됩니다 (아래는 샘플 데이터)</span>
            </div>
            <IscuSample id={s.id} />
          </div>

          {/* 공인중개사 상담 활용 (10줄 + 더보기) */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 6 }}>공인중개사 상담 활용 <span className="pill">{s.useCases.length}건</span></div>
            {visibleUseCases.map((u, i) => (
              <div className="usecase" key={i}>· {u}</div>
            ))}
            {s.useCases.length > USECASE_VISIBLE && (
              <button className="more-btn" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "− 접기" : `＋ 더보기 (${s.useCases.length - USECASE_VISIBLE}건 더)`}
              </button>
            )}
          </div>

          {/* 원본 시스템 보기 */}
          <div className="card">
            <div className="label" style={{ marginBottom: 10 }}>원본 시스템 보기</div>
            {s.mode === "embed" && s.embedUrl ? (
              <iframe className="embed-frame" src={s.embedUrl} title={s.title} loading="lazy" />
            ) : (
              <div className="embed-placeholder">
                현재 <strong>연동 협의 대기</strong> 상태입니다.<br />
                ISCU와 데이터 제공(API/CSV) 또는 임베드 허용이 확정되면,<br />
                이 영역에 실시간 결과가 표시됩니다.
                <div style={{ marginTop: 12 }}>
                  <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="tab" style={{ textDecoration: "none", display: "inline-block" }}>ISCU 원본 시스템 새 창으로 열기 ↗</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
