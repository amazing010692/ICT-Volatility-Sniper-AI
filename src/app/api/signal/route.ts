import { NextRequest, NextResponse } from "next/server";
import { fetchRealCandles } from "@/services/twelvedata";
import { fetchMarketDataAsync } from "@/services/market-data";
import { generateSignal } from "@/services/signal-engine";
import { analyzeSMC } from "@/services/smc-engine";
import { generateAIReasoning } from "@/services/ai-reasoning-engine";
import { analyzeMTF } from "@/services/mtf-engine";
import { analyzeTimingIntelligence } from "@/services/timing-engine";
import { analyzeMomentumAdvanced } from "@/services/momentum-engine";
import type { TradingPair, StrategySettings, MarketData } from "@/types";
import { DEFAULT_SETTINGS } from "@/config";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pair: TradingPair = body.pair || "XAUUSD";
    const settings: StrategySettings = body.settings || DEFAULT_SETTINGS;

    let marketData: MarketData;

    // Use REAL data for XAUUSD
    const tdSymbol = TWELVEDATA_SYMBOLS[pair];

    if (tdSymbol && process.env.TWELVEDATA_API_KEY) {
      try {
        const candles = await fetchRealCandles(tdSymbol, "1min", 200);

        if (candles.length > 0) {
          marketData = {
            pair,
            timeframe: "1m",
            candles,
            currentPrice: candles[candles.length - 1].close,
            spread: SPREADS[pair],
            lastUpdated: Date.now(),
          };
        } else {
          throw new Error("No real candles");
        }
      } catch (realDataError) {
        console.error("Real data failed, falling back:", realDataError);
        marketData = await fetchMarketDataAsync(pair, settings.timeframe);
      }
    } else {
      // Simulated data for other pairs
      marketData = await fetchMarketDataAsync(pair, settings.timeframe);
    }

    const candles = marketData.candles;

    // Run signal engine on REAL candles
    const { signal, checklist } = generateSignal(candles, pair, settings);

    // Run SMC analysis on REAL candles
    const smc = analyzeSMC(candles);

    // Run MTF analysis on REAL candles
    const mtf = analyzeMTF(candles);

    // Run timing intelligence on REAL candles
    const timing = analyzeTimingIntelligence(candles, signal);

    // Run ADVANCED momentum analysis on REAL candles
    const momentum = analyzeMomentumAdvanced(candles);

    // Generate AI reasoning
    const aiReasoning = generateAIReasoning(signal, smc, marketData);

    return NextResponse.json({
      signal,
      checklist,
      smc,
      mtf,
      timing,
      momentum,
      aiReasoning,
      dataSource: tdSymbol ? "real" : "simulated",
    });
  } catch (error) {
    console.error("Signal generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate signal" },
      { status: 500 }
    );
  }
}
