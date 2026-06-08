"use client";

import {
  ResponsiveContainer, ComposedChart, LineChart, BarChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie,
} from "recharts";

const RED = "#d6232a", BLUE = "#1e5bbf", NAVY = "#0a2a66", GREEN = "#2f7d52", GOLD = "#c79a3a", PURPLE = "#6b3fd6";
const axis = { fill: "#6b7488", fontSize: 11 };
const grid = "#eef1f7";
const tip = { background: "#fff", border: "1px solid #e3e8f1", borderRadius: 8, fontSize: 12, color: "#1a2233", boxShadow: "0 8px 24px -12px rgba(12,28,64,.3)" } as const;

// ── 시스템별 샘플(예시) 데이터 ──
const realprice = [
  { m: "1월", 실거래: 23.1, 하한: 22.0, 상한: 24.6 },
  { m: "2월", 실거래: 23.6, 하한: 22.4, 상한: 25.0 },
  { m: "3월", 실거래: 24.2, 하한: 22.9, 상한: 25.6 },
  { m: "4월", 실거래: 25.1, 하한: 23.4, 상한: 26.2 },
  { m: "5월", 실거래: 24.7, 하한: 23.7, 상한: 26.6 },
  { m: "6월", 실거래: 25.8, 하한: 24.0, 상한: 27.0 },
];
const population = [
  { age: "20대", 인구: 12.1 }, { age: "30대", 인구: 18.4 }, { age: "40대", 인구: 17.2 },
  { age: "50대", 인구: 15.8 }, { age: "60대", 인구: 13.1 }, { age: "70+", 인구: 9.4 },
];
const migration = [
  { y: "21", 순이동: 1.2 }, { y: "22", 순이동: 2.1 }, { y: "23", 순이동: 3.4 },
  { y: "24", 순이동: 2.8 }, { y: "25", 순이동: 3.6 },
];
const workplace = [
  { ind: "전문·과학", 종사자: 41.2 }, { ind: "도소매", 종사자: 33.5 }, { ind: "제조", 종사자: 28.1 },
  { ind: "정보통신", 종사자: 24.7 }, { ind: "숙박·음식", 종사자: 19.3 }, { ind: "금융", 종사자: 14.8 },
];
const official = [
  { y: "2021", 공시가: 72, 실거래: 100 }, { y: "2022", 공시가: 78, 실거래: 112 },
  { y: "2023", 공시가: 81, 실거래: 104 }, { y: "2024", 공시가: 84, 실거래: 108 },
  { y: "2025", 공시가: 88, 실거래: 116 }, { y: "2026", 공시가: 91, 실거래: 121 },
];
const business = [
  { name: "음식점", v: 1240 }, { name: "카페", v: 860 }, { name: "편의점", v: 540 },
  { name: "미용", v: 420 }, { name: "의류", v: 310 }, { name: "학원", v: 280 },
];
const bizPie = [
  { name: "성장", value: 38, c: RED }, { name: "유지", value: 41, c: GOLD }, { name: "쇠퇴", value: 21, c: BLUE },
];

export default function IscuSample({ id }: { id: string }) {
  if (id === "realprice") {
    return (
      <Wrap title="단지 실거래가 추이 & 적정가 밴드 (예시)">
        <ResponsiveContainer>
          <ComposedChart data={realprice} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="m" tick={axis} stroke="#c5cdda" />
            <YAxis tick={axis} stroke="#c5cdda" unit="억" />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area dataKey="상한" stroke="none" fill="rgba(214,35,42,0.10)" name="적정가 상한" />
            <Area dataKey="하한" stroke="none" fill="#ffffff" name="적정가 하한" />
            <Line dataKey="실거래" stroke={RED} strokeWidth={2.4} dot={{ r: 3 }} name="실거래 평균" />
          </ComposedChart>
        </ResponsiveContainer>
      </Wrap>
    );
  }
  if (id === "population") {
    return (
      <>
        <Wrap title="연령대별 인구 비중 (예시)" height={200}>
          <ResponsiveContainer>
            <BarChart data={population} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" />
              <XAxis dataKey="age" tick={axis} stroke="#c5cdda" />
              <YAxis tick={axis} stroke="#c5cdda" unit="%" />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="인구" radius={[4, 4, 0, 0]} name="인구 비중">
                {population.map((_, i) => <Cell key={i} fill={i === 1 || i === 2 ? NAVY : "#9fb3d6"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Wrap>
        <Mini title="전입 순이동(천 명)" data={migration} xKey="y" dataKey="순이동" color={GREEN} />
      </>
    );
  }
  if (id === "workplace") {
    return (
      <Wrap title="업종별 종사자 수 (예시, 만 명)">
        <ResponsiveContainer>
          <BarChart data={workplace} layout="vertical" margin={{ top: 8, right: 16, left: 20, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={axis} stroke="#c5cdda" />
            <YAxis type="category" dataKey="ind" tick={axis} width={70} stroke="#c5cdda" />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="종사자" radius={[0, 4, 4, 0]} fill={NAVY} name="종사자(만 명)" />
          </BarChart>
        </ResponsiveContainer>
      </Wrap>
    );
  }
  if (id === "officialprice") {
    return (
      <Wrap title="공시가격 vs 실거래가 추이 (예시, 지수)">
        <ResponsiveContainer>
          <LineChart data={official} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="y" tick={axis} stroke="#c5cdda" />
            <YAxis tick={axis} stroke="#c5cdda" />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="실거래" stroke={RED} strokeWidth={2.2} dot={false} name="실거래가" />
            <Line dataKey="공시가" stroke={BLUE} strokeWidth={2.2} dot={false} name="공시가격" />
          </LineChart>
        </ResponsiveContainer>
      </Wrap>
    );
  }
  // business
  return (
    <Wrap title="상권 업종별 점포 수 & 라이프사이클 (예시)">
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, height: "100%" }}>
        <ResponsiveContainer>
          <BarChart data={business} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={axis} stroke="#c5cdda" />
            <YAxis tick={axis} stroke="#c5cdda" />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="v" radius={[4, 4, 0, 0]} fill={GREEN} name="점포 수" />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer>
          <PieChart>
            <Tooltip contentStyle={tip} />
            <Pie data={bizPie} dataKey="value" nameKey="name" innerRadius={38} outerRadius={64} paddingAngle={2}>
              {bizPie.map((e, i) => <Cell key={i} fill={e.c} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Wrap>
  );
}

function Wrap({ title, children, height = 260 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 8 }}>📈 {title}</div>
      <div style={{ width: "100%", height }}>{children}</div>
    </div>
  );
}
function Mini({ title, data, xKey, dataKey, color }: { title: string; data: Record<string, unknown>[]; xKey: string; dataKey: string; color: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="label" style={{ marginBottom: 6, fontSize: 11 }}>{title}</div>
      <div style={{ width: "100%", height: 110 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={axis} stroke="#c5cdda" />
            <YAxis tick={axis} stroke="#c5cdda" />
            <Tooltip contentStyle={tip} />
            <Line dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
