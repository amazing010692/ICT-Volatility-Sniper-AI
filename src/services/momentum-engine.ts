import type { Candle, SignalDirection } from "@/types";

// ================================================
// ICT Volatility Sniper AI — MOMENTUM ENGINE
//
// CORE PURPOSE: Catch explosive moves EARLY.
// Detect momentum BEFORE retail traders notice.
//
// This engine classifies momentum into 5 phases:
// 1. COMPRESSION — volatility low, liquidity building
// 2. IGNITION — first displacement, momentum awakening
// 3. ACCELERATION — consecutive displacement, increasing vol
// 4. CLIMAX — overextended, retail FOMO entering
// 5. EXHAUSTION — weakening candles, reversal risk
//
// XAUUSD SPECIALIZATION:
// Gold moves $5-20 in minutes. This engine detects:
// - Candle velocity increase
// - ATR acceleration
// - Expansion after compression
// - Sudden body dominance
// - Momentum stacking
// - Consecutive displacement candles
// - Aggressive rejection failures
// - Fast BOS formation
// - Volatility ignition
// ================================================

export type MomentumPhase =
  | "COMPRESSION"
  | "IGNITION"
  | "ACCELERATION"
  | "CLIMAX"
  | "EXHAUSTION";

export interface MomentumAnalysisAdvanced {
  // Phase classification
  phase: MomentumPhase;
  phaseConfidence: number; // 0-100
  phaseDescription: string;

  // Direction
  direction: SignalDirection;
  directionStrength: number; // 0-100

  // Velocity metrics
  candleVelocity: number; // Current candle body / ATR
  velocityAcceleration: number; // Change in velocity over last 5 candles
  velocityTrend: "ACCELERATING" | "STEADY" | "DECELERATING";

  // ATR dynamics
  atrCurrent: number;
  atrAverage: number;
  atrAcceleration: number; // % change in ATR (expanding or contracting)
  isATRExpanding: boolean;

  // Body dominance
  bodyDominance: number; // 0-1, last candle body/range
  avgBodyDominance: number; // Average over last 5
  bodyDominanceTrend: "INCREASING" | "STABLE" | "DECREASING";

  // Momentum stacking
  consecutiveImpulse: number; // How many consecutive strong candles
  stackingStrength: number; // 0-100
  isStacking: boolean;

  // Compression detection
  compressionBars: number; // How many bars of compression
  compressionTightness: number; // 0-100 (tighter = more explosive breakout)
  expansionImminent: boolean;

  // Continuation probability
  continuationProbability: number; // 0-100
  continuationFactors: string[];

  // Warning system
  warnings: MomentumWarning[];

  // Institutional narrative
  narrative: string;

  // Entry quality
  entryQuality: "PRIME" | "GOOD" | "ACCEPTABLE" | "LATE" | "AVOID";
  entryReason: string;
}

export interface MomentumWarning {
  type: "WEAK_DISPLACEMENT" | "FAKEOUT_RISK" | "EXHAUSTION" | "VOLATILITY_DYING" | "RANGING" | "RETAIL_TRAP";
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
}

// ================================================
// MAIN MOMENTUM ANALYSIS
// ================================================

