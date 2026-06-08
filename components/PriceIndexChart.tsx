"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";

export interface IdxPt { t: string; idx: number; chg: number }

const axis = { fill: "#6b7488", fontSize: 11 };

export default function PriceIndexChart({
  data, label = "매매", height = 300,
}: {
  data: IdxPt[];
  label?: string;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#eef1f7" strokeDasharray="3 3" />
          <XAxis dataKey="t" tick={axis} tickFormatter={(v: string) => v.slice(5)} minTickGap={24} stroke="#c5cdda" />
          <YAxis yAxisId="L" domain={["auto", "auto"]} tick={axis} width={46} stroke="#c5cdda" />
          <YAxis yAxisId="R" orientation="right" tick={axis} width={42} stroke="#c5cdda" tickFormatter={(v: number) => `${v}`} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #e3e8f1", borderRadius: 8, fontSize: 12, color: "#1a2233", boxShadow: "0 8px 24px -12px rgba(12,28,64,.3)" }}
            formatter={(v: number, n: string) => n === "변동률(%)" ? [`${v.toFixed(2)}%`, n] : [v.toFixed(2), n]}
          />
          <Legend wrapperStyle={{ fontSize: 11.5 }} />
          <Bar yAxisId="R" dataKey="chg" name="변동률(%)" radius={[2, 2, 0, 0]} maxBarSize={14}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.chg > 0 ? "rgba(214,35,42,0.62)" : d.chg < 0 ? "rgba(30,91,191,0.55)" : "#c5cdda"} />
            ))}
          </Bar>
          <Line yAxisId="L" type="monotone" dataKey="idx" name={`${label} 가격지수`} stroke="#ed7d31" strokeWidth={2.4} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
