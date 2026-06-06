"use client";

export default function PrintButton({ label = "🖨️ PDF로 저장 / 인쇄" }: { label?: string }) {
  return (
    <button className="print-btn no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
