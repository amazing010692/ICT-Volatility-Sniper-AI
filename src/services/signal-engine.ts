import type {
  Candle,
  TradingSignal,
  TradingChecklist,
  ChecklistItem,
  SignalDirection,
  StrategySettings,
  TradingPair,
} from "@/types";
import {
  analyzeEMA,
  analyzeMarketStructure,
  analyzeLiquidity,
  analyzeVolatility,
  analyzeSession,
  analyzeMomentum,
} from "./analysis-engine";
import { analyzeMomentumAdvanced } from "./momentum-engine";
import { CHECKLIST_WEIGHTS, SIGNAL_THRESHOLDS } from "@/config";

// ================================================
// ICT Volatility Sniper AI — Signal Engine
// HYPER-AGGRESSIVE M1 signal generation
//
// Philosophy: On M1 XAUUSD, opportunities are EVERYWHERE.
// Gold moves $5-20 in minutes. We need to CATCH these moves.
//
// Key changes from conservative approach:
// - Lower confidence threshold (50% instead of 70%)
// - Momentum/impulse candles can override structure
// - Big candles = immediate signal regardless of other factors
// - Session filter relaxed (XAUUSD moves in Asian too)
// - Structure disagreement only downgrades, doesn't kill signal
// ================================================

/** Generate complete trading analysis and signal */
export function generateSignal(
  candles: Candle[],
  pair: TradingPair,
  settings: StrategySettings
): { signal: TradingSignal; checklist: TradingChecklist } {
  // Run all analyses
  const ema = analyzeEMA(candles, settings.emaFast, settings.emaMedium, settings.emaSlow, settings.ema200);
  const structure = analyzeMarketStructure(candles);
  const liquidity = analyzeLiquidity(candles);
  const volatility = analyzeVolatility(candles, settings.atrPeriod, settings.adxPeriod);
  const session = analyzeSession(candles);
  const momentum = analyzeMomentum(candles);

  // ============================================
  // IMPULSE / BIG CANDLE DETECTION (M1 PRIORITY)
  // If we detect a massive candle, that IS the signal.
  // Don't wait for confluence — ride the momentum.
  // ============================================
  const impulseSignal = detectImpulseEntry(candles, volatility.atr, pair);

  // Build checklist
  const checklist = buildChecklist(ema, structure, liquidity, volatility, session, momentum, settings);

  // Calculate confidence scores
  const buyScore = calculateScore(checklist.buyConditions);
  const sellScore = calculateScore(checklist.sellConditions);
  const waitScore = calculateScore(checklist.waitConditions);

  // Determine signal direction
  let direction: SignalDirection = "WAIT";
  let confidence = 0;

  // IMPULSE OVERRIDE: Big candle detected — take the trade
  if (impulseSignal.detected) {
    direction = impulseSignal.direction;
    confidence = impulseSignal.confidence;
  }
  // Standard signal logic (but more aggressive)
  else if (buyScore > sellScore && buyScore > SIGNAL_THRESHOLDS.LOW_CONFIDENCE && waitScore < 60) {
    direction = "BUY";
    confidence = buyScore;
  } else if (sellScore > buyScore && sellScore > SIGNAL_THRESHOLDS.LOW_CONFIDENCE && waitScore < 60) {
    direction = "SELL";
    confidence = sellScore;
  } else {
    direction = "WAIT";
    confidence = waitScore;
  }

  // ============================================
  // M1 AGGRESSIVE FILTERS (much less restrictive)
  // We want to CATCH moves, not filter them out
  // ============================================

  // Filter 1: Minimum confidence 50% (was 70% — way too conservative for M1)
  if (direction !== "WAIT" && confidence < 50) {
    direction = "WAIT";
    confidence = 100 - confidence;
  }

  // Filter 2: Session filter — RELAXED for XAUUSD
  // Gold moves in ALL sessions. Only filter out dead hours (21-00 UTC)
  if (direction !== "WAIT" && session.currentSession === "CLOSED") {
    // Only kill signal if truly dead market
    confidence = Math.max(confidence - 10, 40);
    if (confidence < 45) {
      direction = "WAIT";
      confidence = 60;
    }
  }

  // Filter 3: Volatility — on M1, even small ATR is tradeable
  // Only filter if market is COMPLETELY dead (no movement at all)
  if (direction !== "WAIT" && !volatility.isVolatile && volatility.atrPercent < 0.01) {
    direction = "WAIT";
    confidence = 70;
  }

  // Filter 4: Structure disagreement — DOWNGRADE but don't kill
  // On M1, structure shifts happen in seconds. Don't miss the move.
  if (direction === "BUY" && structure.trend === "BEARISH") {
    confidence = Math.max(confidence - 10, 45); // Small penalty, not a kill
  }
  if (direction === "SELL" && structure.trend === "BULLISH") {
    confidence = Math.max(confidence - 10, 45);
  }

  // Filter 5: Momentum BOOST (not filter)
  // If momentum confirms, INCREASE confidence
  if (direction === "BUY" && momentum.candleMomentum === "STRONG_BULLISH") {
    confidence = Math.min(confidence + 15, 98);
  }
  if (direction === "SELL" && momentum.candleMomentum === "STRONG_BEARISH") {
    confidence = Math.min(confidence + 15, 98);
  }
  // Liquidity sweep BOOST
  if (direction === "BUY" && liquidity.sweepDetected && liquidity.sweepDirection === "BELOW") {
    confidence = Math.min(confidence + 10, 98);
  }
  if (direction === "SELL" && liquidity.sweepDetected && liquidity.sweepDirection === "ABOVE") {
    confidence = Math.min(confidence + 10, 98);
  }

  // ============================================
  // MOMENTUM PHASE INTEGRATION
  // Use advanced momentum engine to boost/kill signals
  // ============================================
  const momentumPhase = analyzeMomentumAdvanced(candles);

  // IGNITION PHASE BOOST: This is the PRIME entry — boost confidence heavily
  if (direction !== "WAIT" && momentumPhase.phase === "IGNITION") {
    confidence = Math.min(confidence + 20, 98);
  }

  // ACCELERATION PHASE: Still good — moderate boost
  if (direction !== "WAIT" && momentumPhase.phase === "ACCELERATION" && momentumPhase.consecutiveImpulse <= 3) {
    confidence = Math.min(confidence + 10, 95);
  }

  // COMPRESSION with expansion imminent: Prepare for breakout
  if (direction !== "WAIT" && momentumPhase.expansionImminent) {
    confidence = Math.min(confidence + 8, 92);
  }

  // CLIMAX/EXHAUSTION: KILL the signal — don't enter late
  if (direction !== "WAIT" && (momentumPhase.phase === "CLIMAX" || momentumPhase.phase === "EXHAUSTION")) {
    confidence = Math.max(confidence - 30, 30);
    if (confidence < 45) {
      direction = "WAIT";
      confidence = 70;
    }
  }

  // ATR EXPANDING boost: Volatility is growing = momentum continuing
  if (direction !== "WAIT" && momentumPhase.isATRExpanding && momentumPhase.velocityTrend === "ACCELERATING") {
    confidence = Math.min(confidence + 8, 98);
  }

  // Calculate entry, SL, TP — TIGHT for M1 scalping
  const currentPrice = candles[candles.length - 1].close;
  const atr = volatility.atr;
  const entry = currentPrice;

  // M1 TIGHT stop loss — use last 5-10 candles, not 20
  let stopLoss: number;
  if (direction === "BUY") {
    const recentLows = candles.slice(-8).map((c) => c.low);
    const swingLow = Math.min(...recentLows);
    stopLoss = Math.min(swingLow - atr * 0.15, entry - atr * 0.8);
  } else if (direction === "SELL") {
    const recentHighs = candles.slice(-8).map((c) => c.high);
    const swingHigh = Math.max(...recentHighs);
    stopLoss = Math.max(swingHigh + atr * 0.15, entry + atr * 0.8);
  } else {
    stopLoss = entry;
  }

  // Take profit: aggressive R:R for scalping
  const risk = Math.abs(entry - stopLoss);
  const takeProfit1 = direction === "BUY"
    ? entry + risk * 2
    : direction === "SELL"
      ? entry - risk * 2
      : entry;
  const takeProfit2 = direction === "BUY"
    ? entry + risk * 3.5
    : direction === "SELL"
      ? entry - risk * 3.5
      : entry;
  const takeProfit3 = direction === "BUY"
    ? entry + risk * 5
    : direction === "SELL"
      ? entry - risk * 5
      : entry;

  const reward = Math.abs(takeProfit1 - entry);
  const riskRewardRatio = risk > 0 ? reward / risk : 0;

  // Determine trade quality
  const tradeQuality = getTradeQuality(confidence, riskRewardRatio);

  // Generate reasoning
  const reasoning = generateReasoning(direction, ema, structure, liquidity, volatility, session, momentum, impulseSignal);

  const signal: TradingSignal = {
    direction,
    confidence,
    entry,
    stopLoss,
    takeProfit1,
    takeProfit2,
    takeProfit3,
    riskRewardRatio,
    tradeQuality,
    reasoning,
    timestamp: Date.now(),
  };

  return { signal, checklist };
}

