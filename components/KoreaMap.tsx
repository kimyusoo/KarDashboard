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

// 변동률 → 색상 (적색=상승, 청색=하락, 회색=데이터 없음)
function colorFor(v: number | undefined): string {
  if (v === undefined) return "#26324f";
  if (v === 0) return "#5b6680";
  const clamp = Math.max(-0.5, Math.min(0.5, v)) / 0.5; // -1..1
  if (clamp > 0) {
    const t = clamp; // 0..1
    return `rgb(${Math.round(120 + 135 * t)}, ${Math.round(93 - 60 * t)}, ${Math.round(115 - 60 * t)})`;
  }
  const t = -clamp;
  return `rgb(${Math.round(70 - 30 * t)}, ${Math.round(120 + 30 * t)}, ${Math.round(160 + 70 * t)})`;
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
                stroke={selected ? "#ffffff" : "#0b1120"}
                strokeWidth={selected ? 1.4 : 0.4}
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
            background: "#1b2740",
            border: "1px solid #26324f",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 12,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
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
          color: "#93a1bd",
        }}
      >
        <span>하락</span>
        <span style={{ width: 18, height: 12, background: colorFor(-0.4), borderRadius: 2 }} />
        <span style={{ width: 18, height: 12, background: colorFor(-0.1), borderRadius: 2 }} />
        <span style={{ width: 18, height: 12, background: colorFor(0), borderRadius: 2 }} />
        <span style={{ width: 18, height: 12, background: colorFor(0.1), borderRadius: 2 }} />
        <span style={{ width: 18, height: 12, background: colorFor(0.4), borderRadius: 2 }} />
        <span>상승</span>
        <span style={{ marginLeft: 10, width: 18, height: 12, background: "#26324f", borderRadius: 2 }} />
        <span>미조사</span>
      </div>
    </div>
  );
}
