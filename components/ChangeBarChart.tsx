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
          <CartesianGrid stroke="#eef1f7" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#6b7488", fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
            stroke="#c5cdda"
          />
          <YAxis
            type="category"
            dataKey="region"
            tick={{ fill: "#1a2233", fontSize: 11 }}
            width={44}
            stroke="#c5cdda"
          />
          <Tooltip
            cursor={{ fill: "rgba(10,42,102,0.05)" }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e3e8f1",
              borderRadius: 8,
              color: "#1a2233",
              fontSize: 12,
              boxShadow: "0 8px 24px -12px rgba(12,28,64,.3)",
            }}
            formatter={(v: number) => [`${v}%`, "전주대비"]}
          />
          <Bar dataKey="changePct" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.changePct > 0
                    ? "#d6232a"
                    : d.changePct < 0
                      ? "#1e5bbf"
                      : "#8a94a6"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
