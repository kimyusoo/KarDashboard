"use client";

import { useMemo, useState } from "react";
import { groupBySidohoe, BRANCH_COUNT, SIDOHOE_COUNT } from "@/lib/branches";

export default function BranchDirectory() {
  const [q, setQ] = useState("");
  const groups = useMemo(() => groupBySidohoe(), []);
  const kw = q.trim();

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
    </div>
  );
}