export function analyzeMomentumAdvanced(candles: Candle[]): MomentumAnalysisAdvanced {
  if (candles.length < 20) {
    return getDefaultMomentum();
  }

  const recent5 = candles.slice(-5);
  const recent10 = candles.slice(-10);
  const recent20 = candles.slice(-20);
  const lastCandle = candles[candles.length - 1];

  // Core calculations
  const atrCurrent = calcATR(candles.slice(-7));
  const atrAverage = calcATR(candles.slice(-20));
  const atrAcceleration = atrAverage > 0 ? ((atrCurrent - atrAverage) / atrAverage) * 100 : 0;
  const isATRExpanding = atrAcceleration > 10;

  const velocity = calcVelocity(candles);
  const velocityAcceleration = calcVelocityAcceleration(candles);
  const velocityTrend = velocityAcceleration > 5 ? "ACCELERATING" as const :
                        velocityAcceleration < -5 ? "DECELERATING" as const : "STEADY" as const;

  const bodyDominance = calcBodyDominance(lastCandle);
  const avgBodyDominance = recent5.reduce((s, c) => s + calcBodyDominance(c), 0) / 5;
  const prevAvgBodyDominance = candles.slice(-10, -5).reduce((s, c) => s + calcBodyDominance(c), 0) / 5;
  const bodyDominanceTrend = avgBodyDominance > prevAvgBodyDominance + 0.05 ? "INCREASING" as const :
                             avgBodyDominance < prevAvgBodyDominance - 0.05 ? "DECREASING" as const : "STABLE" as const;

  const consecutiveImpulse = calcConsecutiveImpulse(candles, atrAverage);
  const stackingStrength = Math.min(consecutiveImpulse * 25, 100);
  const isStacking = consecutiveImpulse >= 2;

  const compression = detectCompression(candles, atrAverage);
  const direction = detectDirection(candles);
  const directionStrength = calcDirectionStrength(candles, atrAverage);

  // Phase detection
  const phase = detectPhase(candles, atrCurrent, atrAverage, velocity, consecutiveImpulse, compression, bodyDominance);
  const phaseConfidence = calcPhaseConfidence(phase, candles, atrAcceleration, consecutiveImpulse, compression);

  // Continuation probability
  const { probability: continuationProbability, factors: continuationFactors } =
    calcContinuationProbability(candles, phase, direction, isATRExpanding, isStacking, compression);

  // Warnings
  const warnings = detectWarnings(candles, phase, velocity, bodyDominance, atrAcceleration, consecutiveImpulse);

  // Entry quality
  const { quality: entryQuality, reason: entryReason } =
    assessEntryQuality(phase, continuationProbability, direction, isATRExpanding, consecutiveImpulse);

  // Narrative
  const narrative = generateMomentumNarrative(phase, direction, velocity, atrAcceleration, consecutiveImpulse, compression, continuationProbability, lastCandle);

  const phaseDescription = getPhaseDescription(phase);

  return {
    phase,
    phaseConfidence,
    phaseDescription,
    direction,
    directionStrength,
    candleVelocity: velocity,
    velocityAcceleration,
    velocityTrend,
    atrCurrent,
    atrAverage,
    atrAcceleration,
    isATRExpanding,
    bodyDominance,
    avgBodyDominance,
    bodyDominanceTrend,
    consecutiveImpulse,
    stackingStrength,
    isStacking,
    compressionBars: compression.bars,
    compressionTightness: compression.tightness,
    expansionImminent: compression.expansionImminent,
    continuationProbability,
    continuationFactors,
    warnings,
    narrative,
    entryQuality,
    entryReason,
  };
}

// ================================================
// PHASE DETECTION
// ================================================

function detectPhase(
  candles: Candle[],
  atrCurrent: number,
  atrAverage: number,
  velocity: number,
  consecutiveImpulse: number,
  compression: { bars: number; tightness: number; expansionImminent: boolean },
  bodyDominance: number
): MomentumPhase {
  // COMPRESSION: Low volatility, tight range, building energy
  if (compression.tightness > 60 && velocity < 0.5 && !compression.expansionImminent) {
    return "COMPRESSION";
  }

  // IGNITION: First displacement after compression OR sudden velocity spike
  if (
    (compression.expansionImminent && velocity > 1.0) ||
    (velocity > 1.3 && consecutiveImpulse === 1 && atrCurrent > atrAverage * 1.3)
  ) {
    return "IGNITION";
  }

  // ACCELERATION: Multiple consecutive impulse candles, ATR expanding
  if (consecutiveImpulse >= 2 && atrCurrent > atrAverage * 1.2 && bodyDominance > 0.5) {
    return "ACCELERATION";
  }

  // CLIMAX: Overextended (5+ impulse candles) OR velocity extremely high
  if (consecutiveImpulse >= 5 || (velocity > 3.0 && consecutiveImpulse >= 3)) {
    return "CLIMAX";
  }

  // EXHAUSTION: Velocity dropping after impulse, body dominance falling
  if (consecutiveImpulse >= 3 && velocity < 0.5 && bodyDominance < 0.35) {
    return "EXHAUSTION";
  }

  // Default: check if we're in early ignition
  if (velocity > 0.8 && bodyDominance > 0.5 && atrCurrent > atrAverage) {
    return "IGNITION";
  }

  return "COMPRESSION";
}

function calcPhaseConfidence(
  phase: MomentumPhase,
  candles: Candle[],
  atrAcceleration: number,
  consecutiveImpulse: number,
  compression: { bars: number; tightness: number; expansionImminent: boolean }
): number {
  switch (phase) {
    case "COMPRESSION":
      return Math.min(compression.tightness + 20, 95);
    case "IGNITION":
      return Math.min(60 + atrAcceleration * 0.5 + consecutiveImpulse * 10, 90);
    case "ACCELERATION":
      return Math.min(70 + consecutiveImpulse * 8, 95);
    case "CLIMAX":
      return Math.min(75 + consecutiveImpulse * 5, 95);
    case "EXHAUSTION":
      return 70;
    default:
      return 50;
  }
}

