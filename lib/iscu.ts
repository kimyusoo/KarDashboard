// 서울사이버대 AI부동산빅데이터학과(ISCU) 심화분석 시스템 연동 설정/어댑터
//
// 연동 모드(3가지)를 시스템별로 선택할 수 있도록 config 기반으로 설계.
//  - "pending" : 협의 전. 예시(샘플) 데이터로 화면 구성만 시연
//  - "embed"   : ISCU가 제공하는 페이지를 iframe 임베드
//  - "api"     : ISCU가 제공하는 API/CSV를 fetch (adapter 구현부 연결)
//  - "link"    : 외부 링크로 연결(새 창)
//
// 협의 완료 시 해당 시스템의 mode와 endpoint/embedUrl만 바꾸면 됩니다.

export type IntegrationMode = "pending" | "embed" | "api" | "link";

export interface IscuMetric {
  key: string;
  label: string;
  /** 예시 값(연동 전 시연용). 연동 후 adapter가 실데이터로 대체 */
  sample: string;
  hint?: string;
  trend?: "up" | "down" | "flat";
}

export interface IscuSystem {
  id: string;
  reqNo: number; // 제안서 항목 번호(7~11)
  title: string;
  icon: string;
  sourceUrl: string;
  /** 연동 모드 — 협의 결과에 따라 변경 */
  mode: IntegrationMode;
  embedUrl?: string; // mode=embed 일 때
  apiEndpoint?: string; // mode=api 일 때
  summary: string;
  /** 공인중개사 상담 활용 포인트 */
  useCases: string[];
  /** 이 시스템에서 대시보드로 가져올 핵심 결과물(지표) */
  metrics: IscuMetric[];
}

// 기본 분석 대상 지역(시연용) — 추후 사용자가 선택한 시군구/동으로 파라미터화
export const DEFAULT_REGION = "서울 강남구";