// ================================================
// IMPULSE / BIG CANDLE DETECTION
// This is the core M1 scalping edge:
// Detect when a candle is abnormally large (institutional aggression)
// and immediately signal in that direction.
// ================================================

interface ImpulseSignal {
  detected: boolean;
  direction: SignalDirection;
  confidence: number;
  type: "DISPLACEMENT" | "IMPULSE" | "VOLUME_SPIKE" | "NONE";
}

function detectImpulseEntry(candles: Candle[], atr: number, pair: TradingPair): ImpulseSignal {
  if (candles.length < 10) {
    return { detected: false, direction: "WAIT", confidence: 0, type: "NONE" };
  }

  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const body = Math.abs(lastCandle.close - lastCandle.open);
  const range = lastCandle.high - lastCandle.low;
  const bodyRatio = range > 0 ? body / range : 0;

  // Average range of last 10 candles
  const recentRanges = candles.slice(-10).map((c) => c.high - c.low);
  const avgRange = recentRanges.reduce((s, r) => s + r, 0) / recentRanges.length;

  // Average body of last 10 candles
  const recentBodies = candles.slice(-10).map((c) => Math.abs(c.close - c.open));
  const avgBody = recentBodies.reduce((s, b) => s + b, 0) / recentBodies.length;

  const isBullish = lastCandle.close > lastCandle.open;
  const direction: SignalDirection = isBullish ? "BUY" : "SELL";

  // DISPLACEMENT: Body > 1.5x ATR AND body dominance > 65%
  // This is THE institutional candle — pure aggression
  if (body > atr * 1.3 && bodyRatio > 0.6) {
    return {
      detected: true,
      direction,
      confidence: Math.min(85 + (body / atr) * 5, 95),
      type: "DISPLACEMENT",
    };
  }

  // IMPULSE: Candle range > 2x average range (sudden expansion)
  // Gold does this ALL the time — $3-5 candles out of nowhere
  if (range > avgRange * 2.0 && bodyRatio > 0.5) {
    return {
      detected: true,
      direction,
      confidence: Math.min(75 + (range / avgRange) * 5, 92),
      type: "IMPULSE",
    };
  }

  // VOLUME SPIKE: Body > 2.5x average body (massive relative move)
  if (body > avgBody * 2.5 && bodyRatio > 0.45) {
    return {
      detected: true,
      direction,
      confidence: Math.min(70 + (body / avgBody) * 5, 90),
      type: "VOLUME_SPIKE",
    };
  }

  // TWO-CANDLE IMPULSE: Two consecutive strong candles same direction
  const prevBody = Math.abs(prevCandle.close - prevCandle.open);
  const prevBullish = prevCandle.close > prevCandle.open;
  const sameDirection = (isBullish && prevBullish) || (!isBullish && !prevBullish);

  if (sameDirection && (body + prevBody) > atr * 1.8 && bodyRatio > 0.45) {
    return {
      detected: true,
      direction,
      confidence: Math.min(72 + ((body + prevBody) / atr) * 5, 88),
      type: "IMPULSE",
    };
  }

  return { detected: false, direction: "WAIT", confidence: 0, type: "NONE" };
}

