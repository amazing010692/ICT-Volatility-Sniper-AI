import { NextRequest, NextResponse } from "next/server";
import { fetchRealCandles } from "@/services/twelvedata";
import { fetchMarketDataAsync } from "@/services/market-data";
import type { TradingPair, Timeframe } from "@/types";

const TWELVEDATA_SYMBOLS: Partial<Record<TradingPair, string>> = {
  XAUUSD: "XAU/USD",
};

const INTERVAL_MAP: Record<Timeframe, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pair = (searchParams.get("pair") || "XAUUSD") as TradingPair;
  const timeframe = (searchParams.get("timeframe") || "1m") as Timeframe;
  const count = parseInt(searchParams.get("count") || "200", 10);

  try {
    const tdSymbol = TWELVEDATA_SYMBOLS[pair];

    if (tdSymbol && process.env.TWELVEDATA_API_KEY) {
      const interval = INTERVAL_MAP[timeframe] || "1min";
      const candles = await fetchRealCandles(tdSymbol, interval, Math.min(count, 500));
      return NextResponse.json({ candles, pair, timeframe, source: "real" });
    }

    // Fallback for other pairs
    const data = await fetchMarketDataAsync(pair, timeframe, Math.min(count, 500));
    return NextResponse.json({ candles: data.candles, pair, timeframe, source: "simulated" });
  } catch (error) {
    console.error(`Candles error for ${pair}:`, error);

    try {
      const data = await fetchMarketDataAsync(pair, timeframe, Math.min(count, 500));
      return NextResponse.json({ candles: data.candles, pair, timeframe, source: "simulated" });
    } catch {
      return NextResponse.json(
        { error: "Failed to generate candles" },
        { status: 500 }
      );
    }
  }
}
