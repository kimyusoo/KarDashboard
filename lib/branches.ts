// 한국공인중개사협회 시도회/지회 매핑
// 출처: https://www.kar.or.kr/pabout/branch.asp (2026-06 기준 파싱)
// REB 시군구 지도 키(`시도|시군구명`)와 정규화 호환 → 시군구 클릭 시 담당 지회 연결

import raw from "./branches.data.json";

export interface Branch {
  sidohoe: string; // 시도회명 (예: 서울특별시남부회)
  branch: string; // 지회명
  address: string;
  tel: string;
  fax: string;
  sido: string; // 시도 약칭 (서울/경기/...)
  sigungu: string; // 시군구 (일반구는 "성남시 분당구")
  isHQ: boolean; // 시도회 본부 여부
}

export const BRANCHES: Branch[] = raw as Branch[];

// 지도/REB 키와 동일 정규화: 시도|시군구(공백제거)
function normKey(sido: string, sigungu: string): string {
  return `${sido}|${sigungu.replace(/\s+/g, "")}`;
}

// 지회 검색 인덱스 (시군구 키 → 지회들)
const INDEX = new Map<string, Branch[]>();
for (const b of BRANCHES) {
  if (!b.sido || !b.sigungu) continue;
  const k = normKey(b.sido, b.sigungu);
  const arr = INDEX.get(k) ?? [];
  arr.push(b);
  INDEX.set(k, arr);
}

// REB 지도 키(`시도|시군구명`, 일반구는 시명+구명 결합)로 담당 지회 조회
export function branchesByRegionKey(regionKey: string): Branch[] {
  // regionKey 예: "경기|성남시분당구", "부산|중구"
  const direct = INDEX.get(regionKey);
  if (direct) return direct;
  // 일반구 결합형이 시군구와 매칭 안되면 시(市) 단위로도 시도
  const [sido, name] = regionKey.split("|");
  // "성남시분당구" → 시 단위 "성남시" 매칭 fallback
  const m = name.match(/^(.+?시)/);
  if (m) {
    const cityKey = normKey(sido, m[1]);
    if (INDEX.get(cityKey)) return INDEX.get(cityKey)!;
  }
  return [];
}

export function branchesBySigungu(sido: string, sigungu: string): Branch[] {
  return branchesByRegionKey(normKey(sido, sigungu));
}

// 시도/시군구 셀렉터용 목록
export const SIDO_LIST = Array.from(
  new Set(BRANCHES.filter((b) => b.sido).map((b) => b.sido)),
);

export function sigunguListOf(sido: string): string[] {
  return Array.from(
    new Set(
      BRANCHES.filter((b) => b.sido === sido && b.sigungu).map((b) => b.sigungu),
    ),
  ).sort();
}

// 시도회별 그룹 (디렉터리 페이지용)
export interface SidohoeGroup {
  sidohoe: string;
  branches: Branch[];
}
export function groupBySidohoe(): SidohoeGroup[] {
  const order: string[] = [];
  const map = new Map<string, Branch[]>();
  for (const b of BRANCHES) {
    if (!map.has(b.sidohoe)) {
      map.set(b.sidohoe, []);
      order.push(b.sidohoe);
    }
    map.get(b.sidohoe)!.push(b);
  }
  return order.map((s) => ({ sidohoe: s, branches: map.get(s)! }));
}

export const BRANCH_COUNT = BRANCHES.length;
export const SIDOHOE_COUNT = new Set(BRANCHES.map((b) => b.sidohoe)).size;