export const ISCU_SYSTEMS: IscuSystem[] = [
  {
    id: "realprice",
    reqNo: 10,
    title: "실거래 분석 시스템",
    icon: "🏢",
    sourceUrl: "https://iscubigdata.co.kr/realprice/",
    mode: "pending",
    summary:
      "단지별 실거래가 추이와 이상거래(급등·급락)를 탐지하고, 동일 생활권 유사단지와 비교해 적정가 밴드를 제시합니다.",
    useCases: [
      "“이 매물 시세가 적정한가요?” 질문에 적정가 밴드(상·하한) 근거 제시",
      "급등·급락(이상거래) 신호로 협상 타이밍 조언",
      "유사단지 비교로 매물 경쟁력 설명",
      "전용면적·층·향별 실거래 편차를 반영한 호가 적정성 점검",
      "최근 6개월 거래량 추세로 매수·매도 우위 시장 판단",
      "직전 신고가 대비 현재 호가 괴리율을 수치로 안내",
      "동일 단지 내 평형별 가격 서열로 갈아타기 전략 제안",
      "거래 절벽/회복 구간을 포착해 매물 출시 타이밍 코칭",
      "재건축·리모델링 기대가 반영된 단지 프리미엄 분리 설명",
      "급매물 여부를 시세 대비 할인율로 객관 판단",
      "전세가율과 결합해 갭투자 리스크 동시 진단",
      "동일 생활권 신축 입주물량이 가격에 미칠 영향 설명",
      "월별 실거래 분포로 계약 시점별 협상 여력 제시",
      "고객 맞춤 ‘적정 매수가 리포트’ 자동 생성·전달",
    ],
    metrics: [
      { key: "fairBand", label: "적정가 밴드(전용 84㎡)", sample: "23.5억 ~ 26.8억", hint: "유사단지 회귀 기반" },
      { key: "anomaly", label: "이상거래 탐지", sample: "최근 30일 2건", trend: "up", hint: "직전 평균 대비 +12%↑ 급등 의심" },
      { key: "similar", label: "유사단지 비교순위", sample: "생활권 12개 단지 중 3위", trend: "up" },
      { key: "trend6m", label: "6개월 실거래 추세", sample: "+4.2%", trend: "up" },
    ],
  },
  {
    id: "population",
    reqNo: 8,
    title: "거주인구 분석 시스템",
    icon: "👥",
    sourceUrl: "https://iscubigdata.co.kr/population/",
    mode: "pending",
    summary:
      "동(洞) 단위 인구 증감·연령구조·세대수 변화와 전입/전출 순이동을 분석해 지역의 실수요 기반을 보여줍니다.",
    useCases: [
      "인구 유입 지역 vs 유출 지역 판단 → 투자/거주 상담",
      "1인가구·고령화 비중으로 평형·임대 수요 예측",
      "전입 순이동 상위 동 추천",
      "연령구조(30~40대 비중)로 학군·신혼 수요 설명",
      "세대수 증가 동을 근거로 임대 공실 위험 진단",
      "100m 격자 인구밀도로 역세권 배후수요 정량 제시",
      "고령인구 비중으로 1층 상가·의료 수요 안내",
      "청년층 유입 동의 소형·오피스텔 수요 강조",
      "인구 예측(2025~)으로 중장기 보유 전략 제안",
      "주거이동 패턴으로 매물 타깃 고객층 설정",
      "출생·세대분화 추세로 평형 갈아타기 수요 예측",
      "동별 인구 대비 주택 공급으로 수급 균형 설명",
      "외국인·1인가구 밀집도로 임대 상품 기획 지원",
      "고객 거주지 인근 ‘인구·수요 리포트’ 제공",
    ],
    metrics: [
      { key: "popChange", label: "인구 증감(전년대비)", sample: "+1.8%", trend: "up" },
      { key: "netMove", label: "전입 순이동(연)", sample: "+3,240명", trend: "up" },
      { key: "single", label: "1인가구 비중", sample: "38.7%", trend: "up" },
      { key: "age", label: "핵심수요층(30~40대) 비중", sample: "29.4%", trend: "flat" },
    ],
  },
  {
    id: "workplace",
    reqNo: 9,
    title: "직장인구·사업체 분석 시스템",
    icon: "🏬",
    sourceUrl: "https://iscubigdata.co.kr/population/workplace.html",
    mode: "pending",
    summary:
      "주간/야간인구(직주근접), 사업체 수·종사자 수 변화와 업종 구성을 분석해 배후 수요와 상업 활력을 평가합니다.",
    useCases: [
      "직주근접 지표로 오피스텔·역세권 매물의 배후 수요 설명",
      "사업체·종사자 증감으로 상업용 임대 전망 제시",
      "업종 구성으로 상권 성격 안내",
      "주간인구 유입 지역의 오피스 임대 수요 강조",
      "종사자 수 증가 업무지구 인근 주거 수요 설명",
      "사업체 신설·폐업 추세로 상가 공실 위험 진단",
      "업종별 종사자 분포로 점포 타깃 업종 추천",
      "직주비(주야간인구)로 베드타운/직장밀집 구분",
      "대기업·관공서 배후 ‘직원 주거’ 수요 안내",
      "산업 구조 변화로 중장기 상권 성장성 예측",
      "지식산업센터·오피스 공급과 수요 매칭 분석",
      "종사자 소득 수준 추정으로 상품 가격대 설정",
      "통근 패턴으로 역세권 프리미엄 근거 제시",
      "고객 사업 입지용 ‘배후수요 리포트’ 제공",
    ],
    metrics: [
      { key: "dayNight", label: "주야간인구 비(직주비)", sample: "1.74", hint: "1 초과=주간 유입(직장 밀집)", trend: "up" },
      { key: "biz", label: "사업체 수 증감", sample: "+2.1%", trend: "up" },
      { key: "worker", label: "종사자 수", sample: "약 41.2만 명", trend: "up" },
      { key: "topIndustry", label: "최다 업종", sample: "전문·과학·기술서비스" },
    ],
  },
  {
    id: "officialprice",
    reqNo: 7,
    title: "공시가격 분석 시스템",
    icon: "📑",
    sourceUrl: "https://iscubigdata.co.kr/",
    mode: "pending",
    summary:
      "공시가격 추이와 실거래가 대비 괴리율을 분석하고, 보유세·양도세 시뮬레이션의 기초 데이터를 제공합니다.",
    useCases: [
      "공시가 vs 실거래 괴리율로 저평가/고평가 판단",
      "보유세·종부세 부담 상담 근거",
      "정비구역 인접 효과 안내",
      "현실화율 추세로 향후 세부담 변화 예측",
      "1세대1주택·다주택 보유세 시뮬레이션 기초 제공",
      "공시가 급등 구간으로 매도 타이밍 조언",
      "공동주택·개별주택 공시가 비교로 유형별 안내",
      "양도세 계산용 취득·기준시가 데이터 제공",
      "재산세 과표 변화로 임대 수익률 보정",
      "공시가 9억·12억 구간 진입 여부로 규제 영향 안내",
      "지역별 공시가 상승률 비교로 투자처 우선순위 제시",
      "분리과세·종부세 합산 배제 요건 점검 지원",
      "공시가 이의신청 참고용 인근 사례 제공",
      "고객 보유자산 ‘세금 영향 리포트’ 자동 생성",
    ],
    metrics: [
      { key: "officialTrend", label: "공시가격 추이(전년대비)", sample: "+3.6%", trend: "up" },
      { key: "gap", label: "실거래 대비 현실화율", sample: "68.4%", hint: "공시가/실거래" },
      { key: "taxBase", label: "보유세 과표 변화", sample: "+2.9%", trend: "up" },
    ],
  },
  {
    id: "business",
    reqNo: 11,
    title: "상권 업종별 공간분포 분석",
    icon: "🛍️",
    sourceUrl: "https://iscubigdata.co.kr/business_analysis/",
    mode: "pending",
    summary:
      "동별 업종 밀도와 신생·폐업률, 매출 추정 등급, 유동인구를 결합해 상가·점포 입지 경쟁력을 평가합니다.",
    useCases: [
      "상가·점포 중개 시 입지 경쟁력·업종 적합도 설명",
      "신생/폐업률로 상권 라이프사이클 진단",
      "유동인구·매출등급으로 임대료 적정성 안내",
      "업종 밀도(포화도)로 신규 창업 적합 업종 추천",
      "커널밀도분석으로 상권 핵심·외곽 경계 제시",
      "워드클라우드로 부상·쇠퇴 업종 트렌드 안내",
      "분기별 업종 확산으로 권리금 적정성 판단",
      "동일 업종 경쟁 점포 수로 출점 리스크 평가",
      "매출 추정 등급으로 임차인 모집 전략 수립",
      "유동인구 시간대 분포로 업종·영업시간 제안",
      "신생/폐업 비율로 상권 성장·정체 국면 진단",
      "프랜차이즈 vs 개인 점포 비중으로 상권 성격 안내",
      "배후 주거·직장 인구와 결합한 수요 예측",
      "고객 창업·상가투자용 ‘상권 분석 리포트’ 제공",
    ],
    metrics: [
      { key: "density", label: "업종 밀도(요식업)", sample: "상위 8%", trend: "up" },
      { key: "survival", label: "3년 생존율", sample: "62.1%", trend: "flat" },
      { key: "salesGrade", label: "매출 추정 등급", sample: "A (상위 20%)" },
      { key: "floating", label: "일평균 유동인구", sample: "약 8.7만 명", trend: "up" },
    ],
  },
];

