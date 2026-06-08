"use client";

import { useMemo, useState } from "react";
import { groupBySidohoe, BRANCH_COUNT, SIDOHOE_COUNT } from "@/lib/branches";

export default function BranchDirectory() {
  const [q, setQ] = useState("");
  const [toast, setToast] = useState(false);
  const groups = useMemo(() => groupBySidohoe(), []);
  const kw = q.trim();

  function showSoon() {
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  }

  const filtered = useMemo(() => {
    if (!kw) return groups;
    return groups
      .map((g) => ({
        ...g,
        branches: g.branches.filter(
          (b) =>
            b.branch.includes(kw) ||
            b.address.includes(kw) ||
            b.sigungu.includes(kw) ||
            b.sidohoe.includes(kw) ||
            b.tel.includes(kw),
        ),
      }))
      .filter((g) => g.branches.length > 0);
  }, [groups, kw]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="지역·지회명·주소·전화 검색 (예: 강남, 분당, 포항)"
          className="search-input"
        />
        <span className="label" style={{ whiteSpace: "nowrap", fontSize: 12 }}>
          전체 {SIDOHOE_COUNT}개 시도회 · {BRANCH_COUNT}개 지회
        </span>
      </div>

      {filtered.map((g) => (
        <div key={g.sidohoe} style={{ marginBottom: 22 }}>
          <div className="section-title" style={{ margin: "8px 0 10px" }}>
            {g.sidohoe}{" "}
            <span className="pill">{g.branches.length}개 지회</span>
          </div>
          <div className="branch-cards">
            {g.branches.map((b, i) => (
              <div className="branch-card" key={i}>
                <div className="bc-name">
                  {b.isHQ ? "🏛️ " : "🏢 "}
                  {b.branch}
                </div>
                <div className="bc-addr">{b.address}</div>
                <div className="bc-contact">
                  ☎ {b.tel}
                  {b.fax ? ` · 팩스 ${b.fax}` : ""}
                </div>
                <div className="bc-actions">
                  <a
                    className="bc-btn"
                    href={`https://map.naver.com/p/search/${encodeURIComponent(b.address)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📍 위치
                  </a>
                  <button className="bc-btn" onClick={showSoon}>📊 지회별 데이터</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="card">
          <div className="label">“{kw}” 검색 결과가 없습니다.</div>
        </div>
      )}

      {toast && (
        <div className="toast">📊 지회별 데이터는 준비 중입니다. (지회별 분석 데이터 제공 후 공개 예정)</div>
      )}
    </div>
  );
}
