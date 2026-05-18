// ================================================
// ICT Volatility Sniper AI — Multi-Timeframe Engine
// H1 → M15 → M5 → M1 top-down analysis
// Confluence scoring, retail trap detection, scalp opportunities
// ================================================

import type {
  Candle,
  MTFAnalysis,
  TimeframeAnalysis,
  TrendDirection,
  SignalDirection,
  Timeframe,
} from "@/types";

/** Run multi-timeframe analysis */
export function analyzeMTF(candles: Candle[]): MTFAnalysis {
  // Simulate higher timeframe data from M1 candles
  const m1Candles = candles;
  const m5Candles = aggregateCandles(candles, 5);
  const m15Candles = aggregateCandles(candles, 15);
  const h1Candles = aggregateCandles(candles, 60);

  const h1 = analyzeTimeframe(h1Candles, "1h");
  const m15 = analyzeTimeframe(m15Candles, "15m");
  const m5 = analyzeTimeframe(m5Candles, "5m");
  const m1 = analyzeTimeframe(m1Candles, "1m");

  // Determine overall bias from top-down
  const overallBias = determineOverallBias(h1, m15, m5, m1);

  // Calculate confluence score
  const confluenceScore = calculateMTFConfluence(h1, m15, m5, m1);

  // Detect retail traps
  const { retailTrapDetected, retailTrapDirection } = detectRetailTrap(h1, m15, m5, m1);

  // Identify scalp opportunities
  const { scalpOpportunity, scalpDirection } = identifyScalpOpportunity(m5, m1, overallBias);

  // Top-down confirmation
  const topDownConfirmation = h1.trend === m15.trend && m15.trend === m5.trend;

  return {
    h1,
    m15,
    m5,
    m1,
    overallBias,
    confluenceScore,
    retailTrapDetected,
    retailTrapDirection,
    scalpOpportunity,
    scalpDirection,
    topDownConfirmation,
  };
}

/** Analyze a single timeframe */
function analyzeTimeframe(candles: Candle[], timeframe: Timeframe): TimeframeAnalysis {
  if (candles.length < 5) {
    return {
      timeframe,
      trend: "NEUTRAL",
      strength: 0,
      keyLevel: candles[candles.length - 1]?.close || 0,
      bias: "NEUTRAL",
    };
  }

  const trend = determineTrend(candles);
  const strength = calculateTrendStrength(candles);
  const keyLevel = findKeyLevel(candles);
  const bias = determineBias(candles, trend);

  return { timeframe, trend, strength, keyLevel, bias };
}

/** Determine trend from candle data */
function determineTrend(candles: Candle[]): TrendDirection {
  const recent = candles.slice(-10);
  if (recent.length < 3) return "NEUTRAL";

  const firstClose = recent[0].close;
  const lastClose = recent[recent.length - 1].close;
  const change = lastClose - firstClose;
  const avgRange = getAvgRange(recent);

  if (change > avgRange * 0.5) return "BULLISH";
  if (change < -avgRange * 0.5) return "BEARISH";
  return "NEUTRAL";
}

/** Calculate trend strength (0-100) */
function calculateTrendStrength(candles: Candle[]): number {
  const recent = candles.slice(-10);
  if (recent.length < 3) return 0;

  let directionalCandles = 0;
  const firstClose = recent[0].close;
  const lastClose = recent[recent.length - 1].close;
  const isBullish = lastClose > firstClose;

  for (const candle of recent) {
    if (isBullish && candle.close > candle.open) directionalCandles++;
    if (!isBullish && candle.close < candle.open) directionalCandles++;
  }

  const consistency = (directionalCandles / recent.length) * 100;
  const magnitude = Math.abs(lastClose - firstClose) / getAvgRange(recent) * 20;

  return Math.min(Math.round((consistency + magnitude) / 2), 100);
}

/** Find key support/resistance level */
function findKeyLevel(candles: Candle[]): number {
  const recent = candles.slice(-20);
  const highs = recent.map((c) => c.high);
  const lows = recent.map((c) => c.low);

  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  const mid = (highestHigh + lowestLow) / 2;

  return Math.round(mid * 100) / 100;
}

/** Determine directional bias */
function determineBias(candles: Candle[], trend: TrendDirection): TrendDirection {
  // Bias considers both trend and recent momentum
  const last3 = candles.slice(-3);
  let bullishCount = 0;
  let bearishCount = 0;

  for (const c of last3) {
    if (c.close > c.open) bullishCount++;
    else bearishCount++;
  }

  if (trend === "BULLISH" && bullishCount >= 2) return "BULLISH";
  if (trend === "BEARISH" && bearishCount >= 2) return "BEARISH";
  if (bullishCount === 3) return "BULLISH";
  if (bearishCount === 3) return "BEARISH";
  return trend;
}

