import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, type PeriodData } from "@/lib/reb";

export const revalidate = 21600;

function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function pct(v: number) { return v > 0 ? `▲ ${v.toFixed(2)}%` : v < 0 ? `▼ ${Math.abs(v).toFixed(2)}%` : "― 0.00%"; }
function color(v: number) { return v > 0 ? "#d6232a" : v < 0 ? "#1e5bbf" : "#8a94a6"; }
function trim(full: string) { const p = full.split(">"); return p.length <= 1 ? full : `${p[0]} ${p[p.length - 1]}`; }

function buildHtml(pd: PeriodData, type: "weekly" | "monthly", hasWolse: boolean) {
  const cyc = type === "weekly" ? "주간" : "월간";
  const prev = type === "weekly" ? "전주" : "전월";
  const nat = pd.regions["전국"];
  const wolse = pd.regions["전국"]?.월세;
  const sidoSale = [...pd.sido].sort((a, b) => b.매매 - a.매매);
  const sgSale = [...pd.sigungu].sort((a, b) => b.매매 - a.매매).slice(0, 10);
  const sgJeonse = [...pd.sigungu].sort((a, b) => b.전세 - a.전세).slice(0, 10);
  const kpi = (label: string, g: { idx: number; chg: number }) =>
    `<div class="kpi"><div class="kl">${label}</div><div class="kv">${g.idx.toFixed(2)}</div><div class="kd" style="color:${color(g.chg)}">${pct(g.chg)}</div></div>`;
  const sidoRows = sidoSale.map((s, i) =>
    `<tr><td>${i + 1}</td><td>${s.name}</td><td class=n>${s.idx매매.toFixed(2)}</td><td class=n style="color:${color(s.매매)}">${pct(s.매매)}</td><td class=n style="color:${color(s.전세)}">${pct(s.전세)}</td></tr>`).join("");
  const rank = (rows: typeof sgSale, kind: "매매" | "전세") => rows.map((r, i) => {
    const v = kind === "매매" ? r.매매 : r.전세;
    return `<tr><td>${i + 1}</td><td>${trim(r.fullName)}</td><td class=n style="color:${color(v)}">${pct(v)}</td></tr>`;
  }).join("");

  return `<!doctype html><html lang=ko><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>KAR ${cyc} 시장동향 리포트 ${pd.asOf}</title>
<style>
body{font-family:'Malgun Gothic',sans-serif;color:#1a2233;max-width:860px;margin:0 auto;padding:32px;background:#fff}
.h{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0a2a66;padding-bottom:14px}
.k{color:#e1241b;font-size:12px;font-weight:800;letter-spacing:1px}
h1{font-size:24px;margin:4px 0 0;color:#061634}
.meta{text-align:right;font-size:12px;color:#6b7488;line-height:1.7}
.sum{background:#f3f6fc;border:1px solid #e3e8f1;border-radius:8px;padding:14px 16px;margin:18px 0;font-size:14px;line-height:1.7}
.kpis{display:grid;grid-template-columns:repeat(${hasWolse ? 3 : 2},1fr);gap:10px;margin:14px 0}
.kpi{border:1px solid #e3e8f1;border-radius:8px;padding:12px}.kl{font-size:11px;color:#6b7488}.kv{font-size:22px;font-weight:800;margin-top:4px}.kd{font-size:13px;font-weight:700}
h2{font-size:15px;margin:24px 0 8px;color:#0a2a66}
table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{padding:7px 8px;border-bottom:1px solid #e8edf5;text-align:left}th{background:#f3f6fc;color:#6b7488}.n{text-align:right;font-variant-numeric:tabular-nums}
.cols{display:flex;gap:18px}.cols>div{flex:1}
.ft{margin-top:24px;border-top:1px solid #e3e8f1;padding-top:12px;font-size:11px;color:#8a94a6}
@media print{@page{size:A4;margin:12mm}}
</style></head><body>
<div class=h><div><div class=k>한국공인중개사협회 · ${cyc} 분석 리포트</div><h1>${cyc} 아파트 시장동향</h1></div>
<div class=meta>기준 <b>${pd.asOf}</b><br>출처: 한국부동산원${hasWolse ? "" : " · 공공데이터"}</div></div>
<div class=sum>${pd.asOf} 기준 전국 아파트 <b style="color:${color(nat.매매.chg)}">매매 ${pct(nat.매매.chg)}</b>,
<b style="color:${color(nat.전세.chg)}">전세 ${pct(nat.전세.chg)}</b>${hasWolse && wolse ? `, <b style="color:${color(wolse.chg)}">월세 ${pct(wolse.chg)}</b>` : ""}의 변동을 기록했습니다. (${prev}대비)</div>
<div class=kpis>${kpi("전국 매매지수", nat.매매)}${kpi("전국 전세지수", nat.전세)}${hasWolse && wolse ? kpi("전국 월세지수", wolse) : ""}</div>
<h2>시도별 변동률</h2>
<table><thead><tr><th>#</th><th>시도</th><th class=n>매매지수</th><th class=n>매매</th><th class=n>전세</th></tr></thead><tbody>${sidoRows}</tbody></table>
<div class=cols>
<div><h2>시군구 매매 상승 TOP10</h2><table><thead><tr><th>#</th><th>지역</th><th class=n>${prev}대비</th></tr></thead><tbody>${rank(sgSale, "매매")}</tbody></table></div>
<div><h2>시군구 전세 상승 TOP10</h2><table><thead><tr><th>#</th><th>지역</th><th class=n>${prev}대비</th></tr></thead><tbody>${rank(sgJeonse, "전세")}</tbody></table></div>
</div>
<div class=ft>본 리포트는 한국부동산원 ${cyc} 통계를 바탕으로 KAR 부동산 인사이트가 자동 생성했습니다. 브라우저 인쇄(Ctrl+P) → PDF로 저장할 수 있습니다.</div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = (sp.get("type") === "monthly" ? "monthly" : "weekly") as "weekly" | "monthly";
  const date = sp.get("date") || undefined;
  try {
    const data = await getDashboardData(date);
    const pd = data[type];
    const html = buildHtml(pd, type, type === "monthly");
    const fname = `KAR_${type}_report_${pd.asOf}.html`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
