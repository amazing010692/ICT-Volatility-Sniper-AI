import { NextRequest, NextResponse } from "next/server";
import { fetchRealQuote } from "@/services/twelvedata";
import { fetchMarketDataAsync } from "@/services/market-data";
import type { TradingPair } from "@/types";

const ALL_PAIRS: TradingPair[] = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "NAS100", "US30"];

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pairParam = searchParams.get("pair");

  try {
    if (pairParam) {
      const pair = pairParam as TradingPair;
      const tdSymbol = TWELVEDATA_SYMBOLS[pair];

      if (tdSymbol && process.env.TWELVEDATA_API_KEY) {
        try {
          const quote = await fetchRealQuote(tdSymbol);
          return NextResponse.json({
            pair,
            price: quote.price,
            spread: SPREADS[pair],
            lastUpdated: Date.now(),
            source: "real",
          });
        } catch {
          // Fall through to simulated
        }
      }

      const data = await fetchMarketDataAsync(pair, "1m", 10);
      return NextResponse.json({
        pair,
        price: data.currentPrice,
        spread: data.spread,
        lastUpdated: data.lastUpdated,
        source: "simulated",
      });
    }

    // Return all pairs
    const prices = await Promise.all(
      ALL_PAIRS.map(async (pair) => {
        const tdSymbol = TWELVEDATA_SYMBOLS[pair];

        if (tdSymbol && process.env.TWELVEDATA_API_KEY) {
          try {
            const quote = await fetchRealQuote(tdSymbol);
            return {
              pair,
              price: quote.price,
              spread: SPREADS[pair],
              lastUpdated: Date.now(),
              source: "real" as const,
            };
          } catch {
            // Fall through
          }
        }

        const data = await fetchMarketDataAsync(pair, "1m", 10);
        return {
          pair,
          price: data.currentPrice,
          spread: data.spread,
          lastUpdated: data.lastUpdated,
          source: "simulated" as const,
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
