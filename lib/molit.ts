// 공공데이터포털 - 국토교통부 아파트 매매 실거래가 (거래량/평균가)
// XML 응답을 파싱하여 월별 거래건수·평균 거래가를 계산

const BASE =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";

// 대표 시군구 법정동코드 5자리 (MVP 샘플 — 추후 전국 250개로 확장)
export const SAMPLE_LAWD: { name: string; code: string }[] = [
  { name: "서울 강남구", code: "11680" },
  { name: "서울 송파구", code: "11710" },
  { name: "서울 노원구", code: "11350" },
  { name: "경기 성남분당", code: "41135" },
  { name: "인천 연수구", code: "28185" },
  { name: "부산 해운대구", code: "26350" },
];

export interface TradeStat {
  name: string;
  code: string;
  yyyymm: string;
  count: number;        // 거래건수
  avgAmountManwon: number; // 평균 거래금액(만원)
}

function pick(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}

export async function getTradeStat(
  code: string,
  name: string,
  yyyymm: string,
): Promise<TradeStat> {
  const key = process.env.PUBLIC_DATA_KEY;
  if (!key) throw new Error("PUBLIC_DATA_KEY 환경변수가 설정되지 않았습니다.");
  const params = new URLSearchParams({
    serviceKey: key,
    LAWD_CD: code,
    DEAL_YMD: yyyymm,
    numOfRows: "1000",
    pageNo: "1",
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) throw new Error(`MOLIT API HTTP ${res.status}`);
  const xml = await res.text();
  const amounts = pick(xml, "dealAmount")
    .map((a) => Number(a.replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const count = amounts.length;
  const avg =
    count > 0 ? Math.round(amounts.reduce((s, v) => s + v, 0) / count) : 0;
  return { name, code, yyyymm, count, avgAmountManwon: avg };
}

interface AptDeal {
  apt: string;
  amount: number; // 만원
  area: number;   // 전용면적
  umd: string;    // 법정동
}

function parseDeals(xml: string): AptDeal[] {
  const names = pick(xml, "aptNm");
  const amounts = pick(xml, "dealAmount").map((a) =>
    Number(a.replace(/,/g, "")),
  );
  const areas = pick(xml, "excluUseAr").map((a) => Number(a));
  const umds = pick(xml, "umdNm");
  const out: AptDeal[] = [];
  for (let i = 0; i < names.length; i++) {
    if (!amounts[i] || Number.isNaN(amounts[i])) continue;
    out.push({
      apt: names[i],
      amount: amounts[i],
      area: areas[i] || 0,
      umd: umds[i] || "",
    });
  }
  return out;
}

async function fetchDeals(code: string, yyyymm: string): Promise<AptDeal[]> {
  const key = process.env.PUBLIC_DATA_KEY;
  if (!key) throw new Error("PUBLIC_DATA_KEY 환경변수가 설정되지 않았습니다.");
  const params = new URLSearchParams({
    serviceKey: key,
    LAWD_CD: code,
    DEAL_YMD: yyyymm,
    numOfRows: "1000",
    pageNo: "1",
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!res.ok) throw new Error(`MOLIT API HTTP ${res.status}`);
  return parseDeals(await res.text());
}

export interface AptRankItem {
  apt: string;
  region: string;
  umd: string;
  prevAvg: number;  // 전월 평균(만원)
  curAvg: number;   // 당월 평균(만원)
  changePct: number;
  deals: number;    // 당월 거래건수
}

// 단지별 전월대비 평균 거래가 상승률 순위 (샘플 지역, 양월 거래 존재 단지)
export async function getAptComplexRanking(limit = 10): Promise<{
  curMonth: string;
  prevMonth: string;
  risers: AptRankItem[];
}> {
  const cur = recentDealMonth(1);
  const prev = recentDealMonth(2);
  const items: AptRankItem[] = [];

  const perRegion = await Promise.allSettled(
    SAMPLE_LAWD.map(async (r) => {
      const [curDeals, prevDeals] = await Promise.all([
        fetchDeals(r.code, cur),
        fetchDeals(r.code, prev),
      ]);
      const avg = (deals: AptDeal[]) => {
        const m = new Map<string, { sum: number; n: number; umd: string }>();
        for (const d of deals) {
          const e = m.get(d.apt) ?? { sum: 0, n: 0, umd: d.umd };
          e.sum += d.amount;
          e.n += 1;
          m.set(d.apt, e);
        }
        return m;
      };
      const curMap = avg(curDeals);
      const prevMap = avg(prevDeals);
      const res: AptRankItem[] = [];
      for (const [apt, c] of curMap) {
        const p = prevMap.get(apt);
        if (!p || p.n < 1 || c.n < 1) continue;
        const curAvg = Math.round(c.sum / c.n);
        const prevAvg = Math.round(p.sum / p.n);
        if (prevAvg <= 0) continue;
        res.push({
          apt,
          region: r.name,
          umd: c.umd,
          prevAvg,
          curAvg,
          changePct: Math.round(((curAvg - prevAvg) / prevAvg) * 1000) / 10,
          deals: c.n,
        });
      }
      return res;
    }),
  );
  for (const r of perRegion) {
    if (r.status === "fulfilled") items.push(...r.value);
  }
  // 이상치 완화: 당월·전월 각 2건 이상 거래 단지 우선, 상승률 정렬
  const risers = items
    .filter((i) => i.deals >= 1)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, limit);
  return { curMonth: cur, prevMonth: prev, risers };
}

// 직전 달(YYYYMM) — 실거래 신고 지연 고려해 2개월 전 기준
export function recentDealMonth(monthsBack = 1): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getSampleTrades(): Promise<TradeStat[]> {
  const ym = recentDealMonth(1);
  const results = await Promise.allSettled(
    SAMPLE_LAWD.map((r) => getTradeStat(r.code, r.name, ym)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<TradeStat> => r.status === "fulfilled",
    )
    .map((r) => r.value);
}
