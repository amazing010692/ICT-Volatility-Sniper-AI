"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { cn, formatPrice } from "@/lib/utils";
import { Droplets } from "lucide-react";

export function LiquidityHeatmap() {
  const { smc, marketData, selectedPair } = useTradingStore();

  if (!smc || !marketData) {
    return (
      <Card>
        <div className="h-32 flex items-center justify-center">
          <span className="text-zinc-500 text-sm">Mapping liquidity...</span>
        </div>
      </Card>
    );
  }

  const currentPrice = marketData.currentPrice;

  // Combine OBs and FVGs into liquidity zones
  const zones = [
    ...smc.orderBlocks.map((ob) => ({
      type: ob.type,
      level: (ob.high + ob.low) / 2,
      strength: ob.strength,
      label: `${ob.type} OB`,
    })),
    ...smc.fairValueGaps.map((fvg) => ({
      type: fvg.type,
      level: (fvg.high + fvg.low) / 2,
      strength: fvg.size / currentPrice * 1000,
      label: `${fvg.type} FVG`,
    })),
  ].sort((a, b) => b.level - a.level);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-400" />
          <CardTitle>Liquidity Map</CardTitle>
        </div>
        <Badge variant="info">{zones.length} zones</Badge>
      </CardHeader>

      {zones.length > 0 ? (
        <div className="space-y-1.5">
          {zones.slice(0, 6).map((zone, i) => {
            const isAbove = zone.level > currentPrice;
            const distance = Math.abs(zone.level - currentPrice);

            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-lg p-2",
                  zone.type === "BULLISH" ? "bg-emerald-500/5" : "bg-red-500/5"
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-6 rounded-full",
                    zone.type === "BULLISH" ? "bg-emerald-500" : "bg-red-500"
                  )}
                  style={{ opacity: Math.max(zone.strength, 0.3) }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">
                      {formatPrice(zone.level, selectedPair)}
                    </span>
                    <span className={cn(
                      "text-xs",
                      isAbove ? "text-red-400" : "text-emerald-400"
                    )}>
                      {isAbove ? "↑" : "↓"} ${distance.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">{zone.label}</span>
                </div>
              </div>
            );
          })}

          {/* Current price marker */}
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-2">
            <div className="w-1.5 h-6 rounded-full bg-amber-500 animate-pulse" />
            <div className="flex-1">
              <span className="text-xs font-bold text-amber-400">
                PRICE: {formatPrice(currentPrice, selectedPair)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 text-center py-4">
          No significant liquidity zones detected
        </p>
      )}
    </Card>
  );
}
