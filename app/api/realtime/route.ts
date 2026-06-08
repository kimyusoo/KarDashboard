import { NextRequest, NextResponse } from "next/server";
import { getAptRanking, getVolumeStat, type TradeType } from "@/lib/molit";

export const revalidate = 43200; // 12h

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind") || "ranking";
  const type = (sp.get("type") || "sale") as TradeType;
  const code = sp.get("code") || "11680";
  try {
    if (kind === "volume") {
      return NextResponse.json(await getVolumeStat(type, code));
    }
    return NextResponse.json(await getAptRanking(type, code, 10));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
