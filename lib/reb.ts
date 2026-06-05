// 한국부동산원 R-ONE OpenAPI 클라이언트
// 주간 아파트 가격동향(매매/전세 가격지수) 조회 및 전주대비 변동률 계산

const BASE = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";

export const STAT_TABLES = {
  매매가격지수: "T244183132827305",
  전세가격지수: "T247713133046872",
} as const;

// 17개 시도 (광역 단위) — 최상위 분류 중 권역/전국 제외용
export const SIDO = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

// 권역/전국 요약 분류
export const REGION_GROUPS = [
  "전국", "수도권", "지방권", "6대광역시", "5대광역시", "9개도", "8개도",
];

export interface RebRow {
  WRTTIME_IDTFR_ID: string; // YYYYWW (연+주차)
  WRTTIME_DESC: string;     // YYYY-MM-DD (해당 주 기준일)
  CLS_ID: number;
  CLS_NM: string;           // 지역명
  CLS_FULLNM: string;       // 계층 (시도>권역>시군구)
  ITM_NM: string;
  DTA_VAL: number;          // 지수값
}

interface RebRaw {
  SttsApiTblData?: [
    { head: unknown[] },
    { row: RebRow[] }
  ];
  RESULT?: { CODE: string; MESSAGE: string };
}

const PAGE_SIZE = 1000; // R-ONE API는 1회 최대 1,000건

async function fetchPage(
  statblId: string,
  startWk: string,
  endWk: string,
  pIndex: number,
): Promise<{ rows: RebRow[]; total: number }> {
  const key = process.env.REB_API_KEY;
  if (!key) throw new Error("REB_API_KEY 환경변수가 설정되지 않았습니다.");
  const params = new URLSearchParams({
    KEY: key,
    Type: "json",
    pIndex: String(pIndex),
    pSize: String(PAGE_SIZE),
    STATBL_ID: statblId,
    DTACYCLE_CD: "WK",
    START_WRTTIME: startWk,
    END_WRTTIME: endWk,
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    // 주간 통계는 주 1~2회 갱신 → 6시간 캐시
    next: { revalidate: 60 * 60 * 6 },
  });
  if (!res.ok) throw new Error(`REB API HTTP ${res.status}`);
  const json = (await res.json()) as RebRaw;
  if (!json.SttsApiTblData) return { rows: [], total: 0 };
  const head = json.SttsApiTblData[0]?.head as
    | Array<{ list_total_count?: number }>
    | undefined;
  const total = head?.[0]?.list_total_count ?? 0;
  return { rows: json.SttsApiTblData[1]?.row ?? [], total };
}

async function fetchTable(
  statblId: string,
  startWk: string,
  endWk: string,
): Promise<RebRow[]> {
  const first = await fetchPage(statblId, startWk, endWk, 1);
  const all = [...first.rows];
  const pages = Math.ceil(first.total / PAGE_SIZE);
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        fetchPage(statblId, startWk, endWk, i + 2),
      ),
    );
    for (const p of rest) all.push(...p.rows);
  }
  return all;
}

// 현재 연/주차 추정 후 최근 N주를 커버하는 범위 문자열 생성
function weekRange(weeksBack = 16): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  // ISO-주차 근사: 연초 대비 경과주
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
  );
  const end = `${year}${String(Math.min(week + 1, 53)).padStart(2, "0")}`;
  // 연초 근처면 전년도까지 포함하도록 넉넉히 start를 잡되 같은 해 기준 단순화
  const startWeek = week - weeksBack;
  const start =
    startWeek > 0
      ? `${year}${String(startWeek).padStart(2, "0")}`
      : `${year - 1}${String(53 + startWeek).padStart(2, "0")}`;
  return { start, end };
}

export interface RegionPoint {
  region: string;
  fullName: string;
  isSido: boolean;
  isGroup: boolean;
  index: number;       // 최신 지수
  prevIndex: number;   // 직전 주차 지수
  changePct: number;   // 전주대비 변동률(%)
}

export interface TrendPoint {
  week: string; // YYYY-MM-DD
  매매: number;
  전세: number;
}

