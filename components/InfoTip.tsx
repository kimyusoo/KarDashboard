"use client";

import { useState } from "react";

// ⓘ 설명 툴팁 (지수 등 용어 설명)
export default function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="infotip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="infotip-btn" onClick={() => setOpen((v) => !v)} aria-label="설명">ⓘ</button>
      {open && <span className="infotip-pop">{text}</span>}
    </span>
  );
}
