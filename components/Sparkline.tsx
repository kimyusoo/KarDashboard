// 순수 SVG 스파크라인 (서버 컴포넌트 가능)
export default function Sparkline({
  data,
  w = 280,
  h = 56,
  color = "#d6232a",
  fill = "rgba(214,35,42,0.12)",
}: {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: string;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const area = `${line}L${pts[pts.length - 1][0].toFixed(1)},${h}L${pts[0][0].toFixed(1)},${h}Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: "100%" }}>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.6} fill={color} />
    </svg>
  );
}
