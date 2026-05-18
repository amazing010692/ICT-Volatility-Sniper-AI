import { NextRequest, NextResponse } from "next/server";
import { fetchMarketDataAsync } from "@/services/market-data";
import type { TradingPair, Timeframe } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pair = (searchParams.get("pair") || "XAUUSD") as TradingPair;
  const timeframe = (searchParams.get("timeframe") || "1m") as Timeframe;
  const count = parseInt(searchParams.get("count") || "200", 10);

  try {
    const data = await fetchMarketDataAsync(pair, timeframe, Math.min(count, 500));
    return NextResponse.json({ candles: data.candles, pair, timeframe });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate candles" },
      { status: 500 }
    );
  }
}
