"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Zap, TrendingUp, TrendingDown, Target, Shield } from "lucide-react";

// ================================================
// Displacement Detector — DETAILED with specific prices
// Shows exact candle OHLC, body size, ATR ratio,
// nearest OB/FVG levels, and entry zones
// ================================================

export function DisplacementDetector() {
  const { smc, marketData, signal } = useTradingStore();

  if (!smc || !marketData || marketData.candles.length < 10) {
    return (
      <Card>
        <div className="h-24 flex items-center justify-center">
          <span className="text-zinc-500 text-sm">Scanning for displacement...</span>
        </div>
      </Card>
    );
  }

  const candles = marketData.candles;
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];

  // Calculate displacement metrics from the last candle
  const body = Math.abs(lastCandle.close - lastCandle.open);
  const range = lastCandle.high - lastCandle.low;
  const bodyRatio = range > 0 ? body / range : 0;

  // ATR calculation (last 7 candles)
  const recentRanges = candles.slice(-7).map(c => c.high - c.low);
  const atr = recentRanges.reduce((s, r) => s + r, 0) / recentRanges.length;
  const bodyToATR = atr > 0 ? body / atr : 0;

  // Average body for comparison
  const recentBodies = candles.slice(-10).map(c => Math.abs(c.close - c.open));
  const avgBody = recentBodies.reduce((s, b) => s + b, 0) / recentBodies.length;
  const bodyMultiple = avgBody > 0 ? body / avgBody : 0;

  const isBullish = lastCandle.close > lastCandle.open;
  const isDisplacement = smc.displacement;

  // Find nearest OB and FVG for context
  const currentPrice = lastCandle.close;
  const nearestOBAbove = smc.orderBlocks.find(ob => ob.low > currentPrice);
  const nearestOBBelow = [...smc.orderBlocks].reverse().find(ob => ob.high < currentPrice);
  const nearestFVG = smc.fairValueGaps.length > 0 ? smc.fairValueGaps[smc.fairValueGaps.length - 1] : null;

  return (
    <Card className={cn(isDisplacement && "border-amber-500/30 animate-displacement")}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className={cn("h-4 w-4", isDisplacement ? "text-amber-400 animate-pulse" : "text-zinc-500")} />
          <CardTitle>Displacement</CardTitle>
        </div>
        <Badge variant={isDisplacement ? "warning" : "default"} pulse={isDisplacement}>
          {isDisplacement ? "ACTIVE" : "SCANNING"}
        </Badge>
      </CardHeader>

      {isDisplacement ? (
        <div className="space-y-2.5">
          {/* Displacement Alert */}
          <div className={cn(
            "rounded-lg p-3 border",
            smc.displacementDirection === "BULLISH"
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-red-500/5 border-red-500/20"
          )}>
            <div className="flex items-center gap-2 mb-1.5">
              {smc.displacementDirection === "BULLISH" ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <p className={cn(
                "text-sm font-bold",
                smc.displacementDirection === "BULLISH" ? "text-emerald-400" : "text-red-400"
              )}>
                {smc.displacementDirection} DISPLACEMENT
              </p>
            </div>
            <p className="text-[11px] text-zinc-400">
              Institutional aggression at <span className="text-zinc-200 font-mono font-bold">{currentPrice.toFixed(2)}</span>.
              Body: <span className="text-amber-400 font-mono">{body.toFixed(2)}</span> ({bodyToATR.toFixed(1)}x ATR) •
              Dominance: <span className="text-amber-400">{(bodyRatio * 100).toFixed(0)}%</span> •
              {bodyMultiple.toFixed(1)}x avg body
            </p>
          </div>

          {/* Candle OHLC Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            <PriceBox label="Open" value={lastCandle.open.toFixed(2)} color="text-zinc-300" />
            <PriceBox label="High" value={lastCandle.high.toFixed(2)} color="text-emerald-400" />
            <PriceBox label="Low" value={lastCandle.low.toFixed(2)} color="text-red-400" />
            <PriceBox label="Close" value={lastCandle.close.toFixed(2)} color={isBullish ? "text-emerald-400" : "text-red-400"} />
          </div>

          {/* Displacement Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            <PriceBox label="Body Size" value={`$${body.toFixed(2)}`} color="text-amber-400" />
            <PriceBox label="Range" value={`$${range.toFixed(2)}`} color="text-cyan-400" />
            <PriceBox label="ATR (7)" value={`$${atr.toFixed(2)}`} color="text-zinc-300" />
          </div>

          {/* Nearby Levels */}
          <div className="rounded-lg bg-[#16161f] p-2.5 space-y-1.5 overflow-hidden">
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Key Levels</p>
            {nearestOBAbove && (
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-zinc-500 shrink-0">OB Above</span>
                <span className="font-mono text-red-400 truncate">{nearestOBAbove.low.toFixed(2)} - {nearestOBAbove.high.toFixed(2)}</span>
              </div>
            )}
            {nearestOBBelow && (
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-zinc-500 shrink-0">OB Below</span>
                <span className="font-mono text-emerald-400 truncate">{nearestOBBelow.low.toFixed(2)} - {nearestOBBelow.high.toFixed(2)}</span>
              </div>
            )}
            {nearestFVG && (
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-zinc-500 shrink-0">Nearest FVG</span>
                <span className="font-mono text-purple-400 truncate">{nearestFVG.low.toFixed(2)} - {nearestFVG.high.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Zone</span>
              <span className={cn("font-bold",
                smc.premiumDiscount === "DISCOUNT" ? "text-emerald-400" :
                smc.premiumDiscount === "PREMIUM" ? "text-red-400" : "text-zinc-400"
              )}>{smc.premiumDiscount}</span>
            </div>
          </div>

          {/* Entry Suggestion */}
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5">
            <p className="text-[10px] text-amber-300 font-bold mb-0.5">
              {smc.displacementDirection === "BULLISH" ? "🎯 BUY ZONE" : "🎯 SELL ZONE"}
            </p>
            <p className="text-[10px] text-zinc-400">
              {smc.displacementDirection === "BULLISH"
                ? `Entry: ${currentPrice.toFixed(2)} • SL below ${lastCandle.low.toFixed(2)} • Target: ${(currentPrice + body * 2).toFixed(2)}`
                : `Entry: ${currentPrice.toFixed(2)} • SL above ${lastCandle.high.toFixed(2)} • Target: ${(currentPrice - body * 2).toFixed(2)}`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* No displacement — show current candle analysis */}
          <div className="rounded-lg bg-[#16161f] p-2.5">
            <p className="text-[10px] text-zinc-500 mb-1.5">Last Candle Analysis</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-2">
              <PriceBox label="O" value={lastCandle.open.toFixed(2)} color="text-zinc-400" />
              <PriceBox label="H" value={lastCandle.high.toFixed(2)} color="text-zinc-400" />
              <PriceBox label="L" value={lastCandle.low.toFixed(2)} color="text-zinc-400" />
              <PriceBox label="C" value={lastCandle.close.toFixed(2)} color={isBullish ? "text-emerald-400" : "text-red-400"} />
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="text-zinc-500">Body: <span className="text-zinc-300 font-mono">${body.toFixed(2)}</span></span>
              <span className="text-zinc-500">ATR: <span className="text-zinc-300 font-mono">{bodyToATR.toFixed(2)}x</span></span>
              <span className="text-zinc-500">Dom: <span className="text-zinc-300">{(bodyRatio * 100).toFixed(0)}%</span></span>
            </div>
          </div>

          {/* What's needed for displacement */}
          <div className="text-[10px] text-zinc-600 space-y-0.5">
            <p>Waiting for displacement candle...</p>
            <p>Need: Body &gt; <span className="text-zinc-400 font-mono">${(atr * 1.3).toFixed(2)}</span> (1.3x ATR) with &gt;60% body dominance</p>
            <p>Current body: <span className={cn("font-mono", bodyToATR > 1 ? "text-amber-400" : "text-zinc-400")}>${body.toFixed(2)}</span> ({bodyToATR.toFixed(2)}x ATR)</p>
          </div>

          {/* SMC Context */}
          <div className="flex gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-[#16161f] text-zinc-400">OBs: {smc.orderBlocks.length}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#16161f] text-zinc-400">FVGs: {smc.fairValueGaps.length}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#16161f] text-zinc-400">Bias: {smc.institutionalBias}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function PriceBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded bg-[#0a0a0f] border border-[#252532] p-1.5 text-center min-w-0 overflow-hidden">
      <p className="text-[8px] text-zinc-600 uppercase truncate">{label}</p>
      <p className={cn("text-[11px] font-mono font-bold truncate", color)}>{value}</p>
    </div>
  );
}
