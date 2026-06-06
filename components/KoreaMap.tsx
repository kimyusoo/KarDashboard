"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import { geoKeyFromFeature } from "@/lib/regions";

interface RegionValue {
  name: string;
  changePct: number;
}

interface Props {
  // GeoJSON 키(`시도|시군구명`) → 값
  values: Record<string, RegionValue>;
  title?: string;
  onSelect?: (regionKey: string, regionName: string) => void;
  selectedKey?: string;
}

// 변동률 → 색상 (적색=상승, 청색=하락, 회색=데이터 없음) · 라이트 배경용
function colorFor(v: number | undefined): string {
  if (v === undefined) return "#e3e8f1";
  if (v === 0) return "#c5cdda";
  const t = Math.max(-0.5, Math.min(0.5, v)) / 0.5; // -1..1
  if (t > 0) {
    // 연한 핑크 → KAR 레드
    const k = t;
    return `rgb(${Math.round(250 - 36 * k)}, ${Math.round(214 - 178 * k)}, ${Math.round(214 - 187 * k)})`;
  }
  const k = -t;
  // 연한 블루 → 네이비 블루
  return `rgb(${Math.round(225 - 195 * k)}, ${Math.round(233 - 142 * k)}, ${Math.round(247 - 56 * k)})`;
}

export default function KoreaMap({ values, title, onSelect, selectedKey }: Props) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    label: string;
    v?: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/sgg.geojson?v=20260606b")
      .then((r) => r.json())
      .then((g: FeatureCollection) => setGeo(g))
      .catch(() => setGeo(null));
  }, []);

  const W = 520;
  const H = 640;

  const pathGen = useMemo(() => {
    if (!geo) return null;
    const proj = geoMercator().fitSize([W, H], geo as never);
    return geoPath(proj);
  }, [geo]);

  if (!geo || !pathGen) {
    return (
      <div className="label" style={{ padding: 40, textAlign: "center" }}>
        지도 데이터를 불러오는 중…
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      {title && <div className="label" style={{ marginBottom: 8 }}>{title}</div>}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", maxHeight: 640 }}
        onMouseLeave={() => setHover(null)}
      >
        {(geo.features as Feature<Geometry, { name: string; code: string }>[]).map(
          (f, i) => {
            const key = geoKeyFromFeature(f.properties);
            const val = values[key];
            const d = pathGen(f) ?? undefined;
            const selected = selectedKey === key;
            return (
              <path
                key={i}
                d={d}
                fill={colorFor(val?.changePct)}
                stroke={selected ? "#0a2a66" : "#ffffff"}
                strokeWidth={selected ? 1.6 : 0.5}
                onClick={() =>
                  onSelect?.(key, val?.name ?? f.properties.name)
                }
                onMouseMove={(e) => {
                  const rect = wrapRef.current?.getBoundingClientRect();
                  setHover({
                    x: e.clientX - (rect?.left ?? 0),
                    y: e.clientY - (rect?.top ?? 0),
                    label: val?.name ?? f.properties.name,
                    v: val?.changePct,
                  });
                }}
                style={{ cursor: "pointer", transition: "fill 0.2s" }}
              />
            );
          },
        )}
      </svg>

      {hover && (
        <div
          style={{
            position: "absolute",
            left: hover.x + 12,
            top: hover.y + 12,
            background: "#ffffff",
            border: "1px solid #e3e8f1",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 12,
            color: "#1a2233",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
            boxShadow: "0 8px 24px -12px rgba(12,28,64,.3)",
          }}
        >
          <strong>{hover.label}</strong>
          <br />
          {hover.v === undefined
            ? "데이터 없음"
            : `전주대비 ${hover.v > 0 ? "▲" : hover.v < 0 ? "▼" : "―"} ${Math.abs(hover.v).toFixed(2)}%`}
        </div>
      )}

      {/* 범례 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
          fontSize: 11,
          color: "#6b7488",
        }}
      >
        <span>하락</span>
        <span style={{ width: 18, height: 12, background: colorFor(-0.4), borderRadius: 2 }} />
        <span style={{ width: 18, height: 12, background: colorFor(-0.1), borderRadius: 2 }} />
        <span style={{ width: 18, height: 12, background: colorFor(0), borderRadius: 2 }} />
        <span style={{ width: 18, height: 12, background: colorFor(0.1), borderRadius: 2 }} />
        <span style={{ width: 18, height: 12, background: colorFor(0.4), borderRadius: 2 }} />
        <span>상승</span>
        <span style={{ marginLeft: 10, width: 18, height: 12, background: "#e3e8f1", borderRadius: 2, border: "1px solid #d5dbe8" }} />
        <span>미조사</span>
      </div>
    </div>
  );
}
