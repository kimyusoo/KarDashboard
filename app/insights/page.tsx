import { loadAllIscu, DEFAULT_REGION } from "@/lib/iscu";
import IscuTabs from "@/components/IscuTabs";

export const revalidate = 21600;

export const metadata = {
  title: "심화분석 (ISCU) | KAR 부동산 인사이트",
  description:
    "서울사이버대 AI부동산빅데이터학과 심화분석 시스템 연동 — 실거래·인구·직장·공시가·상권",
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const data = await loadAllIscu(DEFAULT_REGION);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>🔬 심화분석 (ISCU 연동)</h1>
          <div className="sub">
            서울사이버대 AI부동산빅데이터학과 분석 시스템 · 실거래 / 인구 / 직장 /
            공시가 / 상권
          </div>
        </div>
        <div className="badge">제안서 항목 #7~11</div>
      </div>

      <div className="summary-box" style={{ marginBottom: 20 }}>
        한국부동산원·공공데이터 기반의 <strong>주간 시장 동향</strong>에 더해,
        서울사이버대 AI부동산빅데이터학과의 <strong>심화 분석 결과</strong>를
        결합하면 공인중개사가 고객에게 “가격”뿐 아니라{" "}
        <strong>“수요(인구·직장)·입지(상권)·세금(공시가)”</strong>까지 입체적으로
        설명할 수 있습니다. 아래 5개 시스템에서 상담에 바로 쓰일 핵심 지표만
        선별해 연동합니다.
        <br />
        <span style={{ color: "var(--muted)", fontSize: 12.5 }}>
          ※ 현재는 연동 협의 전 단계로 <strong>예시 값</strong>으로 화면을
          구성했습니다. 데이터 제공(API/CSV) 또는 임베드가 확정되면 각 시스템의
          mode 설정만 바꿔 실데이터로 전환됩니다.
        </span>
      </div>

      <IscuTabs data={data} selectedDate={date} />

      <div className="footer">
        연동 방식 3종 지원: ① iframe 임베드 ② API/CSV fetch ③ 외부 링크. 시스템별로
        <code> lib/iscu.ts </code>의 <code>mode</code>·<code>endpoint</code>만
        설정하면 됩니다. 분석지역은 추후 주간동향 지도의 시군구 선택과 연동 예정.
      </div>
    </main>
  );
}
