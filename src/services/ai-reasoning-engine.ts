// ================================================
// ICT Volatility Sniper AI — AI Reasoning Engine
// Generates institutional-grade commentary
// Market condition, insights, risk warnings, psychology
// ================================================

import type {
  TradingSignal,
  SMCAnalysis,
  MarketData,
  AIReasoning,
  TrendDirection,
} from "@/types";

/** Generate AI reasoning and institutional commentary */
export function generateAIReasoning(
  signal: TradingSignal,
  smc: SMCAnalysis,
  marketData: MarketData
): AIReasoning {
  const marketCondition = assessMarketCondition(signal, smc, marketData);
  const institutionalNarrative = buildNarrative(signal, smc, marketData);
  const insights = generateInsights(signal, smc, marketData);
  const riskWarnings = generateRiskWarnings(signal, smc, marketData);
  const psychologyTips = generatePsychologyTips(signal);
  const scoreBreakdown = calculateScoreBreakdown(signal, smc, marketData);
  const recommendation = buildRecommendation(signal, smc);
  const confidenceExplanation = explainConfidence(signal, smc);

  return {
    marketCondition,
    institutionalNarrative,
    insights,
    riskWarnings,
    psychologyTips,
    scoreBreakdown,
    recommendation,
    confidenceExplanation,
  };
}

/** Assess overall market condition */
function assessMarketCondition(
  signal: TradingSignal,
  smc: SMCAnalysis,
  marketData: MarketData
): string {
  if (smc.displacement) {
    return `DISPLACEMENT DETECTED — Institutional aggression in ${smc.displacementDirection} direction. Smart money is actively positioning. High-probability scalp window open.`;
  }

  if (smc.breakOfStructure) {
    return `STRUCTURE BREAK — Market has broken key structure level. New trend leg forming. Watch for pullback entry or continuation.`;
  }

  if (smc.confluenceScore > 60) {
    return `HIGH CONFLUENCE — Multiple SMC elements aligned (Score: ${smc.confluenceScore}/100). Institutional footprint visible. Premium setup forming.`;
  }

  if (signal.confidence > 75) {
    return `STRONG SIGNAL — ${signal.direction} bias with ${signal.confidence.toFixed(0)}% confidence. Multiple confirmations present. Execute with conviction.`;
  }

  if (signal.direction === "WAIT") {
    return `CONSOLIDATION — Market in accumulation/distribution phase. No clear institutional direction. Wait for displacement or BOS.`;
  }

  return `DEVELOPING — ${signal.direction} bias forming with moderate confidence. Monitor for additional confirmation before entry.`;
}

/** Build institutional narrative */
function buildNarrative(
  signal: TradingSignal,
  smc: SMCAnalysis,
  marketData: MarketData
): string {
  const price = marketData.currentPrice;
  const pair = marketData.pair;

  if (smc.displacement && smc.displacementDirection === "BULLISH") {
    return `Smart money has aggressively bid ${pair} at ${price.toFixed(2)}. The displacement candle indicates institutional buying pressure. Expect continuation toward the next liquidity pool above. Retail shorts are being hunted.`;
  }

  if (smc.displacement && smc.displacementDirection === "BEARISH") {
    return `Institutional selling pressure detected on ${pair} at ${price.toFixed(2)}. Displacement indicates smart money distribution. Expect continuation lower as retail longs get liquidated at the next support level.`;
  }

  if (smc.premiumDiscount === "DISCOUNT" && signal.direction === "BUY") {
    return `${pair} trading in discount zone at ${price.toFixed(2)}. Smart money accumulating at these levels. Order blocks below suggest institutional demand. Expect markup phase.`;
  }

  if (smc.premiumDiscount === "PREMIUM" && signal.direction === "SELL") {
    return `${pair} in premium zone at ${price.toFixed(2)}. Distribution likely as price reaches institutional supply. Bearish order blocks above confirm selling interest.`;
  }

  return `${pair} at ${price.toFixed(2)} — monitoring for institutional order flow. Current bias: ${signal.direction}. Confluence score: ${smc.confluenceScore}/100.`;
}

/** Generate actionable insights */
function generateInsights(
  signal: TradingSignal,
  smc: SMCAnalysis,
  marketData: MarketData
): string[] {
  const insights: string[] = [];

  // SMC-based insights
  if (smc.orderBlocks.length > 0) {
    const nearestOB = smc.orderBlocks[smc.orderBlocks.length - 1];
    insights.push(`Active ${nearestOB.type} Order Block at ${nearestOB.low.toFixed(2)}-${nearestOB.high.toFixed(2)} (Strength: ${(nearestOB.strength * 100).toFixed(0)}%)`);
  }

  if (smc.fairValueGaps.length > 0) {
    const nearestFVG = smc.fairValueGaps[smc.fairValueGaps.length - 1];
    insights.push(`Unfilled ${nearestFVG.type} FVG at ${nearestFVG.low.toFixed(2)}-${nearestFVG.high.toFixed(2)} — price likely to revisit`);
  }

  if (smc.changeOfCharacter) {
    insights.push("⚠️ Change of Character detected — potential trend reversal in progress");
  }

  if (smc.displacement) {
    insights.push(`⚡ Displacement ${smc.displacementDirection} — institutional aggression confirmed`);
  }

  // Signal-based insights
  if (signal.tradeQuality === "A+" || signal.tradeQuality === "A") {
    insights.push(`🎯 ${signal.tradeQuality} setup — high probability entry with ${signal.riskRewardRatio.toFixed(1)}R potential`);
  }

  if (signal.confidence > 80) {
    insights.push("Multiple confluences aligned — execute with full position size");
  }

  // Price action insights
  if (smc.premiumDiscount !== "EQUILIBRIUM") {
    insights.push(`Price in ${smc.premiumDiscount} zone — ${smc.premiumDiscount === "DISCOUNT" ? "look for longs" : "look for shorts"}`);
  }

  if (insights.length === 0) {
    insights.push("Scanning for institutional footprints...");
    insights.push("Monitor for displacement candles or liquidity sweeps");
  }

  return insights;
}

