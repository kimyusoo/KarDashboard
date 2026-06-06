import {
  getMarketSnapshot,
  getMonthlySnapshot,
  type RegionPoint,
} from "@/lib/reb";
import { getSampleTrades, getAptComplexRanking } from "@/lib/molit";
import { rebKeyFromFullName } from "@/lib/regions";
import TrendChart from "@/components/TrendChart";
import ChangeBarChart from "@/components/ChangeBarChart";
import MapSection from "@/components/MapSection";

export const revalidate = 21600; // 6시간

function deltaClass(v: number) {
  return v > 0 ? "up" : v < 0 ? "down" : "flat";
}
function sign(v: number) {
  return v > 0 ? `▲ ${v.toFixed(2)}%` : v < 0 ? `▼ ${Math.abs(v).toFixed(2)}%` : `― 보합`;
}
function trimRegion(full: string) {
  // "경기>경부1권>과천시" → "경기 과천시"
  const parts = full.split(">");
  if (parts.length <= 1) return full;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function SummaryCard({ title, p }: { title: string; p: RegionPoint }) {
  return (
    <div className="card">
      <div className="label">{title}</div>
      <div className="value">{p.index.toFixed(2)}</div>
      <div className={`delta ${deltaClass(p.changePct)}`}>{sign(p.changePct)}</div>
    </div>
  );
}

function RankTable({
  rows,
  title,
}: {
  rows: RegionPoint[];
  title: string;
}) {
  return (
    <div className="card">
      <div className="label" style={{ marginBottom: 12 }}>
        {title}
      </div>
      <table>
        <thead>
          <tr>
            <th className="rank">#</th>
            <th>지역</th>
            <th className="num">지수</th>
            <th className="num">전주대비</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.region + i}>
              <td className="rank">{i + 1}</td>
              <td>{trimRegion(r.fullName)}</td>
              <td className="num">{r.index.toFixed(2)}</td>
              <td className={`num ${deltaClass(r.changePct)}`}>
                {sign(r.changePct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildMapValues(points: RegionPoint[]) {
  const out: Record<string, { name: string; changePct: number }> = {};
  for (const p of points) {
    const key = rebKeyFromFullName(p.fullName);
    if (!key) continue;
    out[key] = { name: trimRegion(p.fullName), changePct: p.changePct };
  }
  return out;
}

export default async function Home() {
  const snap = await getMarketSnapshot();

  const [monthlyRes, tradesRes, aptRankRes] = await Promise.allSettled([
    getMonthlySnapshot(),
    getSampleTrades(),
    getAptComplexRanking(10),
  ]);
  const monthly =
    monthlyRes.status === "fulfilled" ? monthlyRes.value : null;
  const trades = tradesRes.status === "fulfilled" ? tradesRes.value : [];
  const aptRank =
    aptRankRes.status === "fulfilled" ? aptRankRes.value : null;

  const saleMapValues = buildMapValues(snap.sigunguSaleAll);
  const jeonseMapValues = buildMapValues(snap.sigunguJeonseAll);

  const { 매매: saleNat, 전세: jeonseNat } = snap.nationwide;
  const sidoSaleTop = snap.sidoSale[0];
  const sidoJeonseTop = snap.sidoJeonse[0];

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>🏠 KAR 부동산 인사이트</h1>
          <div className="sub">
            한국공인중개사협회 회원용 주간 시장 동향 · 한국부동산원 · 공공데이터
          </div>
        </div>
        <div className="badge">기준일 {snap.latestWeek || "—"} (주간)</div>
      </div>

      {/* 1. 동향 요약 */}
      <div className="section-title">
        <span className="num">1</span> 이번 주 시장 동향 요약
      </div>
      <div className="summary-box">
        2026년 {snap.latestWeek} 기준 전국 주간 아파트{" "}
        <strong className={deltaClass(saleNat.changePct)}>
          매매가격 {sign(saleNat.changePct)}
        </strong>
        ,{" "}
        <strong className={deltaClass(jeonseNat.changePct)}>
          전세가격 {sign(jeonseNat.changePct)}
        </strong>{" "}
        를 기록했습니다. 시도 중 매매 상승률 1위는{" "}
        <strong>{sidoSaleTop?.region}</strong> ({sign(sidoSaleTop?.changePct ?? 0)}),
        전세 상승률 1위는 <strong>{sidoJeonseTop?.region}</strong> (
        {sign(sidoJeonseTop?.changePct ?? 0)})입니다. 시군구 단위 최고 상승은{" "}
        <strong>{trimRegion(snap.sigunguSaleTop[0]?.fullName ?? "")}</strong>{" "}
        (매매 {sign(snap.sigunguSaleTop[0]?.changePct ?? 0)})로 나타났습니다.
      </div>

      {/* 2. 가격지수 */}
      <div className="section-title">
        <span className="num">2</span> 가격지수 (전국)
      </div>
      <div className="grid grid-4">
        <SummaryCard title="매매가격지수" p={saleNat} />
        <SummaryCard title="전세가격지수" p={jeonseNat} />
        <div className="card">
          <div className="label">매매 상승률 1위 시도</div>
          <div className="value">{sidoSaleTop?.region ?? "—"}</div>
          <div className={`delta ${deltaClass(sidoSaleTop?.changePct ?? 0)}`}>
            {sign(sidoSaleTop?.changePct ?? 0)}
          </div>
        </div>
        <div className="card">
          <div className="label">전세 상승률 1위 시도</div>
          <div className="value">{sidoJeonseTop?.region ?? "—"}</div>
          <div className={`delta ${deltaClass(sidoJeonseTop?.changePct ?? 0)}`}>
            {sign(sidoJeonseTop?.changePct ?? 0)}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <div className="label" style={{ marginBottom: 8 }}>
          전국 매매·전세 가격지수 추이 (최근 주간)
        </div>
        <TrendChart data={snap.trend} />
      </div>

      {/* 3. 시도별 변동률 */}
      <div className="section-title">
        <span className="num">3</span> 시도별 가격 변동률 (전주대비)
      </div>
      <div className="grid grid-2">
        <div className="card">
          <div className="label" style={{ marginBottom: 8 }}>
            매매가격지수 변동률
          </div>
          <ChangeBarChart data={snap.sidoSale} />
        </div>
        <div className="card">
          <div className="label" style={{ marginBottom: 8 }}>
            전세가격지수 변동률
          </div>
          <ChangeBarChart data={snap.sidoJeonse} />
        </div>
      </div>

      {/* 4. 시군구 상승률 랭킹 */}
      <div className="section-title">
        <span className="num">4</span> 시군구 상승률 TOP 10
      </div>
      <div className="grid grid-2">
        <RankTable rows={snap.sigunguSaleTop} title="매매 상승률 TOP 10 (시군구)" />
        <RankTable rows={snap.sigunguJeonseTop} title="전세 상승률 TOP 10 (시군구)" />
      </div>

      {/* 5. 전국 시군구 코로플레스 지도 */}
      <div className="section-title">
        <span className="num">5</span> 전국 시군구 변동률 지도
      </div>
      <MapSection sale={saleMapValues} jeonse={jeonseMapValues} />

      {/* 6. 월세 동향 (월간) */}
      <div className="section-title">
        <span className="num">6</span> 월세 동향{" "}
        <span className="pill">월간 · {monthly?.latestMonth ?? "—"}</span>
      </div>
      {monthly ? (
        <>
          <div className="grid grid-3">
            <SummaryCard title="매매가격지수 (월간)" p={monthly.nationwide.매매} />
            <SummaryCard title="전세가격지수 (월간)" p={monthly.nationwide.전세} />
            <SummaryCard title="월세가격지수 (월간)" p={monthly.nationwide.월세} />
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <div className="label" style={{ marginBottom: 8 }}>
              월세가격지수 시도별 변동률 (전월대비)
            </div>
            <ChangeBarChart data={monthly.sidoByType.월세} />
          </div>
        </>
      ) : (
        <div className="card">
          <div className="label">월간 데이터를 불러오지 못했습니다.</div>
        </div>
      )}

      {/* 7. 단지별 상승률 (실거래 기반) */}
      <div className="section-title">
        <span className="num">7</span> 단지별 평균 거래가 상승률 TOP{" "}
        <span className="pill">실거래 · 샘플 지역 · 전월대비</span>
      </div>
      <div className="card">
        {aptRank && aptRank.risers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>단지</th>
                <th>지역</th>
                <th className="num">전월 평균</th>
                <th className="num">당월 평균</th>
                <th className="num">상승률</th>
              </tr>
            </thead>
            <tbody>
              {aptRank.risers.map((a, i) => (
                <tr key={a.region + a.apt + i}>
                  <td className="rank">{i + 1}</td>
                  <td>{a.apt}</td>
                  <td>
                    {a.region} {a.umd}
                  </td>
                  <td className="num">{(a.prevAvg / 10000).toFixed(2)}억</td>
                  <td className="num">{(a.curAvg / 10000).toFixed(2)}억</td>
                  <td className={`num ${deltaClass(a.changePct)}`}>
                    {a.changePct > 0 ? "▲" : a.changePct < 0 ? "▼" : "―"}{" "}
                    {Math.abs(a.changePct).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="label">단지별 데이터를 불러오지 못했습니다.</div>
        )}
        <div className="label" style={{ marginTop: 12, fontSize: 12 }}>
          ※ 국토부 실거래가 기준, 동일 단지의 전월·당월 평균 거래가 비교(면적 혼합).
          신축 입주·대형평형 거래 등으로 변동성이 클 수 있어 참고용이며, 전국 단지로
          확장 및 면적 보정 예정입니다.
        </div>
      </div>

      {/* 8. 거래량 (공공데이터 실거래) */}
      <div className="section-title">
        <span className="num">8</span> 아파트 매매 거래량·평균가{" "}
        <span className="pill">샘플 6개 지역 · MVP</span>
      </div>
      <div className="card">
        {trades.length === 0 ? (
          <div className="label">거래 데이터를 불러오지 못했습니다.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>지역</th>
                <th>기준월</th>
                <th className="num">거래건수</th>
                <th className="num">평균 거래가</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.code}>
                  <td>{t.name}</td>
                  <td>
                    {t.yyyymm.slice(0, 4)}.{t.yyyymm.slice(4)}
                  </td>
                  <td className="num">{t.count.toLocaleString()}건</td>
                  <td className="num">
                    {t.avgAmountManwon > 0
                      ? `${(t.avgAmountManwon / 10000).toFixed(2)}억`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="label" style={{ marginTop: 12, fontSize: 12 }}>
          ※ 국토교통부 실거래가 공개시스템(공공데이터포털) 기준. 신고지연 반영을
          위해 직전월 데이터를 표시하며, 전국 250개 시군구로 확장 예정입니다.
        </div>
      </div>

      <div className="footer">
        데이터 출처: 한국부동산원 R-ONE 부동산통계 OpenAPI(주간 아파트 가격동향),
        국토교통부 실거래가 공개시스템(공공데이터포털). 본 대시보드는 한국공인중개사협회
        회원 서비스 제안용 MVP입니다.
        <br />
        향후 추가 예정: 월세 지수·거래량, 단지별 상승률 1위, 시군구 드릴다운 지도,
        서울사이버대 AI부동산빅데이터학과 심화분석(인구·직장·상권·공시가), 지회 정보 연계.
      </div>
    </main>
  );
}