// ================================================
// CONTINUATION PROBABILITY
// ================================================

function calcContinuationProbability(
  candles: Candle[],
  phase: MomentumPhase,
  direction: SignalDirection,
  isATRExpanding: boolean,
  isStacking: boolean,
  compression: { bars: number; tightness: number; expansionImminent: boolean }
): { probability: number; factors: string[] } {
  let prob = 50;
  const factors: string[] = [];

  // Phase-based base probability
  if (phase === "IGNITION") { prob = 72; factors.push("Ignition phase — high continuation"); }
  else if (phase === "ACCELERATION") { prob = 80; factors.push("Acceleration — strong continuation"); }
  else if (phase === "CLIMAX") { prob = 35; factors.push("Climax — exhaustion likely"); }
  else if (phase === "EXHAUSTION") { prob = 20; factors.push("Exhaustion — reversal probable"); }
  else if (phase === "COMPRESSION") { prob = 55; factors.push("Compression — breakout pending"); }

  // ATR expanding = momentum continuing
  if (isATRExpanding && phase !== "EXHAUSTION") {
    prob += 10;
    factors.push("ATR expanding — volatility increasing");
  }

  // Stacking = strong continuation
  if (isStacking) {
    prob += 8;
    factors.push("Momentum stacking — consecutive impulse candles");
  }

  // Last candle closed near extreme (strong close)
  const last = candles[candles.length - 1];
  const range = last.high - last.low;
  if (range > 0) {
    const closePosition = direction === "BUY"
      ? (last.close - last.low) / range
      : (last.high - last.close) / range;
    if (closePosition > 0.75) {
      prob += 8;
      factors.push("Strong close near extreme — buyers/sellers in control");
    }
  }

  // Kill zone bonus
  const hour = new Date().getUTCHours();
  if ((hour >= 7 && hour <= 10) || (hour >= 12 && hour <= 15)) {
    prob += 5;
    factors.push("Kill zone active — institutional participation");
  }

  return { probability: Math.min(Math.max(prob, 5), 98), factors };
}

// ================================================
// WARNING SYSTEM
// ================================================

function detectWarnings(
  candles: Candle[],
  phase: MomentumPhase,
  velocity: number,
  bodyDominance: number,
  atrAcceleration: number,
  consecutiveImpulse: number
): MomentumWarning[] {
  const warnings: MomentumWarning[] = [];

  if (phase === "EXHAUSTION") {
    warnings.push({
      type: "EXHAUSTION",
      severity: "HIGH",
      message: "⚠️ Momentum exhaustion — candles weakening, avoid new entries. Take profits.",
    });
  }

  if (phase === "CLIMAX" && consecutiveImpulse >= 5) {
    warnings.push({
      type: "RETAIL_TRAP",
      severity: "HIGH",
      message: "🚨 Climax phase — retail FOMO entering. Smart money may reverse. Don't chase.",
    });
  }

  if (velocity < 0.3 && bodyDominance < 0.3) {
    warnings.push({
      type: "VOLATILITY_DYING",
      severity: "MEDIUM",
      message: "⚠️ Volatility dying — small candles, no momentum. Wait for ignition.",
    });
  }

  if (bodyDominance < 0.35 && velocity > 0.8) {
    warnings.push({
      type: "WEAK_DISPLACEMENT",
      severity: "MEDIUM",
      message: "⚠️ Weak displacement — large wicks suggest rejection. Fakeout possible.",
    });
  }

  if (atrAcceleration < -20 && phase !== "COMPRESSION") {
    warnings.push({
      type: "VOLATILITY_DYING",
      severity: "LOW",
      message: "ATR contracting — momentum fading. Tighten stops or exit.",
    });
  }

  if (phase === "COMPRESSION" && consecutiveImpulse === 0) {
    warnings.push({
      type: "RANGING",
      severity: "LOW",
      message: "Market ranging — no directional momentum. Wait for breakout.",
    });
  }

  return warnings;
}

// ================================================
// ENTRY QUALITY ASSESSMENT
// ================================================

