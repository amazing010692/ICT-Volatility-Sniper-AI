import type {
  Candle,
  EMAAnalysis,
  MarketStructure,
  LiquidityAnalysis,
  VolatilityAnalysis,
  SessionAnalysis,
  MomentumAnalysis,
  TrendDirection,
  MarketSession,
} from "@/types";
import { SESSION_TIMES } from "@/config";

// ================================================
// ICT Volatility Sniper AI — Analysis Engine
// HYPER-SENSITIVE M1 analysis for XAUUSD scalping
// Detects impulse candles, big moves, volume spikes
// ================================================

/** Calculate Exponential Moving Average */
export function calculateEMA(candles: Candle[], period: number): number[] {
  const closes = candles.map((c) => c.close);
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < period && i < closes.length; i++) {
    sum += closes[i];
  }
  ema.push(sum / period);

  for (let i = period; i < closes.length; i++) {
    const value = (closes[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }

  return ema;
}

/** Full EMA analysis with alignment detection */
export function analyzeEMA(
  candles: Candle[],
  fast: number = 9,
  medium: number = 21,
  slow: number = 50,
  longTerm: number = 200
): EMAAnalysis {
  const ema9 = calculateEMA(candles, fast);
  const ema21 = calculateEMA(candles, medium);
  const ema50 = calculateEMA(candles, slow);
  const ema200 = calculateEMA(candles, longTerm);

  const lastEma9 = ema9[ema9.length - 1] || 0;
  const lastEma21 = ema21[ema21.length - 1] || 0;
  const lastEma50 = ema50[ema50.length - 1] || 0;
  const lastEma200 = ema200[ema200.length - 1] || 0;

  // Determine alignment
  let alignment: TrendDirection = "NEUTRAL";
  if (lastEma9 > lastEma21 && lastEma21 > lastEma50) {
    alignment = "BULLISH";
  } else if (lastEma9 < lastEma21 && lastEma21 < lastEma50) {
    alignment = "BEARISH";
  }

  // Detect crossover
  const prevEma9 = ema9[ema9.length - 2] || 0;
  const prevEma21 = ema21[ema21.length - 2] || 0;
  let crossover: "BULLISH_CROSS" | "BEARISH_CROSS" | "NONE" = "NONE";
  if (prevEma9 <= prevEma21 && lastEma9 > lastEma21) {
    crossover = "BULLISH_CROSS";
  } else if (prevEma9 >= prevEma21 && lastEma9 < lastEma21) {
    crossover = "BEARISH_CROSS";
  }

  return {
    ema9: lastEma9,
    ema21: lastEma21,
    ema50: lastEma50,
    ema200: lastEma200,
    alignment,
    crossover,
  };
}

/** Analyze market structure — M1 SENSITIVE (lookback=2 for fast detection) */
export function analyzeMarketStructure(candles: Candle[]): MarketStructure {
  // Use lookback=2 for M1 — detect structure shifts FAST
  const swingPoints = findSwingPoints(candles, 2);
  const highs = swingPoints.filter((p) => p.type === "HIGH").map((p) => p.price);
  const lows = swingPoints.filter((p) => p.type === "LOW").map((p) => p.price);

  const lastSwingHigh = highs[highs.length - 1] || candles[candles.length - 1].high;
  const lastSwingLow = lows[lows.length - 1] || candles[candles.length - 1].low;

  // Check for higher highs / lower lows pattern
  const higherHighs =
    highs.length >= 2 && highs[highs.length - 1] > highs[highs.length - 2];
  const lowerLows =
    lows.length >= 2 && lows[lows.length - 1] < lows[lows.length - 2];

  let trend: TrendDirection = "NEUTRAL";
  if (higherHighs && !lowerLows) trend = "BULLISH";
  else if (lowerLows && !higherHighs) trend = "BEARISH";
  // Also detect trend from recent price action (last 10 candles)
  else if (candles.length >= 10) {
    const recent = candles.slice(-10);
    const firstClose = recent[0].close;
    const lastClose = recent[recent.length - 1].close;
    const move = lastClose - firstClose;
    const atr = calculateATRFast(candles);
    // If price moved more than 1 ATR in 10 candles, that's a trend on M1
    if (move > atr * 0.8) trend = "BULLISH";
    else if (move < -atr * 0.8) trend = "BEARISH";
  }

  // Break of structure detection
  const currentPrice = candles[candles.length - 1].close;
  const breakOfStructure =
    currentPrice > lastSwingHigh || currentPrice < lastSwingLow;
  const bosDirection: TrendDirection | null = breakOfStructure
    ? currentPrice > lastSwingHigh
      ? "BULLISH"
      : "BEARISH"
    : null;

  return {
    trend,
    breakOfStructure,
    bosDirection,
    higherHighs,
    lowerLows,
    lastSwingHigh,
    lastSwingLow,
  };
}

/** Find swing highs and lows — FAST for M1 */
function findSwingPoints(
  candles: Candle[],
  lookback: number = 2
): { type: "HIGH" | "LOW"; price: number; index: number }[] {
  const points: { type: "HIGH" | "LOW"; price: number; index: number }[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
        isSwingHigh = false;
      }
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
        isSwingLow = false;
      }
    }

    if (isSwingHigh) points.push({ type: "HIGH", price: candles[i].high, index: i });
    if (isSwingLow) points.push({ type: "LOW", price: candles[i].low, index: i });
  }

  return points;
}