/** Determine overall bias from all timeframes */
function determineOverallBias(
  h1: TimeframeAnalysis,
  m15: TimeframeAnalysis,
  m5: TimeframeAnalysis,
  m1: TimeframeAnalysis
): TrendDirection {
  // Weighted scoring: H1 has most weight
  let score = 0;
  const weights = { h1: 4, m15: 3, m5: 2, m1: 1 };

  const tfs = [
    { tf: h1, weight: weights.h1 },
    { tf: m15, weight: weights.m15 },
    { tf: m5, weight: weights.m5 },
    { tf: m1, weight: weights.m1 },
  ];

  for (const { tf, weight } of tfs) {
    if (tf.trend === "BULLISH") score += weight;
    else if (tf.trend === "BEARISH") score -= weight;
  }

  if (score >= 4) return "BULLISH";
  if (score <= -4) return "BEARISH";
  return "NEUTRAL";
}

/** Calculate MTF confluence score */
function calculateMTFConfluence(
  h1: TimeframeAnalysis,
  m15: TimeframeAnalysis,
  m5: TimeframeAnalysis,
  m1: TimeframeAnalysis
): number {
  let score = 0;

  // All aligned = max confluence
  if (h1.trend === m15.trend && m15.trend === m5.trend && m5.trend === m1.trend) {
    score = 95;
  }
  // Top 3 aligned
  else if (h1.trend === m15.trend && m15.trend === m5.trend) {
    score = 80;
  }
  // H1 + M15 aligned
  else if (h1.trend === m15.trend && h1.trend !== "NEUTRAL") {
    score = 65;
  }
  // Lower TFs aligned
  else if (m5.trend === m1.trend && m5.trend !== "NEUTRAL") {
    score = 50;
  }
  // Mixed
  else {
    score = 30;
  }

  // Bonus for strength
  const avgStrength = (h1.strength + m15.strength + m5.strength + m1.strength) / 4;
  score = Math.min(score + avgStrength * 0.1, 100);

  return Math.round(score);
}

/** Detect retail traps (divergence between HTF and LTF) */
function detectRetailTrap(
  h1: TimeframeAnalysis,
  m15: TimeframeAnalysis,
  m5: TimeframeAnalysis,
  m1: TimeframeAnalysis
): { retailTrapDetected: boolean; retailTrapDirection: TrendDirection | null } {
  // Retail trap: LTF shows one direction but HTF is opposite
  // Retail traders follow M1/M5, smart money follows H1/M15

  if (h1.trend === "BULLISH" && m1.trend === "BEARISH" && m5.trend === "BEARISH") {
    return { retailTrapDetected: true, retailTrapDirection: "BEARISH" };
  }

  if (h1.trend === "BEARISH" && m1.trend === "BULLISH" && m5.trend === "BULLISH") {
    return { retailTrapDetected: true, retailTrapDirection: "BULLISH" };
  }

  return { retailTrapDetected: false, retailTrapDirection: null };
}

/** Identify scalp opportunities */
function identifyScalpOpportunity(
  m5: TimeframeAnalysis,
  m1: TimeframeAnalysis,
  overallBias: TrendDirection
): { scalpOpportunity: boolean; scalpDirection: SignalDirection } {
  // Scalp opportunity: M5 and M1 aligned with overall bias
  if (m5.trend === m1.trend && m5.trend !== "NEUTRAL") {
    if (m5.trend === overallBias || overallBias === "NEUTRAL") {
      return {
        scalpOpportunity: true,
        scalpDirection: m5.trend === "BULLISH" ? "BUY" : "SELL",
      };
    }
  }

  // Counter-trend scalp if M1 momentum is very strong
  if (m1.strength > 70 && m1.trend !== "NEUTRAL") {
    return {
      scalpOpportunity: true,
      scalpDirection: m1.trend === "BULLISH" ? "BUY" : "SELL",
    };
  }

  return { scalpOpportunity: false, scalpDirection: "WAIT" };
}

/** Aggregate M1 candles into higher timeframe */
function aggregateCandles(candles: Candle[], periodMinutes: number): Candle[] {
  const aggregated: Candle[] = [];
  const groupSize = periodMinutes;

  for (let i = 0; i < candles.length; i += groupSize) {
    const group = candles.slice(i, i + groupSize);
    if (group.length === 0) continue;

    aggregated.push({
      time: group[0].time,
      open: group[0].open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((sum, c) => sum + c.volume, 0),
    });
  }

  return aggregated;
}

/** Get average range of candles */
function getAvgRange(candles: Candle[]): number {
  if (candles.length === 0) return 1;
  const ranges = candles.map((c) => c.high - c.low);
  return ranges.reduce((sum, r) => sum + r, 0) / ranges.length;
}
