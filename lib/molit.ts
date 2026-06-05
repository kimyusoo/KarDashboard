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
