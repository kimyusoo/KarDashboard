"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 기준일 선택기: 선택 날짜 이하의 최신 주차 데이터를 조회
export default function DateSelector({
  resolvedDate, // 실제 적용된 기준일 (YYYY-MM-DD 또는 YYYY-MM)
  selected, // 사용자가 선택한 날짜 (있으면)
  basePath = "/", // 날짜 적용 시 이동할 경로
  cycleLabel = "주간", // 주간/월간 표기
}: {
  resolvedDate: string;
  selected?: string;
  basePath?: string;
  cycleLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const value = selected || resolvedDate || today;

  function apply(date: string) {
    if (!date) return;
    router.push(`${basePath}?date=${date}`);
    router.refresh();
  }

  return (
    <div className="date-selector">
      <button className="badge date-badge" onClick={() => setOpen((v) => !v)}>
        📅 기준일 {resolvedDate || "—"} ({cycleLabel}) ▾
      </button>
      {open && (
        <div className="date-pop">
          <div className="date-pop-label">조회 기준일 선택</div>
          <input
            type="date"
            defaultValue={value}
            max={today}
            min="2012-05-01"
            className="date-input"
            onChange={(e) => apply(e.target.value)}
          />
          <div className="date-pop-hint">
            선택한 날짜 이하의 가장 최근 주간 통계가 표시됩니다.
          </div>
          {selected && (
            <button
              className="date-reset"
              onClick={() => {
                router.push(basePath);
                router.refresh();
              }}
            >
              최신으로 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
