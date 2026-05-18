import { NextRequest, NextResponse } from "next/server";
import { fetchMarketDataAsync } from "@/services/market-data";
import type { TradingPair, Timeframe } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pair = (searchParams.get("pair") || "XAUUSD") as TradingPair;
  const timeframe = (searchParams.get("timeframe") || "1m") as Timeframe;

  try {
    const marketData = await fetchMarketDataAsync(pair, timeframe);
    return NextResponse.json(marketData);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
