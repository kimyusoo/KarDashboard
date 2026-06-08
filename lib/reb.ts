// 한국부동산원 R-ONE OpenAPI 클라이언트
// 주간 아파트 가격동향(매매/전세 가격지수) 조회 및 전주대비 변동률 계산

import { rebKeyFromFullName } from "./regions";

const BASE = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";

// 주간 아파트 가격지수(매매/전세)
export const STAT_TABLES = {
  매매가격지수: "T244183132827305",
  전세가격지수: "T247713133046872",
} as const;

// 월간 아파트 가격지수(매매/전세/월세) — 월세는 주간 미제공으로 월간 사용
export const MONTHLY_TABLES = {
  매매: "A_2024_00045",
  전세: "A_2024_00050",
  월세: "A_2024_00055",
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
  cycle: "WK" | "MM" = "WK",
): Promise<{ rows: RebRow[]; total: number }> {
  const key = process.env.REB_API_KEY;
  if (!key) throw new Error("REB_API_KEY 환경변수가 설정되지 않았습니다.");
  const params = new URLSearchParams({
    KEY: key,
    Type: "json",
    pIndex: String(pIndex),
    pSize: String(PAGE_SIZE),
    STATBL_ID: statblId,
    DTACYCLE_CD: cycle,
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
  cycle: "WK" | "MM" = "WK",
): Promise<RebRow[]> {
  const first = await fetchPage(statblId, startWk, endWk, 1, cycle);
  const all = [...first.rows];
  const pages = Math.ceil(first.total / PAGE_SIZE);
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        fetchPage(statblId, startWk, endWk, i + 2, cycle),
      ),
    );
    for (const p of rest) all.push(...p.rows);
  }
  return all;
}

// 최근 N개월 범위 (YYYYMM)
function monthRange(monthsBack = 4): { start: string; end: string } {
  const now = new Date();
  const end = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const s = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const start = `${s.getFullYear()}${String(s.getMonth() + 1).padStart(2, "0")}`;
  return { start, end };
}

export interface MonthlySnapshot {
  latestMonth: string; // YYYY-MM
  nationwide: { 매매: RegionPoint; 전세: RegionPoint; 월세: RegionPoint };
  sidoByType: {
    매매: RegionPoint[];
    전세: RegionPoint[];
    월세: RegionPoint[];
  };
}

async function monthlyPoints(statblId: string) {
  const { start, end } = monthRange(4);
  const rows = await fetchTable(statblId, start, end, "MM");
  const { latestId, byRegion } = buildRegionPoints(rows);
  const ym = `${latestId.slice(0, 4)}-${latestId.slice(4)}`;
  const nation =
    byRegion.find((p) => p.region === "전국") ?? byRegion[0];
  const sido = byRegion
    .filter((p) => p.isSido)
    .sort((a, b) => b.changePct - a.changePct);
  return { ym, nation, sido };
}

export async function getMonthlySnapshot(): Promise<MonthlySnapshot> {
  const [sale, jeonse, wolse] = await Promise.all([
    monthlyPoints(MONTHLY_TABLES.매매),
    monthlyPoints(MONTHLY_TABLES.전세),
    monthlyPoints(MONTHLY_TABLES.월세),
  ]);
  return {
    latestMonth: wolse.ym,
    nationwide: { 매매: sale.nation, 전세: jeonse.nation, 월세: wolse.nation },
    sidoByType: { 매매: sale.sido, 전세: jeonse.sido, 월세: wolse.sido },
  };
}

