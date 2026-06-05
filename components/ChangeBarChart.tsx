"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { RegionPoint } from "@/lib/reb";

export default function ChangeBarChart({ data }: { data: RegionPoint[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke="#26324f" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#93a1bd", fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="region"
            tick={{ fill: "#c7d2e8", fontSize: 11 }}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#1b2740",
              border: "1px solid #26324f",
              borderRadius: 8,
              color: "#e8edf7",
              fontSize: 12,
            }}
            formatter={(v: number) => [`${v}%`, "전주대비"]}
          />
          <Bar dataKey="changePct" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.changePct > 0
                    ? "#ff5d73"
                    : d.changePct < 0
                      ? "#3b9dff"
                      : "#8a94a8"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
