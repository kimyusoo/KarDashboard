// REB 지역명 ↔ 시군구 GeoJSON 매칭 유틸리티
// GeoJSON(public/sgg.geojson) properties: { name, code } — code 앞 2자리 = 시도

export const SIDO_PREFIX: Record<string, string> = {
  "11": "서울", "21": "부산", "22": "대구", "23": "인천", "24": "광주",
  "25": "대전", "26": "울산", "29": "세종", "31": "경기", "32": "강원",
  "33": "충북", "34": "충남", "35": "전북", "36": "전남", "37": "경북",
  "38": "경남", "39": "제주",
};

// 행정구역 변경/명칭 차이 보정 (REB 키 → GeoJSON 키)
const ALIAS: Record<string, string> = {
  "인천|미추홀구": "인천|남구", // 2018 남구→미추홀구 개명
};

export function geoKey(sido: string, name: string): string {
  return `${sido}|${name}`;
}

export function geoKeyFromFeature(props: { name: string; code: string }): string {
  const sido = SIDO_PREFIX[props.code.slice(0, 2)] ?? "";
  return geoKey(sido, props.name);
}

// REB CLS_FULLNM(예: "경기>경부1권>안양시>만안구") → GeoJSON 매칭 키
// 실제 시군구(leaf가 시/군/구)만 대상으로 하고, 권역 집계는 제외(null 반환)
export function rebKeyFromFullName(fullName: string): string | null {
  const parts = fullName.split(">");
  if (parts.length < 2) return null; // 전국/시도/권역 최상위 제외
  const sido = parts[0];
  const leaf = parts[parts.length - 1];
  const parent = parts[parts.length - 2];
  // 실제 시군구만: leaf가 시/군/구로 끝나야 함 (권역: ~권/~지역 제외)
  if (!/[시군구]$/.test(leaf)) return null;
  // 일반구(일반시 산하 구)는 "시명+구명" 결합 (예: 안양시만안구)
  const name = leaf.endsWith("구") && parent.endsWith("시") ? parent + leaf : leaf;
  const key = geoKey(sido, name);
  return ALIAS[key] ?? key;
}
