// 공공데이터포털 - 국토교통부 아파트 실거래가 (매매/전월세)
// 매매: RTMSDataSvcAptTrade, 전월세: RTMSDataSvcAptRent (monthlyRent==0 → 전세)

const TRADE_BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
const RENT_BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";

export type TradeType = "sale" | "jeonse" | "wolse";
export const TRADE_LABEL: Record<TradeType, string> = { sale: "매매", jeonse: "전세", wolse: "월세" };

// 선택 가능한 시군구(법정동코드 5자리)
export const LAWD_LIST: { name: string; code: string }[] = [
  { name: "서울 강남구", code: "11680" },
  { name: "서울 서초구", code: "11650" },
  { name: "서울 송파구", code: "11710" },
  { name: "서울 마포구", code: "11440" },
  { name: "서울 노원구", code: "11350" },
  { name: "서울 강서구", code: "11500" },
  { name: "성남시 분당구", code: "41135" },
  { name: "수원시 영통구", code: "41117" },
  { name: "용인시 수지구", code: "41465" },
  { name: "고양시 일산동구", code: "41285" },
  { name: "화성시", code: "41590" },
  { name: "인천 연수구", code: "28185" },
  { name: "인천 부평구", code: "28237" },
  { name: "부산 해운대구", code: "26350" },
  { name: "부산진구", code: "26230" },
  { name: "대구 수성구", code: "27260" },
  { name: "대전 유성구", code: "30200" },
  { name: "광주 광산구", code: "29200" },
  { name: "울산 남구", code: "31140" },
  { name: "세종시", code: "36110" },
  { name: "청주시 흥덕구", code: "43113" },
  { name: "천안시 서북구", code: "44133" },
  { name: "전주시 완산구", code: "45111" },
  { name: "포항시 북구", code: "47113" },
  { name: "창원시 성산구", code: "48123" },
];

function pick(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}
function num(s: string) {
  const n = Number((s || "").replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

interface Deal { apt: string; umd: string; area: number; value: number }

async function fetchDeals(type: TradeType, code: string, ym: string): Promise<Deal[]> {
  const key = process.env.PUBLIC_DATA_KEY;
  if (!key) throw new Error("PUBLIC_DATA_KEY 환경변수가 없습니다.");
  const base = type === "sale" ? TRADE_BASE : RENT_BASE;
  const params = new URLSearchParams({ serviceKey: key, LAWD_CD: code, DEAL_YMD: ym, numOfRows: "1000", pageNo: "1" });
  const res = await fetch(`${base}?${params.toString()}`, { next: { revalidate: 60 * 60 * 12 } });
  if (!res.ok) throw new Error(`MOLIT ${res.status}`);
  const xml = await res.text();
  const apts = pick(xml, "aptNm");
  const areas = pick(xml, "excluUseAr").map(Number);
  const umds = pick(xml, "umdNm");
  const out: Deal[] = [];
  if (type === "sale") {
    const amts = pick(xml, "dealAmount").map(num);
    for (let i = 0; i < apts.length; i++) {
      if (amts[i] > 0) out.push({ apt: apts[i], umd: umds[i] || "", area: areas[i] || 0, value: amts[i] });
    }
  } else {
    const deps = pick(xml, "deposit").map(num);
    const rents = pick(xml, "monthlyRent").map(num);
    for (let i = 0; i < apts.length; i++) {
      const isWolse = rents[i] > 0;
      if (type === "wolse" && !isWolse) continue;
      if (type === "jeonse" && isWolse) continue;
      const value = type === "wolse" ? rents[i] : deps[i];
      if (value > 0) out.push({ apt: apts[i], umd: umds[i] || "", area: areas[i] || 0, value });
    }
  }
  return out;
}

export function recentDealMonth(monthsBack = 1): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// 단지별 전월대비 평균(매매가/보증금/월세) 상승률 TOP
export interface AptRankItem { apt: string; umd: string; prevAvg: number; curAvg: number; changePct: number; deals: number }
export async function getAptRanking(type: TradeType, code: string, limit = 10): Promise<{
  curMonth: string; prevMonth: string; type: TradeType; risers: AptRankItem[];
}> {
  const cur = recentDealMonth(1);
  const prev = recentDealMonth(2);
  const [curDeals, prevDeals] = await Promise.all([fetchDeals(type, code, cur), fetchDeals(type, code, prev)]);
  const avg = (deals: Deal[]) => {
    const m = new Map<string, { sum: number; n: number; umd: string }>();
    for (const d of deals) {
      const e = m.get(d.apt) ?? { sum: 0, n: 0, umd: d.umd };
      e.sum += d.value; e.n += 1; m.set(d.apt, e);
    }
    return m;
  };
  const cM = avg(curDeals), pM = avg(prevDeals);
  const items: AptRankItem[] = [];
  for (const [apt, c] of cM) {
    const p = pM.get(apt);
    if (!p) continue;
    const curAvg = Math.round(c.sum / c.n), prevAvg = Math.round(p.sum / p.n);
    if (prevAvg <= 0) continue;
    items.push({ apt, umd: c.umd, prevAvg, curAvg, changePct: Math.round(((curAvg - prevAvg) / prevAvg) * 1000) / 10, deals: c.n });
  }
  return { curMonth: cur, prevMonth: prev, type, risers: items.sort((a, b) => b.changePct - a.changePct).slice(0, limit) };
}

// 거래량 + 평균(매매가/보증금/월세) — 당월 + 전월
export interface VolumeStat { type: TradeType; curMonth: string; prevMonth: string; count: number; prevCount: number; avg: number; prevAvg: number }
export async function getVolumeStat(type: TradeType, code: string): Promise<VolumeStat> {
  const cur = recentDealMonth(1), prev = recentDealMonth(2);
  const [c, p] = await Promise.all([fetchDeals(type, code, cur), fetchDeals(type, code, prev)]);
  const mean = (d: Deal[]) => (d.length ? Math.round(d.reduce((s, x) => s + x.value, 0) / d.length) : 0);
  return { type, curMonth: cur, prevMonth: prev, count: c.length, prevCount: p.length, avg: mean(c), prevAvg: mean(p) };
}