/** Analyze liquidity sweeps — SENSITIVE for M1 */
export function analyzeLiquidity(candles: Candle[]): LiquidityAnalysis {
  const recentCandles = candles.slice(-15); // Shorter window for M1
  const structure = analyzeMarketStructure(candles.slice(0, -3)); // Less buffer

  const lastCandle = recentCandles[recentCandles.length - 1];

  // Detect sweep: price goes beyond level then reverses
  let sweepDetected = false;
  let sweepDirection: "ABOVE" | "BELOW" | null = null;
  let sweepLevel: number | null = null;

  // Sweep below support (bullish signal) — check last 3 candles for M1
  for (let i = recentCandles.length - 1; i >= Math.max(0, recentCandles.length - 3); i--) {
    const c = recentCandles[i];
    if (c.low < structure.lastSwingLow && c.close > structure.lastSwingLow) {
      sweepDetected = true;
      sweepDirection = "BELOW";
      sweepLevel = structure.lastSwingLow;
      break;
    }
  }

  // Sweep above resistance (bearish signal) — check last 3 candles
  if (!sweepDetected) {
    for (let i = recentCandles.length - 1; i >= Math.max(0, recentCandles.length - 3); i--) {
      const c = recentCandles[i];
      if (c.high > structure.lastSwingHigh && c.close < structure.lastSwingHigh) {
        sweepDetected = true;
        sweepDirection = "ABOVE";
        sweepLevel = structure.lastSwingHigh;
        break;
      }
    }
  }

  // Identify liquidity zones
  const liquidityZones = findLiquidityZones(candles);

  return { sweepDetected, sweepDirection, sweepLevel, liquidityZones };
}

/** Find liquidity zones where stops likely cluster */
function findLiquidityZones(
  candles: Candle[]
): { price: number; strength: number }[] {
  const zones: { price: number; strength: number }[] = [];
  const tolerance = (candles[0]?.high - candles[0]?.low) * 0.3 || 0.5; // Tighter tolerance for M1

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const allLevels = [...highs, ...lows];
  const grouped: Map<number, number> = new Map();

  for (const level of allLevels) {
    const roundedLevel = Math.round(level / tolerance) * tolerance;
    grouped.set(roundedLevel, (grouped.get(roundedLevel) || 0) + 1);
  }

  // Levels touched 2+ times are significant on M1
  for (const [price, count] of grouped) {
    if (count >= 2) {
      zones.push({ price, strength: count / allLevels.length });
    }
  }

  return zones.sort((a, b) => b.strength - a.strength).slice(0, 5);
}

/** Calculate ATR and ADX — M1 SENSITIVE thresholds */
export function analyzeVolatility(
  candles: Candle[],
  atrPeriod: number = 14,
  adxPeriod: number = 14
): VolatilityAnalysis {
  const atr = calculateATR(candles, atrPeriod);
  const currentPrice = candles[candles.length - 1].close;
  const atrPercent = (atr / currentPrice) * 100;
  const adx = calculateADX(candles, adxPeriod);

  // M1 XAUUSD: ATR% is naturally lower on 1-min candles
  // Gold M1 ATR is typically $1-5 on a $2000+ price = 0.05-0.25%
  // We need MUCH lower thresholds to detect M1 volatility
  return {
    atr,
    atrPercent,
    isVolatile: atrPercent > 0.03, // Very sensitive — any M1 movement counts
    adx,
    adxStrong: adx > 15, // Lower threshold for M1 — catch trends early
  };
}

/** Calculate Average True Range */
function calculateATR(candles: Candle[], period: number): number {
  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }

  const recent = trueRanges.slice(-period);
  return recent.reduce((sum, tr) => sum + tr, 0) / recent.length;
}

/** Fast ATR calculation (last 7 candles for M1 speed) */
function calculateATRFast(candles: Candle[]): number {
  const recent = candles.slice(-7);
  let sum = 0;
  for (let i = 1; i < recent.length; i++) {
    sum += recent[i].high - recent[i].low;
  }
  return sum / (recent.length - 1);
}

/** Calculate ADX (simplified) */
function calculateADX(candles: Candle[], period: number): number {
  if (candles.length < period + 1) return 0;

  let plusDMSum = 0;
  let minusDMSum = 0;
  let trSum = 0;

  for (let i = 1; i <= period && i < candles.length; i++) {
    const high = candles[candles.length - i].high;
    const low = candles[candles.length - i].low;
    const prevHigh = candles[candles.length - i - 1]?.high || high;
    const prevLow = candles[candles.length - i - 1]?.low || low;
    const prevClose = candles[candles.length - i - 1]?.close || low;

    const plusDM = Math.max(high - prevHigh, 0);
    const minusDM = Math.max(prevLow - low, 0);
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));

    plusDMSum += plusDM;
    minusDMSum += minusDM;
    trSum += tr;
  }

  if (trSum === 0) return 0;

  const plusDI = (plusDMSum / trSum) * 100;
  const minusDI = (minusDMSum / trSum) * 100;
  const diSum = plusDI + minusDI;

  if (diSum === 0) return 0;
  const dx = (Math.abs(plusDI - minusDI) / diSum) * 100;

  return dx;
}