export interface IscuSystemData {
  system: IscuSystem;
  region: string;
  /** 실제 연동 시 채워질 실데이터(현재는 null → metrics.sample 사용) */
  live: Record<string, string> | null;
  /** 데이터 상태 메시지 */
  status: string;
}

// 시스템별 데이터 로드 어댑터.
// mode=api 이면 apiEndpoint 호출(협의 후 구현), 그 외에는 샘플 사용.
export async function loadIscuSystem(
  system: IscuSystem,
  region: string = DEFAULT_REGION,
): Promise<IscuSystemData> {
  if (system.mode === "api" && system.apiEndpoint) {
    try {
      const res = await fetch(`${system.apiEndpoint}?region=${encodeURIComponent(region)}`, {
        next: { revalidate: 60 * 60 * 6 },
      });
      if (res.ok) {
        const live = (await res.json()) as Record<string, string>;
        return { system, region, live, status: "실데이터 연동됨" };
      }
    } catch {
      /* fallthrough to sample */
    }
    return { system, region, live: null, status: "API 응답 없음 — 예시 데이터 표시" };
  }
  return {
    system,
    region,
    live: null,
    status:
      system.mode === "pending"
        ? "연동 협의 대기 — 아래는 예시(연동 시 실데이터로 대체)"
        : "외부 시스템 연결",
  };
}

export async function loadAllIscu(region: string = DEFAULT_REGION) {
  return Promise.all(ISCU_SYSTEMS.map((s) => loadIscuSystem(s, region)));
}
