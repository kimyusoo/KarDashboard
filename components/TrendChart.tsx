"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { TrendPoint } from "@/lib/reb";

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#26324f" strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            tick={{ fill: "#93a1bd", fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
            minTickGap={24}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#93a1bd", fontSize: 11 }}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "#1b2740",
              border: "1px solid #26324f",
              borderRadius: 8,
              color: "#e8edf7",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#93a1bd" }} />
          <Line
            type="monotone"
            dataKey="매매"
            stroke="#ff5d73"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="전세"
            stroke="#3b9dff"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
