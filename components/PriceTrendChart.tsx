"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import type { TrendPt } from "@/lib/reb";

export default function PriceTrendChart({
  data, showWolse = false, height = 300,
}: {
  data: TrendPt[];
  showWolse?: boolean;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#eef1f7" strokeDasharray="3 3" />
          <XAxis dataKey="t" tick={{ fill: "#6b7488", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} minTickGap={24} stroke="#c5cdda" />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "#6b7488", fontSize: 11 }} width={48} stroke="#c5cdda" />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e3e8f1", borderRadius: 8, color: "#1a2233", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(12,28,64,.3)" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#6b7488" }} />
          <Line type="monotone" dataKey="매매" stroke="#d6232a" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="전세" stroke="#1e5bbf" strokeWidth={2.2} dot={false} />
          {showWolse && <Line type="monotone" dataKey="월세" stroke="#2f7d52" strokeWidth={2.2} dot={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