/** Analyze current trading session */
export function analyzeSession(candles: Candle[]): SessionAnalysis {
  const now = new Date();
  const utcHour = now.getUTCHours();

  // Determine current session
  let currentSession: MarketSession = "CLOSED";
  if (utcHour >= SESSION_TIMES.LONDON.start && utcHour < SESSION_TIMES.LONDON.end) {
    currentSession = "LONDON";
  } else if (utcHour >= SESSION_TIMES.NEW_YORK.start && utcHour < SESSION_TIMES.NEW_YORK.end) {
    currentSession = "NEW_YORK";
  } else if (utcHour >= SESSION_TIMES.ASIAN.start && utcHour < SESSION_TIMES.ASIAN.end) {
    currentSession = "ASIAN";
  }

  // Calculate Asian session range
  const asianCandles = candles.filter((c) => {
    const hour = new Date(c.time).getUTCHours();
    return hour >= SESSION_TIMES.ASIAN.start && hour < SESSION_TIMES.ASIAN.end;
  });

  const asianHigh = asianCandles.length > 0
    ? Math.max(...asianCandles.map((c) => c.high))
    : candles[candles.length - 1].high;
  const asianLow = asianCandles.length > 0
    ? Math.min(...asianCandles.map((c) => c.low))
    : candles[candles.length - 1].low;
  const asianRange = asianHigh - asianLow;

  // London breakout detection
  const currentPrice = candles[candles.length - 1].close;
  const londonBreakout = currentPrice > asianHigh || currentPrice < asianLow;
  const londonBreakoutDirection: TrendDirection | null = londonBreakout
    ? currentPrice > asianHigh
      ? "BULLISH"
      : "BEARISH"
    : null;

  // Simple VWAP calculation
  const vwap = calculateVWAP(candles.slice(-50));
  const priceAboveVwap = currentPrice > vwap;

  return {
    currentSession,
    asianHigh,
    asianLow,
    asianRange,
    londonBreakout,
    londonBreakoutDirection,
    vwap,
    priceAboveVwap,
  };
}

/** Calculate VWAP */
function calculateVWAP(candles: Candle[]): number {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
  }

  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : candles[candles.length - 1].close;
}

/** Analyze candle momentum — M1 HYPER-SENSITIVE
 * On M1 XAUUSD, a "big candle" can be just $1-3 but that's a HUGE move.
 * We detect:
 * - Impulse candles (body > 1x ATR)
 * - Big body dominance (body > 50% of range — lowered from 60%)
 * - Volume spikes (candle range > 1.5x average range)
 * - Consecutive momentum (2+ candles same direction = trend)
 */
export function analyzeMomentum(candles: Candle[]): MomentumAnalysis {
  const lastCandle = candles[candles.length - 1];
  const body = Math.abs(lastCandle.close - lastCandle.open);
  const totalRange = lastCandle.high - lastCandle.low;
  const bodyToWickRatio = totalRange > 0 ? body / totalRange : 0;

  // Calculate average range of recent candles for comparison
  const recentRanges = candles.slice(-10).map((c) => c.high - c.low);
  const avgRange = recentRanges.reduce((s, r) => s + r, 0) / recentRanges.length;

  // M1 SENSITIVE momentum detection:
  // - Body ratio > 0.45 (lowered from 0.6) = strong candle
  // - OR candle range > 1.5x average = impulse/big candle
  // - OR body > average range = displacement-level move
  let candleMomentum: "STRONG_BULLISH" | "STRONG_BEARISH" | "WEAK" | "NEUTRAL" = "NEUTRAL";

  const isBigCandle = totalRange > avgRange * 1.5;
  const isImpulseBody = body > avgRange * 1.0;
  const hasBodyDominance = bodyToWickRatio > 0.45;

  if (lastCandle.close > lastCandle.open && (hasBodyDominance || isBigCandle || isImpulseBody)) {
    candleMomentum = "STRONG_BULLISH";
  } else if (lastCandle.close < lastCandle.open && (hasBodyDominance || isBigCandle || isImpulseBody)) {
    candleMomentum = "STRONG_BEARISH";
  } else if (bodyToWickRatio < 0.25) {
    candleMomentum = "WEAK";
  }

  // Count consecutive bullish/bearish candles — 2+ is significant on M1
  let consecutiveBullish = 0;
  let consecutiveBearish = 0;
  for (let i = candles.length - 1; i >= 0; i--) {
    if (candles[i].close > candles[i].open) {
      if (consecutiveBearish > 0) break;
      consecutiveBullish++;
    } else {
      if (consecutiveBullish > 0) break;
      consecutiveBearish++;
    }
  }

  return { candleMomentum, bodyToWickRatio, consecutiveBullish, consecutiveBearish };
}