// 기준일(asOf) 시점 기준 최근 N주를 커버하는 범위 문자열 생성
function weekRange(weeksBack = 16, asOf: Date = new Date()): { start: string; end: string } {
  const year = asOf.getFullYear();
  // ISO-주차 근사: 연초 대비 경과주
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(
    ((asOf.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
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
  sigunguSaleAll: RegionPoint[];   // 시군구 전체(지도용)
  sigunguJeonseAll: RegionPoint[];
  trend: TrendPoint[];     // 전국 매매/전세 지수 추이
}

function buildRegionPoints(
  rows: RebRow[],
  asOf?: string, // YYYY-MM-DD: 이 날짜 이하의 최신 시점을 '기준'으로 사용
): {
  latestId: string;
  prevId: string;
  byRegion: RegionPoint[];
} {
  const weeks = Array.from(new Set(rows.map((r) => r.WRTTIME_IDTFR_ID))).sort();
  // 주차ID -> 기준일(WRTTIME_DESC) 매핑
  const descByWeek = new Map<string, string>();
  for (const r of rows) {
    if (!descByWeek.has(r.WRTTIME_IDTFR_ID))
      descByWeek.set(r.WRTTIME_IDTFR_ID, r.WRTTIME_DESC);
  }
  // 기준일이 주어지면 그 날짜 이하의 최신 주차를 선택
  let latestIdx = weeks.length - 1;
  if (asOf) {
    const candidates = weeks.filter((w) => (descByWeek.get(w) ?? "") <= asOf);
    if (candidates.length > 0) {
      latestIdx = weeks.indexOf(candidates[candidates.length - 1]);
    } else {
      latestIdx = 0; // 선택 날짜가 데이터보다 이전이면 가장 오래된 주차
    }
  }
  const latestId = weeks[latestIdx];
  const prevId = weeks[latestIdx - 1] ?? latestId;
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

export async function getMarketSnapshot(
  asOf?: string, // YYYY-MM-DD (기준일) — 생략 시 최신
): Promise<MarketSnapshot> {
  const asOfDate = asOf ? new Date(asOf) : new Date();
  const { start, end } = weekRange(16, asOfDate);
  const [saleRows, jeonseRows] = await Promise.all([
    fetchTable(STAT_TABLES.매매가격지수, start, end),
    fetchTable(STAT_TABLES.전세가격지수, start, end),
  ]);

  const sale = buildRegionPoints(saleRows, asOf);
  const jeonse = buildRegionPoints(jeonseRows, asOf);

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

  // 실제 시군구만(권역 집계 제외) — rebKeyFromFullName이 null이 아니면 시군구
  const sigunguSaleAll = sale.byRegion
    .filter((p) => rebKeyFromFullName(p.fullName) !== null)
    .sort((a, b) => b.changePct - a.changePct);
  const sigunguJeonseAll = jeonse.byRegion
    .filter((p) => rebKeyFromFullName(p.fullName) !== null)
    .sort((a, b) => b.changePct - a.changePct);
  const sigunguSaleTop = sigunguSaleAll.slice(0, 10);
  const sigunguJeonseTop = sigunguJeonseAll.slice(0, 10);

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
    .filter((week) => !latestWeek || week <= latestWeek) // 기준일까지만
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
    sigunguSaleAll,
    sigunguJeonseAll,
    trend,
  };
}

/* =====================================================================
   통합 대시보드 페이로드 (주간/월간 × 전국+17시도 + 시군구)
   ===================================================================== */

export interface Gauge { idx: number; chg: number }
export interface TrendPt { t: string; 매매: number; 전세: number; 월세?: number }
export interface RegionBlock {
  name: string;
  매매: Gauge;
  전세: Gauge;
  월세?: Gauge;
  trend: TrendPt[];
}
export interface SidoChg {
  name: string;
  매매: number; 전세: number; 월세?: number;
  idx매매: number; idx전세: number;
}
export interface SigunguItem {
  name: string; fullName: string; parent: string;
  매매: number; 전세: number; idx매매: number;
}
export interface PeriodData {
  asOf: string;
  hasWolse: boolean;
  regions: Record<string, RegionBlock>;
  sido: SidoChg[];
  sigungu: SigunguItem[];
}
export interface DashboardData {
  weekly: PeriodData;
  monthly: PeriodData;
}

function resolveIds(rows: RebRow[], asOf?: string, asOfId?: string) {
  const ids = Array.from(new Set(rows.map((r) => r.WRTTIME_IDTFR_ID))).sort();
  const descMap = new Map<string, string>();
  for (const r of rows) if (!descMap.has(r.WRTTIME_IDTFR_ID)) descMap.set(r.WRTTIME_IDTFR_ID, r.WRTTIME_DESC);
  let cand = ids;
  if (asOfId) cand = ids.filter((i) => i <= asOfId);
  else if (asOf) cand = ids.filter((i) => (descMap.get(i) || "") <= asOf);
  if (!cand.length) cand = [ids[0]];
  const li = ids.indexOf(cand[cand.length - 1]);
  return { ids, descMap, latestId: ids[li], prevId: ids[li - 1] ?? ids[li] };
}

function topGauge(rows: RebRow[], latestId: string, prevId: string, name: string): Gauge {
  const cur = rows.find((r) => r.WRTTIME_IDTFR_ID === latestId && r.CLS_NM === name && !r.CLS_FULLNM.includes(">"));
  if (!cur) return { idx: 0, chg: 0 };
  const prev = rows.find((r) => r.WRTTIME_IDTFR_ID === prevId && r.CLS_NM === name && !r.CLS_FULLNM.includes(">"));
  const chg = prev && prev.DTA_VAL ? round(((cur.DTA_VAL - prev.DTA_VAL) / prev.DTA_VAL) * 100, 2) : 0;
  return { idx: round(cur.DTA_VAL), chg };
}

function buildPeriod(
  sale: RebRow[],
  jeonse: RebRow[],
  wolse: RebRow[] | null,
  weekly: boolean,
  asOf?: string,
  asOfId?: string,
): PeriodData {
  const rs = resolveIds(sale, asOf, asOfId);
  const { latestId, prevId, ids, descMap } = rs;
  const label = (id: string) =>
    weekly ? (descMap.get(id) || id) : `${id.slice(0, 4)}-${id.slice(4)}`;
  const asOfLabel = weekly ? (descMap.get(latestId) || "") : `${latestId.slice(0, 4)}-${latestId.slice(4)}`;

  const names = ["전국", ...SIDO];
  const last16 = ids.filter((i) => i <= latestId).slice(-16);

  // 추이 시리즈 (전국+시도)
  function seriesMap(rows: RebRow[]) {
    const m = new Map<string, Map<string, number>>(); // name -> id -> val
    for (const r of rows) {
      if (r.CLS_FULLNM.includes(">")) continue;
      if (!names.includes(r.CLS_NM)) continue;
      if (!last16.includes(r.WRTTIME_IDTFR_ID)) continue;
      if (!m.has(r.CLS_NM)) m.set(r.CLS_NM, new Map());
      m.get(r.CLS_NM)!.set(r.WRTTIME_IDTFR_ID, round(r.DTA_VAL));
    }
    return m;
  }
  const sM = seriesMap(sale), jM = seriesMap(jeonse), wM = wolse ? seriesMap(wolse) : null;

  const regions: Record<string, RegionBlock> = {};
  for (const nm of names) {
    const trend: TrendPt[] = last16.map((id) => ({
      t: label(id),
      매매: sM.get(nm)?.get(id) ?? 0,
      전세: jM.get(nm)?.get(id) ?? 0,
      ...(wM ? { 월세: wM.get(nm)?.get(id) ?? 0 } : {}),
    }));
    regions[nm] = {
      name: nm,
      매매: topGauge(sale, latestId, prevId, nm),
      전세: topGauge(jeonse, latestId, prevId, nm),
      ...(wolse ? { 월세: topGauge(wolse, latestId, prevId, nm) } : {}),
      trend,
    };
  }

  const sido: SidoChg[] = SIDO.map((nm) => ({
    name: nm,
    매매: regions[nm].매매.chg,
    전세: regions[nm].전세.chg,
    ...(wolse ? { 월세: regions[nm].월세?.chg ?? 0 } : {}),
    idx매매: regions[nm].매매.idx,
    idx전세: regions[nm].전세.idx,
  }));

  // 시군구 (매매 기준 + 전세 병합)
  const prevSaleById = new Map<number, number>();
  for (const r of sale) if (r.WRTTIME_IDTFR_ID === prevId) prevSaleById.set(r.CLS_ID, r.DTA_VAL);
  const prevJeonseById = new Map<number, number>();
  for (const r of jeonse) if (r.WRTTIME_IDTFR_ID === prevId) prevJeonseById.set(r.CLS_ID, r.DTA_VAL);
  const jeonseLatest = new Map<number, number>();
  for (const r of jeonse) if (r.WRTTIME_IDTFR_ID === latestId) jeonseLatest.set(r.CLS_ID, r.DTA_VAL);

  const sigungu: SigunguItem[] = [];
  for (const r of sale) {
    if (r.WRTTIME_IDTFR_ID !== latestId) continue;
    if (rebKeyFromFullName(r.CLS_FULLNM) === null) continue;
    const ps = prevSaleById.get(r.CLS_ID);
    const 매매chg = ps ? round(((r.DTA_VAL - ps) / ps) * 100, 2) : 0;
    const jl = jeonseLatest.get(r.CLS_ID);
    const pj = prevJeonseById.get(r.CLS_ID);
    const 전세chg = jl && pj ? round(((jl - pj) / pj) * 100, 2) : 0;
    sigungu.push({
      name: r.CLS_NM,
      fullName: r.CLS_FULLNM,
      parent: r.CLS_FULLNM.split(">")[0],
      매매: 매매chg,
      전세: 전세chg,
      idx매매: round(r.DTA_VAL),
    });
  }

  return { asOf: asOfLabel, hasWolse: !!wolse, regions, sido, sigungu };
}

export async function getDashboardData(asOf?: string): Promise<DashboardData> {
  const asOfDate = asOf ? new Date(asOf) : new Date();
  const wr = weekRange(16, asOfDate);
  const mr = monthRange(15);
  const asOfMonthId = asOf ? `${asOf.slice(0, 4)}${asOf.slice(5, 7)}` : undefined;

  const [wSale, wJeonse, mSale, mJeonse, mWolse] = await Promise.all([
    fetchTable(STAT_TABLES.매매가격지수, wr.start, wr.end, "WK"),
    fetchTable(STAT_TABLES.전세가격지수, wr.start, wr.end, "WK"),
    fetchTable(MONTHLY_TABLES.매매, mr.start, mr.end, "MM"),
    fetchTable(MONTHLY_TABLES.전세, mr.start, mr.end, "MM"),
    fetchTable(MONTHLY_TABLES.월세, mr.start, mr.end, "MM"),
  ]);

  return {
    weekly: buildPeriod(wSale, wJeonse, null, true, asOf, undefined),
    monthly: buildPeriod(mSale, mJeonse, mWolse, false, undefined, asOfMonthId),
  };
}