/** Build the trading checklist */
function buildChecklist(
  ema: ReturnType<typeof analyzeEMA>,
  structure: ReturnType<typeof analyzeMarketStructure>,
  liquidity: ReturnType<typeof analyzeLiquidity>,
  volatility: ReturnType<typeof analyzeVolatility>,
  session: ReturnType<typeof analyzeSession>,
  momentum: ReturnType<typeof analyzeMomentum>,
  settings: StrategySettings
): TradingChecklist {
  const buyConditions: ChecklistItem[] = [
    {
      id: "buy-session",
      label: "Active Session",
      status: session.currentSession === "LONDON" || session.currentSession === "NEW_YORK" ? "MET" : session.currentSession === "ASIAN" ? "WARNING" : "FAILED",
      description: `Current session: ${session.currentSession}`,
      weight: CHECKLIST_WEIGHTS.sessionActive,
    },
    {
      id: "buy-structure",
      label: "Bullish Structure",
      status: structure.trend === "BULLISH" || (structure.breakOfStructure && structure.bosDirection === "BULLISH") ? "MET" : structure.trend === "NEUTRAL" ? "WARNING" : "FAILED",
      description: `Trend: ${structure.trend}, BOS: ${structure.breakOfStructure ? structure.bosDirection : "None"}`,
      weight: CHECKLIST_WEIGHTS.marketStructure,
    },
    {
      id: "buy-ema",
      label: "EMA Bullish",
      status: ema.alignment === "BULLISH" ? "MET" : ema.alignment === "NEUTRAL" ? "WARNING" : "FAILED",
      description: `EMA stack: ${ema.alignment}`,
      weight: CHECKLIST_WEIGHTS.emaAlignment,
    },
    {
      id: "buy-momentum",
      label: "Bullish Impulse/Momentum",
      status: momentum.candleMomentum === "STRONG_BULLISH" ? "MET" : momentum.candleMomentum === "NEUTRAL" ? "WARNING" : "FAILED",
      description: `Momentum: ${momentum.candleMomentum}, Body: ${(momentum.bodyToWickRatio * 100).toFixed(0)}%`,
      weight: CHECKLIST_WEIGHTS.momentumCandle,
    },
    {
      id: "buy-liquidity",
      label: "Liquidity Sweep Below",
      status: liquidity.sweepDetected && liquidity.sweepDirection === "BELOW" ? "MET" : !liquidity.sweepDetected ? "WARNING" : "FAILED",
      description: liquidity.sweepDetected ? `Sweep ${liquidity.sweepDirection} at ${liquidity.sweepLevel?.toFixed(2)}` : "No sweep",
      weight: CHECKLIST_WEIGHTS.liquiditySweep,
    },
    {
      id: "buy-breakout",
      label: "Breakout Confirmed",
      status: session.londonBreakout && session.londonBreakoutDirection === "BULLISH" ? "MET" : structure.breakOfStructure && structure.bosDirection === "BULLISH" ? "MET" : "WARNING",
      description: structure.breakOfStructure ? `BOS ${structure.bosDirection}` : "No breakout",
      weight: CHECKLIST_WEIGHTS.breakoutConfirmation,
    },
    {
      id: "buy-adx",
      label: "Trend Strength",
      status: volatility.adxStrong ? "MET" : "WARNING",
      description: `ADX: ${volatility.adx.toFixed(1)}`,
      weight: CHECKLIST_WEIGHTS.adxStrength,
    },
    {
      id: "buy-atr",
      label: "Volatility Present",
      status: volatility.isVolatile ? "MET" : "WARNING",
      description: `ATR%: ${volatility.atrPercent.toFixed(4)}%`,
      weight: CHECKLIST_WEIGHTS.atrVolatility,
    },
    {
      id: "buy-vwap",
      label: "Above VWAP",
      status: session.priceAboveVwap ? "MET" : "WARNING",
      description: `VWAP: ${session.vwap.toFixed(2)}`,
      weight: CHECKLIST_WEIGHTS.vwapPosition,
    },
    {
      id: "buy-consecutive",
      label: "Momentum Continuation",
      status: momentum.consecutiveBullish >= 2 ? "MET" : "WARNING",
      description: `${momentum.consecutiveBullish} consecutive bullish`,
      weight: CHECKLIST_WEIGHTS.noNearbyLevel,
    },
  ];

  const sellConditions: ChecklistItem[] = [
    {
      id: "sell-session",
      label: "Active Session",
      status: session.currentSession === "LONDON" || session.currentSession === "NEW_YORK" ? "MET" : session.currentSession === "ASIAN" ? "WARNING" : "FAILED",
      description: `Current session: ${session.currentSession}`,
      weight: CHECKLIST_WEIGHTS.sessionActive,
    },
    {
      id: "sell-structure",
      label: "Bearish Structure",
      status: structure.trend === "BEARISH" || (structure.breakOfStructure && structure.bosDirection === "BEARISH") ? "MET" : structure.trend === "NEUTRAL" ? "WARNING" : "FAILED",
      description: `Trend: ${structure.trend}, BOS: ${structure.breakOfStructure ? structure.bosDirection : "None"}`,
      weight: CHECKLIST_WEIGHTS.marketStructure,
    },
    {
      id: "sell-ema",
      label: "EMA Bearish",
      status: ema.alignment === "BEARISH" ? "MET" : ema.alignment === "NEUTRAL" ? "WARNING" : "FAILED",
      description: `EMA stack: ${ema.alignment}`,
      weight: CHECKLIST_WEIGHTS.emaAlignment,
    },
    {
      id: "sell-momentum",
      label: "Bearish Impulse/Momentum",
      status: momentum.candleMomentum === "STRONG_BEARISH" ? "MET" : momentum.candleMomentum === "NEUTRAL" ? "WARNING" : "FAILED",
      description: `Momentum: ${momentum.candleMomentum}, Body: ${(momentum.bodyToWickRatio * 100).toFixed(0)}%`,
      weight: CHECKLIST_WEIGHTS.momentumCandle,
    },
    {
      id: "sell-liquidity",
      label: "Liquidity Sweep Above",
      status: liquidity.sweepDetected && liquidity.sweepDirection === "ABOVE" ? "MET" : !liquidity.sweepDetected ? "WARNING" : "FAILED",
      description: liquidity.sweepDetected ? `Sweep ${liquidity.sweepDirection} at ${liquidity.sweepLevel?.toFixed(2)}` : "No sweep",
      weight: CHECKLIST_WEIGHTS.liquiditySweep,
    },
    {
      id: "sell-breakout",
      label: "Breakdown Confirmed",
      status: session.londonBreakout && session.londonBreakoutDirection === "BEARISH" ? "MET" : structure.breakOfStructure && structure.bosDirection === "BEARISH" ? "MET" : "WARNING",
      description: structure.breakOfStructure ? `BOS ${structure.bosDirection}` : "No breakdown",
      weight: CHECKLIST_WEIGHTS.breakoutConfirmation,
    },
    {
      id: "sell-adx",
      label: "Trend Strength",
      status: volatility.adxStrong ? "MET" : "WARNING",
      description: `ADX: ${volatility.adx.toFixed(1)}`,
      weight: CHECKLIST_WEIGHTS.adxStrength,
    },
    {
      id: "sell-atr",
      label: "Volatility Present",
      status: volatility.isVolatile ? "MET" : "WARNING",
      description: `ATR%: ${volatility.atrPercent.toFixed(4)}%`,
      weight: CHECKLIST_WEIGHTS.atrVolatility,
    },
    {
      id: "sell-vwap",
      label: "Below VWAP",
      status: !session.priceAboveVwap ? "MET" : "WARNING",
      description: `VWAP: ${session.vwap.toFixed(2)}`,
      weight: CHECKLIST_WEIGHTS.vwapPosition,
    },
    {
      id: "sell-consecutive",
      label: "Momentum Continuation",
      status: momentum.consecutiveBearish >= 2 ? "MET" : "WARNING",
      description: `${momentum.consecutiveBearish} consecutive bearish`,
      weight: CHECKLIST_WEIGHTS.noNearbyLevel,
    },
  ];

  const waitConditions: ChecklistItem[] = [
    {
      id: "wait-volatility",
      label: "Dead Market",
      status: !volatility.isVolatile && volatility.atrPercent < 0.02 ? "MET" : "FAILED",
      description: `ATR%: ${volatility.atrPercent.toFixed(4)}%`,
      weight: 0.3,
    },
    {
      id: "wait-session",
      label: "Off-Hours",
      status: session.currentSession === "CLOSED" ? "MET" : "FAILED",
      description: `Current: ${session.currentSession}`,
      weight: 0.3,
    },
    {
      id: "wait-weak",
      label: "No Momentum",
      status: momentum.candleMomentum === "WEAK" && !volatility.adxStrong ? "MET" : "FAILED",
      description: `Momentum: ${momentum.candleMomentum}`,
      weight: 0.2,
    },
    {
      id: "wait-conflicting",
      label: "Choppy/Conflicting",
      status: ema.alignment === "NEUTRAL" && structure.trend === "NEUTRAL" && momentum.candleMomentum === "WEAK" ? "MET" : "FAILED",
      description: `EMA: ${ema.alignment}, Structure: ${structure.trend}`,
      weight: 0.2,
    },
  ];

  return { buyConditions, sellConditions, waitConditions };
}

