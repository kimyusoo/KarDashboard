import { NextRequest, NextResponse } from "next/server";
import { getRegionBlock } from "@/lib/reb";

export const revalidate = 21600;

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region");
  const date = req.nextUrl.searchParams.get("date") || undefined;
  if (!region) return NextResponse.json({ error: "region 필요" }, { status: 400 });
  try {
    return NextResponse.json(await getRegionBlock(region, date));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
