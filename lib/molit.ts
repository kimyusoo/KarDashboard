// 공공데이터포털 - 국토교통부 아파트 실거래가 (매매/전월세)
// 매매: RTMSDataSvcAptTrade, 전월세: RTMSDataSvcAptRent (monthlyRent==0 → 전세)

const TRADE_BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
const RENT_BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent";

export type TradeType = "sale" | "jeonse" | "wolse";
export const TRADE_LABEL: Record<TradeType, string> = { sale: "매매", jeonse: "전세", wolse: "월세" };

// 시도 → 시군구(법정동코드 5자리) — 동향·핵심지표와 동일한 2단 선택용
export const LAWD_BY_SIDO: Record<string, { name: string; code: string }[]> = {
  서울: [
    { name: "종로구", code: "11110" }, { name: "중구", code: "11140" }, { name: "용산구", code: "11170" },
    { name: "성동구", code: "11200" }, { name: "광진구", code: "11215" }, { name: "동대문구", code: "11230" },
    { name: "중랑구", code: "11260" }, { name: "성북구", code: "11290" }, { name: "강북구", code: "11305" },
    { name: "도봉구", code: "11320" }, { name: "노원구", code: "11350" }, { name: "은평구", code: "11380" },
    { name: "서대문구", code: "11410" }, { name: "마포구", code: "11440" }, { name: "양천구", code: "11470" },
    { name: "강서구", code: "11500" }, { name: "구로구", code: "11530" }, { name: "금천구", code: "11545" },
    { name: "영등포구", code: "11560" }, { name: "동작구", code: "11590" }, { name: "관악구", code: "11620" },
    { name: "서초구", code: "11650" }, { name: "강남구", code: "11680" }, { name: "송파구", code: "11710" },
    { name: "강동구", code: "11740" },
  ],
  경기: [
    { name: "수원시 장안구", code: "41111" }, { name: "수원시 권선구", code: "41113" }, { name: "수원시 팔달구", code: "41115" },
    { name: "수원시 영통구", code: "41117" }, { name: "성남시 수정구", code: "41131" }, { name: "성남시 중원구", code: "41133" },
    { name: "성남시 분당구", code: "41135" }, { name: "안양시 만안구", code: "41171" }, { name: "안양시 동안구", code: "41173" },
    { name: "부천시", code: "41190" }, { name: "광명시", code: "41210" }, { name: "평택시", code: "41220" },
    { name: "안산시 상록구", code: "41271" }, { name: "안산시 단원구", code: "41273" }, { name: "고양시 덕양구", code: "41281" },
    { name: "고양시 일산동구", code: "41285" }, { name: "고양시 일산서구", code: "41287" }, { name: "의정부시", code: "41150" },
    { name: "용인시 처인구", code: "41461" }, { name: "용인시 기흥구", code: "41463" }, { name: "용인시 수지구", code: "41465" },
    { name: "남양주시", code: "41360" }, { name: "화성시", code: "41590" }, { name: "시흥시", code: "41390" },
    { name: "파주시", code: "41480" }, { name: "김포시", code: "41570" }, { name: "광주시", code: "41610" }, { name: "하남시", code: "41450" },
  ],
  인천: [
    { name: "중구", code: "28110" }, { name: "동구", code: "28140" }, { name: "미추홀구", code: "28177" },
    { name: "연수구", code: "28185" }, { name: "남동구", code: "28200" }, { name: "부평구", code: "28237" },
    { name: "계양구", code: "28245" }, { name: "서구", code: "28260" },
  ],
  부산: [
    { name: "중구", code: "26110" }, { name: "서구", code: "26140" }, { name: "동구", code: "26170" }, { name: "영도구", code: "26200" },
    { name: "부산진구", code: "26230" }, { name: "동래구", code: "26260" }, { name: "남구", code: "26290" }, { name: "북구", code: "26320" },
    { name: "해운대구", code: "26350" }, { name: "사하구", code: "26380" }, { name: "금정구", code: "26410" }, { name: "강서구", code: "26440" },
    { name: "연제구", code: "26470" }, { name: "수영구", code: "26500" }, { name: "사상구", code: "26530" }, { name: "기장군", code: "26710" },
  ],
  대구: [
    { name: "중구", code: "27110" }, { name: "동구", code: "27140" }, { name: "서구", code: "27170" }, { name: "남구", code: "27200" },
    { name: "북구", code: "27230" }, { name: "수성구", code: "27260" }, { name: "달서구", code: "27290" }, { name: "달성군", code: "27710" },
  ],
  대전: [
    { name: "동구", code: "30110" }, { name: "중구", code: "30140" }, { name: "서구", code: "30170" }, { name: "유성구", code: "30200" }, { name: "대덕구", code: "30230" },
  ],
  광주: [
    { name: "동구", code: "29110" }, { name: "서구", code: "29140" }, { name: "남구", code: "29155" }, { name: "북구", code: "29170" }, { name: "광산구", code: "29200" },
  ],
  울산: [
    { name: "중구", code: "31110" }, { name: "남구", code: "31140" }, { name: "동구", code: "31170" }, { name: "북구", code: "31200" }, { name: "울주군", code: "31710" },
  ],
  세종: [{ name: "세종시", code: "36110" }],
  충북: [{ name: "청주시 상당구", code: "43111" }, { name: "청주시 서원구", code: "43112" }, { name: "청주시 흥덕구", code: "43113" }, { name: "청주시 청원구", code: "43114" }, { name: "충주시", code: "43130" }, { name: "제천시", code: "43150" }],
  충남: [{ name: "천안시 동남구", code: "44131" }, { name: "천안시 서북구", code: "44133" }, { name: "아산시", code: "44200" }, { name: "서산시", code: "44210" }, { name: "당진시", code: "44270" }, { name: "공주시", code: "44150" }],
  전북: [{ name: "전주시 완산구", code: "45111" }, { name: "전주시 덕진구", code: "45113" }, { name: "군산시", code: "45130" }, { name: "익산시", code: "45140" }],
  전남: [{ name: "목포시", code: "46110" }, { name: "여수시", code: "46130" }, { name: "순천시", code: "46150" }, { name: "광양시", code: "46230" }],
  경북: [{ name: "포항시 남구", code: "47111" }, { name: "포항시 북구", code: "47113" }, { name: "경주시", code: "47130" }, { name: "구미시", code: "47190" }, { name: "경산시", code: "47290" }],
  경남: [{ name: "창원시 의창구", code: "48121" }, { name: "창원시 성산구", code: "48123" }, { name: "창원시 마산합포구", code: "48125" }, { name: "창원시 마산회원구", code: "48127" }, { name: "창원시 진해구", code: "48129" }, { name: "김해시", code: "48250" }, { name: "진주시", code: "48170" }, { name: "양산시", code: "48330" }],
  강원: [{ name: "춘천시", code: "51110" }, { name: "원주시", code: "51130" }, { name: "강릉시", code: "51150" }],
  제주: [{ name: "제주시", code: "50110" }, { name: "서귀포시", code: "50130" }],
};

export const LAWD_SIDO_LIST = Object.keys(LAWD_BY_SIDO);

// 평탄화 목록(하위호환)
export const LAWD_LIST: { name: string; code: string }[] = Object.entries(LAWD_BY_SIDO).flatMap(
  ([sido, arr]) => arr.map((r) => ({ name: `${sido} ${r.name}`, code: r.code })),
);

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