/** Calculate weighted score from checklist items */
function calculateScore(items: ChecklistItem[]): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const item of items) {
    totalWeight += item.weight;
    if (item.status === "MET") {
      weightedScore += item.weight;
    } else if (item.status === "WARNING") {
      weightedScore += item.weight * 0.5; // More generous for WARNING (was 0.4)
    }
  }

  return totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
}

/** Determine trade quality grade — adjusted for M1 scalping */
function getTradeQuality(
  confidence: number,
  rr: number
): "A+" | "A" | "B" | "C" | "NO_TRADE" {
  if (confidence >= 80 && rr >= 1.8) return "A+";
  if (confidence >= 70 && rr >= 1.5) return "A";
  if (confidence >= 55 && rr >= 1.2) return "B";
  if (confidence >= 45) return "C";
  return "NO_TRADE";
}

/** Generate human-readable reasoning for the signal */
function generateReasoning(
  direction: SignalDirection,
  ema: ReturnType<typeof analyzeEMA>,
  structure: ReturnType<typeof analyzeMarketStructure>,
  liquidity: ReturnType<typeof analyzeLiquidity>,
  volatility: ReturnType<typeof analyzeVolatility>,
  session: ReturnType<typeof analyzeSession>,
  momentum: ReturnType<typeof analyzeMomentum>,
  impulse: ImpulseSignal
): string[] {
  const reasons: string[] = [];

  // Impulse detection reasoning (highest priority)
  if (impulse.detected) {
    if (impulse.type === "DISPLACEMENT") {
      reasons.push(`⚡ DISPLACEMENT CANDLE detected — institutional aggression, body > 1.3x ATR with ${impulse.confidence.toFixed(0)}% confidence.`);
    } else if (impulse.type === "IMPULSE") {
      reasons.push(`🔥 IMPULSE CANDLE — range > 2x average. Big money is moving. Ride the momentum.`);
    } else if (impulse.type === "VOLUME_SPIKE") {
      reasons.push(`📊 VOLUME SPIKE — candle body > 2.5x average. Institutional order flow detected.`);
    }
  }

  if (direction === "BUY") {
    if (momentum.candleMomentum === "STRONG_BULLISH") {
      reasons.push("Strong bullish candle — buyers aggressively pushing price higher.");
    }
    if (momentum.consecutiveBullish >= 2) {
      reasons.push(`${momentum.consecutiveBullish} consecutive bullish candles — momentum building.`);
    }
    if (structure.breakOfStructure && structure.bosDirection === "BULLISH") {
      reasons.push("Break of structure bullish — new higher high confirmed.");
    }
    if (liquidity.sweepDetected && liquidity.sweepDirection === "BELOW") {
      reasons.push("Liquidity swept below — smart money grabbed stops, reversal likely.");
    }
    if (ema.alignment === "BULLISH") {
      reasons.push("EMA stack bullish — trend supports longs.");
    }
    if (session.currentSession === "LONDON" || session.currentSession === "NEW_YORK") {
      reasons.push(`${session.currentSession} session active — high liquidity window.`);
    }
  } else if (direction === "SELL") {
    if (momentum.candleMomentum === "STRONG_BEARISH") {
      reasons.push("Strong bearish candle — sellers aggressively pushing price lower.");
    }
    if (momentum.consecutiveBearish >= 2) {
      reasons.push(`${momentum.consecutiveBearish} consecutive bearish candles — momentum building.`);
    }
    if (structure.breakOfStructure && structure.bosDirection === "BEARISH") {
      reasons.push("Break of structure bearish — new lower low confirmed.");
    }
    if (liquidity.sweepDetected && liquidity.sweepDirection === "ABOVE") {
      reasons.push("Liquidity swept above — smart money distributed, drop likely.");
    }
    if (ema.alignment === "BEARISH") {
      reasons.push("EMA stack bearish — trend supports shorts.");
    }
    if (session.currentSession === "LONDON" || session.currentSession === "NEW_YORK") {
      reasons.push(`${session.currentSession} session active — high liquidity window.`);
    }
  } else {
    if (momentum.candleMomentum === "WEAK") {
      reasons.push("Weak candles — no impulse detected, market is quiet.");
    }
    if (!volatility.isVolatile) {
      reasons.push("Low volatility — wait for expansion.");
    }
    if (session.currentSession === "CLOSED") {
      reasons.push("Market closed — no liquidity for scalping.");
    }
    if (ema.alignment === "NEUTRAL") {
      reasons.push("EMAs tangled — no clear direction.");
    }
  }

  if (reasons.length === 0) {
    reasons.push("Scanning for impulse candles and momentum ignition...");
  }

  return reasons;
}
