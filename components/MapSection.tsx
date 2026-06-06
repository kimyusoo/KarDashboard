"use client";

import { useState } from "react";
import KoreaMap from "./KoreaMap";

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
  const values = tab === "sale" ? sale : jeonse;
  const count = Object.keys(values).length;

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
        <KoreaMap values={values} />
      </div>
    </div>
  );
}
