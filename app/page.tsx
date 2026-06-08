import { getDashboardData } from "@/lib/reb";
import Dashboard from "@/components/Dashboard";
import RealtimeSection from "@/components/RealtimeSection";

export const revalidate = 21600;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const data = await getDashboardData(date);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>📊 동향 · 핵심지표</h1>
          <div className="sub">
            한국공인중개사협회 회원용 부동산 시장 동향 · 한국부동산원 · 공공데이터
          </div>
        </div>
      </div>

      <Dashboard data={data} selectedDate={date} />

      <RealtimeSection />

      <div className="footer">
        데이터 출처: 한국부동산원 R-ONE 부동산통계 OpenAPI(주간/월간 아파트 가격동향),
        국토교통부 실거래가 공개시스템(공공데이터포털). 전국 시군구 변동률 지도는 상단{" "}
        <b>“통계기상도”</b> 메뉴에서 확인할 수 있습니다.
      </div>
    </main>
  );
}
