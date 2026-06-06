import { NextRequest, NextResponse } from "next/server";

// 회원 전용 접근 보호 (간이 인증)
// 공용 경로를 제외한 모든 페이지는 쿠키(kar_auth) 검증 후 접근 허용.

const AUTH_COOKIE = "kar_auth";

function expectedToken(): string {
  return process.env.SITE_AUTH_TOKEN || "kar-default-token";
}

// 인증 없이 접근 가능한 경로
const PUBLIC_PREFIXES = [
  "/login",
  "/api/login",
  "/api/logout",
  "/_next",
  "/favicon",
  "/sgg.geojson",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token === expectedToken()) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // 정적 자산 제외 전체 경로 적용
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.geojson).*)"],
};
