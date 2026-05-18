// ================================================
// ICT Volatility Sniper AI — Smart Money Concepts Engine
// Order Blocks, FVGs, BOS, CHoCH, Displacement
// Premium/Discount zones, Institutional bias
// ================================================

import type {
  Candle,
  SMCAnalysis,
  OrderBlock,
  FairValueGap,
  TrendDirection,
} from "@/types";

/** Run full SMC analysis on candle data */
export function analyzeSMC(candles: Candle[]): SMCAnalysis {
  if (candles.length < 20) {
    return getDefaultSMC(candles);
  }

  const orderBlocks = detectOrderBlocks(candles);
  const fairValueGaps = detectFairValueGaps(candles);
  const { breakOfStructure, changeOfCharacter, bosDirection } = detectStructureShifts(candles);
  const { displacement, displacementDirection } = detectDisplacement(candles);
  const premiumDiscount = calculatePremiumDiscount(candles);
  const institutionalBias = determineInstitutionalBias(candles, orderBlocks, fairValueGaps);
  const confluenceScore = calculateConfluence(orderBlocks, fairValueGaps, breakOfStructure, displacement);

  return {
    orderBlocks,
    fairValueGaps,
    breakOfStructure,
    changeOfCharacter,
    displacement,
    displacementDirection,
    premiumDiscount,
    institutionalBias,
    confluenceScore,
  };
}

/** Detect Order Blocks — last down candle before up move (bullish OB) or vice versa */
function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];
  const currentPrice = candles[candles.length - 1].close;

  for (let i = 2; i < candles.length - 2; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];
    const nextNext = candles[i + 2];

    // Bullish OB: bearish candle followed by strong bullish move
    if (curr.close < curr.open) {
      const moveAfter = nextNext.close - curr.low;
      const avgRange = getAverageRange(candles.slice(Math.max(0, i - 10), i));

      if (moveAfter > avgRange * 1.5) {
        const mitigated = currentPrice < curr.low;
        orderBlocks.push({
          type: "BULLISH",
          high: curr.high,
          low: curr.low,
          mitigated,
          strength: Math.min(moveAfter / avgRange / 3, 1),
          timestamp: curr.time,
        });
      }
    }

    // Bearish OB: bullish candle followed by strong bearish move
    if (curr.close > curr.open) {
      const moveAfter = curr.high - nextNext.close;
      const avgRange = getAverageRange(candles.slice(Math.max(0, i - 10), i));

      if (moveAfter > avgRange * 1.5) {
        const mitigated = currentPrice > curr.high;
        orderBlocks.push({
          type: "BEARISH",
          high: curr.high,
          low: curr.low,
          mitigated,
          strength: Math.min(moveAfter / avgRange / 3, 1),
          timestamp: curr.time,
        });
      }
    }
  }

  // Return most recent, unmitigated OBs
  return orderBlocks
    .filter((ob) => !ob.mitigated)
    .slice(-5);
}

/** Detect Fair Value Gaps (imbalances) */
function detectFairValueGaps(candles: Candle[]): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  const currentPrice = candles[candles.length - 1].close;

  for (let i = 2; i < candles.length; i++) {
    const first = candles[i - 2];
    const third = candles[i];

    // Bullish FVG: gap between first candle high and third candle low
    if (third.low > first.high) {
      const size = third.low - first.high;
      const filled = currentPrice <= first.high;
      fvgs.push({
        type: "BULLISH",
        high: third.low,
        low: first.high,
        filled,
        size,
        timestamp: candles[i - 1].time,
      });
    }

    // Bearish FVG: gap between third candle high and first candle low
    if (third.high < first.low) {
      const size = first.low - third.high;
      const filled = currentPrice >= first.low;
      fvgs.push({
        type: "BEARISH",
        high: first.low,
        low: third.high,
        filled,
        size,
        timestamp: candles[i - 1].time,
      });
    }
  }

  // Return most recent unfilled FVGs
  return fvgs
    .filter((fvg) => !fvg.filled)
    .slice(-5);
}

