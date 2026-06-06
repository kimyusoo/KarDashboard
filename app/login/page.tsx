"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace(from);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.message || "로그인에 실패했습니다.");
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">🏠 KAR 부동산 인사이트</div>
        <div className="login-sub">한국공인중개사협회 회원 전용 서비스</div>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="회원 접속 비밀번호"
          className="search-input"
          style={{ width: "100%", marginTop: 18 }}
          autoFocus
        />
        {err && <div className="login-err">{err}</div>}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "확인 중…" : "로그인"}
        </button>
        <div className="login-hint">
          접속 비밀번호는 협회를 통해 안내됩니다.
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-wrap" />}>
      <LoginForm />
    </Suspense>
  );
}
