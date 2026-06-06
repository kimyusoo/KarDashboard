"use client";

import { useState } from "react";
import KoreaMap from "./KoreaMap";
import { branchesByRegionKey } from "@/lib/branches";

interface RegionValue {
  name: string;
  changePct: number;
}

export default function MapSection({
  sale,
  jeonse,
}: {
  sale: Record<string, RegionValue>;
  jeonse: Record<string, RegionValue>;
}) {
  const [tab, setTab] = useState<"sale" | "jeonse">("sale");
  const [sel, setSel] = useState<{ key: string; name: string } | null>(null);
  const values = tab === "sale" ? sale : jeonse;
  const count = Object.keys(values).length;
  const branches = sel ? branchesByRegionKey(sel.key) : [];

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setTab("sale")}
          className="tab"
          data-active={tab === "sale"}
        >
          매매
        </button>
        <button
          onClick={() => setTab("jeonse")}
          className="tab"
          data-active={tab === "jeonse"}
        >
          전세
        </button>
        <span className="label" style={{ marginLeft: "auto", fontSize: 12 }}>
          시군구 {count}곳 · 전주대비 변동률
        </span>
      </div>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <KoreaMap
          values={values}
          onSelect={(key, name) => setSel({ key, name })}
          selectedKey={sel?.key}
        />
      </div>

      {/* 시군구 클릭 시: 변동률 + 담당 지회 */}
      <div className="branch-panel">
        {!sel ? (
          <div className="label" style={{ textAlign: "center" }}>
            👆 지도에서 시군구를 클릭하면 변동률과 <strong>담당 공인중개사협회 지회</strong>가 표시됩니다.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 15 }}>{sel.name}</strong>{" "}
              <span className="label" style={{ fontSize: 12 }}>
                {values[sel.key]
                  ? `· 전주대비 ${values[sel.key].changePct > 0 ? "▲" : values[sel.key].changePct < 0 ? "▼" : "―"} ${Math.abs(values[sel.key].changePct).toFixed(2)}%`
                  : "· 미조사 지역"}
              </span>
            </div>
            {branches.length === 0 ? (
              <div className="label">등록된 지회 정보를 찾지 못했습니다.</div>
            ) : (
              <div className="branch-cards">
                {branches.map((b, i) => (
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
                    <div className="bc-sidohoe">{b.sidohoe}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