/** Detect Break of Structure and Change of Character */
function detectStructureShifts(candles: Candle[]): {
  breakOfStructure: boolean;
  changeOfCharacter: boolean;
  bosDirection: TrendDirection | null;
} {
  const recent = candles.slice(-20);
  const swingHighs: number[] = [];
  const swingLows: number[] = [];

  // Find swing points with lookback of 2 (M1 sensitive)
  for (let i = 2; i < recent.length - 2; i++) {
    if (recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high &&
        recent[i].high > recent[i - 2].high && recent[i].high > recent[i + 2].high) {
      swingHighs.push(recent[i].high);
    }
    if (recent[i].low < recent[i - 1].low && recent[i].low < recent[i + 1].low &&
        recent[i].low < recent[i - 2].low && recent[i].low < recent[i + 2].low) {
      swingLows.push(recent[i].low);
    }
  }

  const currentPrice = candles[candles.length - 1].close;
  const lastSwingHigh = swingHighs[swingHighs.length - 1] || recent[recent.length - 1].high;
  const lastSwingLow = swingLows[swingLows.length - 1] || recent[recent.length - 1].low;

  const breakOfStructure = currentPrice > lastSwingHigh || currentPrice < lastSwingLow;
  const bosDirection: TrendDirection | null = breakOfStructure
    ? currentPrice > lastSwingHigh ? "BULLISH" : "BEARISH"
    : null;

  // CHoCH: trend was one direction, now breaking opposite
  const prevTrend = swingHighs.length >= 2 && swingHighs[swingHighs.length - 1] > swingHighs[swingHighs.length - 2]
    ? "BULLISH"
    : swingLows.length >= 2 && swingLows[swingLows.length - 1] < swingLows[swingLows.length - 2]
      ? "BEARISH"
      : "NEUTRAL";

  const changeOfCharacter = breakOfStructure && bosDirection !== null && bosDirection !== prevTrend && prevTrend !== "NEUTRAL";

  return { breakOfStructure, changeOfCharacter, bosDirection };
}

/** Detect displacement candles (institutional aggression) */
function detectDisplacement(candles: Candle[]): {
  displacement: boolean;
  displacementDirection: TrendDirection | null;
} {
  const recent = candles.slice(-5);
  const avgRange = getAverageRange(candles.slice(-20));

  for (const candle of recent) {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    const bodyRatio = range > 0 ? body / range : 0;

    // Displacement: body > 1.3x ATR with > 60% body dominance
    if (body > avgRange * 1.3 && bodyRatio > 0.6) {
      return {
        displacement: true,
        displacementDirection: candle.close > candle.open ? "BULLISH" : "BEARISH",
      };
    }
  }

  return { displacement: false, displacementDirection: null };
}

/** Calculate Premium/Discount zone */
function calculatePremiumDiscount(candles: Candle[]): "PREMIUM" | "DISCOUNT" | "EQUILIBRIUM" {
  const recent = candles.slice(-50);
  const high = Math.max(...recent.map((c) => c.high));
  const low = Math.min(...recent.map((c) => c.low));
  const mid = (high + low) / 2;
  const currentPrice = candles[candles.length - 1].close;
  const range = high - low;

  if (range === 0) return "EQUILIBRIUM";

  const position = (currentPrice - low) / range;

  if (position > 0.618) return "PREMIUM";
  if (position < 0.382) return "DISCOUNT";
  return "EQUILIBRIUM";
}

/** Determine institutional bias from SMC elements */
function determineInstitutionalBias(
  candles: Candle[],
  orderBlocks: OrderBlock[],
  fvgs: FairValueGap[]
): TrendDirection {
  let bullishScore = 0;
  let bearishScore = 0;

  // Order block bias
  const bullishOBs = orderBlocks.filter((ob) => ob.type === "BULLISH");
  const bearishOBs = orderBlocks.filter((ob) => ob.type === "BEARISH");
  bullishScore += bullishOBs.length * 2;
  bearishScore += bearishOBs.length * 2;

  // FVG bias
  const bullishFVGs = fvgs.filter((fvg) => fvg.type === "BULLISH");
  const bearishFVGs = fvgs.filter((fvg) => fvg.type === "BEARISH");
  bullishScore += bullishFVGs.length;
  bearishScore += bearishFVGs.length;

  // Recent price action
  const recent = candles.slice(-10);
  const priceChange = recent[recent.length - 1].close - recent[0].close;
  if (priceChange > 0) bullishScore += 3;
  else bearishScore += 3;

  if (bullishScore > bearishScore + 2) return "BULLISH";
  if (bearishScore > bullishScore + 2) return "BEARISH";
  return "NEUTRAL";
}

/** Calculate confluence score from all SMC elements */
function calculateConfluence(
  orderBlocks: OrderBlock[],
  fvgs: FairValueGap[],
  bos: boolean,
  displacement: boolean
): number {
  let score = 0;
  const maxScore = 100;

  // Active order blocks (25 points max)
  score += Math.min(orderBlocks.length * 10, 25);

  // Unfilled FVGs (20 points max)
  score += Math.min(fvgs.length * 8, 20);

  // Break of structure (25 points)
  if (bos) score += 25;

  // Displacement (30 points)
  if (displacement) score += 30;

  return Math.min(score, maxScore);
}

/** Get average candle range */
function getAverageRange(candles: Candle[]): number {
  if (candles.length === 0) return 1;
  const ranges = candles.map((c) => c.high - c.low);
  return ranges.reduce((sum, r) => sum + r, 0) / ranges.length;
}

/** Default SMC analysis when insufficient data */
function getDefaultSMC(candles: Candle[]): SMCAnalysis {
  return {
    orderBlocks: [],
    fairValueGaps: [],
    breakOfStructure: false,
    changeOfCharacter: false,
    displacement: false,
    displacementDirection: null,
    premiumDiscount: "EQUILIBRIUM",
    institutionalBias: "NEUTRAL",
    confluenceScore: 0,
  };
}
