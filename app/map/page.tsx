import { getDashboardData } from "@/lib/reb";
import WeatherMap from "@/components/WeatherMap";

export const revalidate = 21600;
export const metadata = { title: "통계기상도 | KAR 부동산 인사이트" };

export default async function MapPage({
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
          <h1>🗺️ 통계기상도</h1>
          <div className="sub">
            전국 시군구 아파트 가격 변동률을 날씨처럼 한눈에 · 한국부동산원 (KB 통계기상도 형식)
          </div>
        </div>
      </div>
      <WeatherMap data={data} />
      <div className="footer">
        ☀️ 맑음(상승) · ⛅ 흐림(보합) · ☁️/🌧️ 비(하락). 색이 진할수록 변동폭이 큽니다.
        시군구 단위는 한국부동산원 공표 지역 기준이며, 미조사 지역은 회색으로 표시됩니다.
        주간/월간·매매/전세를 전환해 비교할 수 있습니다.
      </div>
    </main>
  );
}
