import { NextRequest, NextResponse } from "next/server";
import { fetchMarketDataAsync } from "@/services/market-data";
import { generateSignal } from "@/services/signal-engine";
import { analyzeSMC } from "@/services/smc-engine";
import { generateAIReasoning } from "@/services/ai-reasoning-engine";
import { analyzeMTF } from "@/services/mtf-engine";
import { analyzeTimingIntelligence } from "@/services/timing-engine";
import { analyzeMomentumAdvanced } from "@/services/momentum-engine";
import type { TradingPair, StrategySettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pair: TradingPair = body.pair || "XAUUSD";
    const settings: StrategySettings = body.settings || DEFAULT_SETTINGS;

    // Get market data with REAL live price
    const marketData = await fetchMarketDataAsync(pair, settings.timeframe);
    const candles = marketData.candles;

    // Run signal engine
    const { signal, checklist } = generateSignal(candles, pair, settings);

    // Run SMC analysis
    const smc = analyzeSMC(candles);

    // Run MTF analysis
    const mtf = analyzeMTF(candles);

    // Run timing intelligence
    const timing = analyzeTimingIntelligence(candles, signal);

    // Run ADVANCED momentum analysis
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate signal" },
      { status: 500 }
    );
  }
}