function assessEntryQuality(
  phase: MomentumPhase,
  continuationProb: number,
  direction: SignalDirection,
  isATRExpanding: boolean,
  consecutiveImpulse: number
): { quality: "PRIME" | "GOOD" | "ACCEPTABLE" | "LATE" | "AVOID"; reason: string } {
  if (phase === "IGNITION" && continuationProb > 70 && isATRExpanding) {
    return { quality: "PRIME", reason: "🎯 PRIME ENTRY — Ignition phase with expanding ATR. Enter NOW before acceleration." };
  }

  if (phase === "IGNITION" && continuationProb > 60) {
    return { quality: "GOOD", reason: "✅ Good entry — Momentum igniting. Enter on candle close with tight stop." };
  }

  if (phase === "ACCELERATION" && consecutiveImpulse <= 3) {
    return { quality: "GOOD", reason: "✅ Acceleration entry — Ride the wave. Enter on pullback to FVG." };
  }

  if (phase === "ACCELERATION" && consecutiveImpulse > 3) {
    return { quality: "LATE", reason: "⚠️ Late entry — Move already extended. Reduce size or wait for pullback." };
  }

  if (phase === "COMPRESSION" && continuationProb > 55) {
    return { quality: "ACCEPTABLE", reason: "⏳ Acceptable — Compression building. Enter on breakout confirmation." };
  }

  if (phase === "CLIMAX" || phase === "EXHAUSTION") {
    return { quality: "AVOID", reason: "🚫 AVOID — Momentum exhausted. Wait for new compression cycle." };
  }

  return { quality: "ACCEPTABLE", reason: "Conditions developing. Wait for clearer ignition signal." };
}

// ================================================
// NARRATIVE GENERATION
// ================================================

function generateMomentumNarrative(
  phase: MomentumPhase,
  direction: SignalDirection,
  velocity: number,
  atrAcceleration: number,
  consecutiveImpulse: number,
  compression: { bars: number; tightness: number; expansionImminent: boolean },
  continuationProb: number,
  lastCandle: Candle
): string {
  const dir = direction === "BUY" ? "bullish" : direction === "SELL" ? "bearish" : "neutral";
  const price = lastCandle.close.toFixed(2);

  switch (phase) {
    case "COMPRESSION":
      if (compression.expansionImminent) {
        return `XAUUSD at ${price} — ${compression.bars} bars of compression (tightness: ${compression.tightness.toFixed(0)}%). Volatility expansion IMMINENT. Prepare for explosive breakout. Watch for first displacement candle to confirm direction.`;
      }
      return `XAUUSD at ${price} — Market in compression phase. Volatility building, liquidity accumulating. ${compression.bars} bars of tight range. Wait for ignition — the longer the compression, the more explosive the breakout.`;

    case "IGNITION":
      return `⚡ XAUUSD at ${price} — MOMENTUM IGNITION detected! First ${dir} displacement candle with ${(velocity).toFixed(1)}x ATR velocity. ATR accelerating ${atrAcceleration > 0 ? "+" : ""}${atrAcceleration.toFixed(0)}%. This is the START of the move — enter NOW before acceleration phase. Continuation probability: ${continuationProb.toFixed(0)}%.`;

    case "ACCELERATION":
      return `🔥 XAUUSD at ${price} — ACCELERATION PHASE. ${consecutiveImpulse} consecutive ${dir} impulse candles. ATR expanding ${atrAcceleration > 0 ? "+" : ""}${atrAcceleration.toFixed(0)}%. Institutional aggression confirmed. Ride the momentum — trail stop behind last impulse candle low. Continuation: ${continuationProb.toFixed(0)}%.`;

    case "CLIMAX":
      return `🚨 XAUUSD at ${price} — CLIMAX PHASE. ${consecutiveImpulse} impulse candles — move is overextended. Retail FOMO likely entering now. Smart money may start taking profits. Do NOT enter new positions. Consider partial close. Reversal risk increasing.`;

    case "EXHAUSTION":
      return `⚠️ XAUUSD at ${price} — EXHAUSTION detected. Momentum fading — candle bodies shrinking, wicks growing. The move is done. Close remaining positions. Wait for new compression → ignition cycle before re-entering.`;

    default:
      return `XAUUSD at ${price} — Analyzing momentum conditions...`;
  }
}

// ================================================
// HELPER FUNCTIONS
// ================================================

function calcATR(candles: Candle[]): number {
  if (candles.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    sum += tr;
  }
  return sum / (candles.length - 1);
}

function calcVelocity(candles: Candle[]): number {
  if (candles.length < 8) return 0;
  const atr = calcATR(candles.slice(-14));
  const last = candles[candles.length - 1];
  const body = Math.abs(last.close - last.open);
  return atr > 0 ? body / atr : 0;
}

