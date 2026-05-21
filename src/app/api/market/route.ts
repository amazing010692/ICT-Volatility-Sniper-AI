import { NextRequest, NextResponse } from "next/server";
import { fetchRealCandles, fetchRealQuote } from "@/services/twelvedata";
import { fetchMarketDataAsync } from "@/services/market-data";
import type { TradingPair, Timeframe, MarketData } from "@/types";

// XAUUSD uses REAL data from TwelveData
// Other pairs fall back to simulated data

const TWELVEDATA_SYMBOLS: Partial<Record<TradingPair, string>> = {
  XAUUSD: "XAU/USD",
};

const SPREADS: Record<TradingPair, number> = {
  XAUUSD: 0.30,
  EURUSD: 0.00008,
  GBPUSD: 0.00012,
  USDJPY: 0.012,
  GBPJPY: 0.025,
  NAS100: 1.5,
  US30: 2.5,
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

  try {
    // Use REAL data for XAUUSD
    const tdSymbol = TWELVEDATA_SYMBOLS[pair];

    if (tdSymbol && process.env.TWELVEDATA_API_KEY) {
      const interval = INTERVAL_MAP[timeframe] || "1min";
      const candles = await fetchRealCandles(tdSymbol, interval, 200);

      if (candles.length === 0) {
        throw new Error("No candles returned");
      }

      const currentPrice = candles[candles.length - 1].close;

      const marketData: MarketData = {
        pair,
        timeframe,
        candles,
        currentPrice,
        spread: SPREADS[pair],
        lastUpdated: Date.now(),
      };

      return NextResponse.json(marketData);
    }

    // Fallback: simulated data for other pairs
    const marketData = await fetchMarketDataAsync(pair, timeframe);
    return NextResponse.json(marketData);
  } catch (error) {
    console.error(`Market data error for ${pair}:`, error);

    // Fallback to simulated if real data fails
    try {
      const marketData = await fetchMarketDataAsync(pair, timeframe);
      return NextResponse.json(marketData);
    } catch (fallbackError) {
      return NextResponse.json(
        { error: "Failed to fetch market data" },
        { status: 500 }
      );
    }
  }
}