/** Generate risk warnings */
function generateRiskWarnings(
  signal: TradingSignal,
  smc: SMCAnalysis,
  marketData: MarketData
): string[] {
  const warnings: string[] = [];

  if (signal.confidence < 60 && signal.direction !== "WAIT") {
    warnings.push("Low confidence signal — reduce position size or wait for confirmation");
  }

  if (marketData.spread > 3) {
    warnings.push(`Wide spread (${marketData.spread.toFixed(1)} pips) — slippage risk elevated`);
  }

  if (smc.changeOfCharacter) {
    warnings.push("CHoCH detected — trend may be reversing, use tight stops");
  }

  if (signal.riskRewardRatio < 1.5) {
    warnings.push("R:R below 1.5 — consider waiting for better entry");
  }

  if (smc.orderBlocks.some((ob) => ob.type === (signal.direction === "BUY" ? "BEARISH" : "BULLISH"))) {
    warnings.push("Counter-trend order block nearby — potential reversal zone");
  }

  if (warnings.length === 0) {
    warnings.push("Standard risk parameters apply — maintain 1% max risk per trade");
  }

  return warnings;
}

/** Generate psychology tips based on signal state */
function generatePsychologyTips(signal: TradingSignal): string[] {
  const tips: string[] = [];

  if (signal.direction === "WAIT") {
    tips.push("Patience is a position. The best traders wait for A+ setups.");
    tips.push("No trade is better than a bad trade. Protect your capital.");
  } else if (signal.confidence > 80) {
    tips.push("High confidence — trust the system and execute without hesitation.");
    tips.push("Set your stops and walk away. Don't micromanage the trade.");
  } else if (signal.confidence > 60) {
    tips.push("Moderate setup — consider reduced position size.");
    tips.push("Have a clear invalidation level before entering.");
  } else {
    tips.push("Borderline signal — ask yourself: would you take this trade 100 times?");
    tips.push("If in doubt, stay out. There will always be another setup.");
  }

  return tips;
}

/** Calculate score breakdown */
function calculateScoreBreakdown(
  signal: TradingSignal,
  smc: SMCAnalysis,
  marketData: MarketData
): AIReasoning["scoreBreakdown"] {
  const structure = smc.breakOfStructure ? 85 : smc.changeOfCharacter ? 70 : 50;
  const momentum = smc.displacement ? 90 : signal.confidence > 70 ? 75 : 45;
  const liquidity = smc.orderBlocks.length > 0 ? 70 + smc.orderBlocks.length * 5 : 40;
  const timing = signal.tradeQuality === "A+" ? 95 : signal.tradeQuality === "A" ? 80 : signal.tradeQuality === "B" ? 65 : 40;
  const overall = (structure + momentum + liquidity + timing) / 4;

  return {
    structure: Math.min(structure, 100),
    momentum: Math.min(momentum, 100),
    liquidity: Math.min(liquidity, 100),
    timing: Math.min(timing, 100),
    overall: Math.min(overall, 100),
  };
}

/** Build final recommendation */
function buildRecommendation(signal: TradingSignal, smc: SMCAnalysis): string {
  if (signal.direction === "WAIT") {
    return "STAND ASIDE — No clear edge. Wait for displacement or structure break.";
  }

  if (signal.tradeQuality === "A+" || signal.tradeQuality === "A") {
    return `EXECUTE ${signal.direction} — ${signal.tradeQuality} setup at ${signal.entry.toFixed(2)}. SL: ${signal.stopLoss.toFixed(2)}, TP1: ${signal.takeProfit1.toFixed(2)}. Full size.`;
  }

  if (signal.tradeQuality === "B") {
    return `CONSIDER ${signal.direction} — B-grade setup. Reduced size recommended. Entry: ${signal.entry.toFixed(2)}, SL: ${signal.stopLoss.toFixed(2)}.`;
  }

  return `MONITOR — C-grade signal. Wait for additional confirmation or better entry.`;
}

/** Explain confidence level */
function explainConfidence(signal: TradingSignal, smc: SMCAnalysis): string {
  const factors: string[] = [];

  if (smc.displacement) factors.push("displacement detected (+20)");
  if (smc.breakOfStructure) factors.push("BOS confirmed (+15)");
  if (smc.orderBlocks.length > 0) factors.push(`${smc.orderBlocks.length} active OBs (+${smc.orderBlocks.length * 5})`);
  if (smc.fairValueGaps.length > 0) factors.push(`${smc.fairValueGaps.length} unfilled FVGs (+${smc.fairValueGaps.length * 3})`);
  if (smc.confluenceScore > 50) factors.push(`high confluence (${smc.confluenceScore}/100)`);

  if (factors.length === 0) {
    return `Confidence at ${signal.confidence.toFixed(0)}% — based on standard checklist scoring.`;
  }

  return `Confidence at ${signal.confidence.toFixed(0)}% — boosted by: ${factors.join(", ")}.`;
}