function calcVelocityAcceleration(candles: Candle[]): number {
  if (candles.length < 10) return 0;
  const atr = calcATR(candles.slice(-14));
  if (atr === 0) return 0;

  const recent3 = candles.slice(-3).map(c => Math.abs(c.close - c.open) / atr);
  const prev3 = candles.slice(-6, -3).map(c => Math.abs(c.close - c.open) / atr);

  const avgRecent = recent3.reduce((s, v) => s + v, 0) / 3;
  const avgPrev = prev3.reduce((s, v) => s + v, 0) / 3;

  return avgPrev > 0 ? ((avgRecent - avgPrev) / avgPrev) * 100 : 0;
}

function calcBodyDominance(candle: Candle): number {
  const range = candle.high - candle.low;
  if (range === 0) return 0;
  return Math.abs(candle.close - candle.open) / range;
}

function calcConsecutiveImpulse(candles: Candle[], atr: number): number {
  let count = 0;
  for (let i = candles.length - 1; i >= Math.max(0, candles.length - 10); i--) {
    const body = Math.abs(candles[i].close - candles[i].open);
    const range = candles[i].high - candles[i].low;
    const bodyRatio = range > 0 ? body / range : 0;

    // An "impulse" candle: body > 0.8x ATR AND body dominance > 50%
    if (body > atr * 0.8 && bodyRatio > 0.5) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function detectCompression(candles: Candle[], atr: number): { bars: number; tightness: number; expansionImminent: boolean } {
  let bars = 0;
  const threshold = atr * 0.6; // Candles smaller than 60% of ATR = compression

  for (let i = candles.length - 1; i >= Math.max(0, candles.length - 20); i--) {
    const range = candles[i].high - candles[i].low;
    if (range < threshold) {
      bars++;
    } else {
      break;
    }
  }

  // Tightness: how much smaller are compression candles vs ATR
  const compressionRanges = candles.slice(-Math.max(bars, 1)).map(c => c.high - c.low);
  const avgCompressionRange = compressionRanges.reduce((s, r) => s + r, 0) / compressionRanges.length;
  const tightness = atr > 0 ? Math.max(0, (1 - avgCompressionRange / atr) * 100) : 0;

  // Expansion imminent if 5+ bars of compression
  const expansionImminent = bars >= 5 && tightness > 50;

  return { bars, tightness, expansionImminent };
}

function detectDirection(candles: Candle[]): SignalDirection {
  const recent = candles.slice(-5);
  let bullish = 0;
  let bearish = 0;
  for (const c of recent) {
    if (c.close > c.open) bullish++;
    else bearish++;
  }
  if (bullish >= 3) return "BUY";
  if (bearish >= 3) return "SELL";
  return "WAIT";
}

function calcDirectionStrength(candles: Candle[], atr: number): number {
  const recent = candles.slice(-5);
  let totalMove = 0;
  for (const c of recent) {
    totalMove += c.close - c.open; // Signed
  }
  return atr > 0 ? Math.min(Math.abs(totalMove) / (atr * 3) * 100, 100) : 0;
}

function getPhaseDescription(phase: MomentumPhase): string {
  switch (phase) {
    case "COMPRESSION": return "Volatility low — liquidity building, market preparing for expansion";
    case "IGNITION": return "First displacement — momentum awakening, ENTER EARLY";
    case "ACCELERATION": return "Consecutive displacement — aggressive continuation, ride the wave";
    case "CLIMAX": return "Overextended — retail FOMO entering, smart money exiting";
    case "EXHAUSTION": return "Weakening candles — failed continuation, reversal risk HIGH";
  }
}

function getDefaultMomentum(): MomentumAnalysisAdvanced {
  return {
    phase: "COMPRESSION",
    phaseConfidence: 50,
    phaseDescription: "Insufficient data for momentum analysis",
    direction: "WAIT",
    directionStrength: 0,
    candleVelocity: 0,
    velocityAcceleration: 0,
    velocityTrend: "STEADY",
    atrCurrent: 0,
    atrAverage: 0,
    atrAcceleration: 0,
    isATRExpanding: false,
    bodyDominance: 0,
    avgBodyDominance: 0,
    bodyDominanceTrend: "STABLE",
    consecutiveImpulse: 0,
    stackingStrength: 0,
    isStacking: false,
    compressionBars: 0,
    compressionTightness: 0,
    expansionImminent: false,
    continuationProbability: 50,
    continuationFactors: [],
    warnings: [],
    narrative: "Waiting for data...",
    entryQuality: "AVOID",
    entryReason: "Insufficient data",
  };
}
