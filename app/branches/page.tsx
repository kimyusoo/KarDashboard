import BranchDirectory from "@/components/BranchDirectory";

export const metadata = {
  title: "협회 지회 안내 | KAR 부동산 인사이트",
  description:
    "한국공인중개사협회 전국 시도회·지회 주소 및 연락처 (kar.or.kr 기준)",
};

export default function BranchesPage() {
  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>🏛️ 전국 지회 안내</h1>
          <div className="sub">
            한국공인중개사협회 시도회·지회 주소 및 연락처 · 출처 kar.or.kr
          </div>
        </div>
        <div className="badge">시군구 지도와 연동</div>
      </div>

      <div className="summary-box" style={{ marginBottom: 20 }}>
        주간동향 지도에서 <strong>시군구를 클릭</strong>하면 해당 지역의 시세 변동률과
        함께 <strong>담당 지회</strong>가 표시됩니다. 아래에서는 전국 지회를 검색·열람할
        수 있어, 회원이 인접 지회 정보를 빠르게 안내할 수 있습니다.
      </div>

      <BranchDirectory />

      <div className="footer">
        ※ 지회 주소·연락처는 한국공인중개사협회 공식 홈페이지(kar.or.kr/pabout/branch.asp)를
        기준으로 수집했습니다. 변경될 수 있으므로 정기 갱신이 필요합니다.
      </div>
    </main>
  );
}