export interface MarketSnapshot {
  latestWeek: string;      // YYYY-MM-DD
  latestWeekId: string;    // YYYYWW
  nationwide: { 매매: RegionPoint; 전세: RegionPoint };
  sidoSale: RegionPoint[]; // 시도별 매매 변동률
  sidoJeonse: RegionPoint[];
  sigunguSaleTop: RegionPoint[];   // 시군구 매매 상승 Top
  sigunguJeonseTop: RegionPoint[];
  trend: TrendPoint[];     // 전국 매매/전세 지수 추이
}

function buildRegionPoints(rows: RebRow[]): {
  latestId: string;
  prevId: string;
  byRegion: RegionPoint[];
} {
  const weeks = Array.from(new Set(rows.map((r) => r.WRTTIME_IDTFR_ID))).sort();
  const latestId = weeks[weeks.length - 1];
  const prevId = weeks[weeks.length - 2] ?? latestId;
  const latest = rows.filter((r) => r.WRTTIME_IDTFR_ID === latestId);
  const prevMap = new Map(
    rows
      .filter((r) => r.WRTTIME_IDTFR_ID === prevId)
      .map((r) => [r.CLS_ID, r.DTA_VAL]),
  );
  const byRegion: RegionPoint[] = latest.map((r) => {
    const prev = prevMap.get(r.CLS_ID) ?? r.DTA_VAL;
    const isGroup = REGION_GROUPS.includes(r.CLS_NM) && !r.CLS_FULLNM.includes(">");
    const isSido = SIDO.includes(r.CLS_NM) && !r.CLS_FULLNM.includes(">");
    return {
      region: r.CLS_NM,
      fullName: r.CLS_FULLNM,
      isSido,
      isGroup,
      index: round(r.DTA_VAL),
      prevIndex: round(prev),
      changePct: round(((r.DTA_VAL - prev) / prev) * 100, 2),
    };
  });
  return { latestId, prevId, byRegion };
}

function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const { start, end } = weekRange(16);
  const [saleRows, jeonseRows] = await Promise.all([
    fetchTable(STAT_TABLES.매매가격지수, start, end),
    fetchTable(STAT_TABLES.전세가격지수, start, end),
  ]);

  const sale = buildRegionPoints(saleRows);
  const jeonse = buildRegionPoints(jeonseRows);

  const latestWeek =
    saleRows.find((r) => r.WRTTIME_IDTFR_ID === sale.latestId)?.WRTTIME_DESC ??
    "";

  const emptyPoint: RegionPoint = {
    region: "전국",
    fullName: "전국",
    isSido: false,
    isGroup: true,
    index: 0,
    prevIndex: 0,
    changePct: 0,
  };
  const nationSale =
    sale.byRegion.find((p) => p.region === "전국") ?? emptyPoint;
  const nationJeonse =
    jeonse.byRegion.find((p) => p.region === "전국") ?? emptyPoint;

  const sidoSale = sale.byRegion
    .filter((p) => p.isSido)
    .sort((a, b) => b.changePct - a.changePct);
  const sidoJeonse = jeonse.byRegion
    .filter((p) => p.isSido)
    .sort((a, b) => b.changePct - a.changePct);

  const sigunguSaleTop = sale.byRegion
    .filter((p) => p.fullName.includes(">"))
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 10);
  const sigunguJeonseTop = jeonse.byRegion
    .filter((p) => p.fullName.includes(">"))
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 10);

  // 전국 추이
  const saleNationByWeek = new Map(
    saleRows
      .filter((r) => r.CLS_NM === "전국" && !r.CLS_FULLNM.includes(">"))
      .map((r) => [r.WRTTIME_DESC, round(r.DTA_VAL)]),
  );
  const jeonseNationByWeek = new Map(
    jeonseRows
      .filter((r) => r.CLS_NM === "전국" && !r.CLS_FULLNM.includes(">"))
      .map((r) => [r.WRTTIME_DESC, round(r.DTA_VAL)]),
  );
  const trend: TrendPoint[] = Array.from(saleNationByWeek.keys())
    .sort()
    .map((week) => ({
      week,
      매매: saleNationByWeek.get(week) ?? 0,
      전세: jeonseNationByWeek.get(week) ?? 0,
    }));

  return {
    latestWeek,
    latestWeekId: sale.latestId,
    nationwide: { 매매: nationSale, 전세: nationJeonse },
    sidoSale,
    sidoJeonse,
    sigunguSaleTop,
    sigunguJeonseTop,
    trend,
  };
}
