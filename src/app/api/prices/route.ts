import { NextRequest, NextResponse } from "next/server";
import { fetchMarketDataAsync } from "@/services/market-data";
import type { TradingPair } from "@/types";

const ALL_PAIRS: TradingPair[] = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "NAS100", "US30"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pairParam = searchParams.get("pair");

  try {
    if (pairParam) {
      const pair = pairParam as TradingPair;
      const data = await fetchMarketDataAsync(pair, "1m", 10);
      return NextResponse.json({
        pair,
        price: data.currentPrice,
        spread: data.spread,
        lastUpdated: data.lastUpdated,
      });
    }

    // Return all pairs
    const prices = await Promise.all(
      ALL_PAIRS.map(async (pair) => {
        const data = await fetchMarketDataAsync(pair, "1m", 10);
        return {
          pair,
          price: data.currentPrice,
          spread: data.spread,
          lastUpdated: data.lastUpdated,
        };
      })
    );

    return NextResponse.json({ prices });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
