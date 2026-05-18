"use client";

import { useTradingStore } from "@/store";
import { Badge } from "@/components/ui";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function VolatilityMeter() {
  const { marketData } = useTradingStore();

  if (!marketData || marketData.candles.length < 10) {
    return (
      <div className="card-elite rounded-xl border border-[#252532] bg-[#111118] p-3">
        <div className="h-12 flex items-center justify-center">
          <span className="text-zinc-500 text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  // Calculate volatility from recent candles
  const recent = marketData.candles.slice(-14);
  const ranges = recent.map((c) => c.high - c.low);
  const avgRange = ranges.reduce((s, r) => s + r, 0) / ranges.length;
  const lastRange = ranges[ranges.length - 1];
  const volatilityRatio = lastRange / avgRange;

  // Determine level
  let level: "DEAD" | "LOW" | "NORMAL" | "HIGH" | "EXTREME";
  let color: string;
  let barCount: number;

  if (volatilityRatio < 0.5) {
    level = "DEAD";
    color = "text-zinc-500";
    barCount = 1;
  } else if (volatilityRatio < 0.8) {
    level = "LOW";
    color = "text-blue-400";
    barCount = 2;
  } else if (volatilityRatio < 1.5) {
    level = "NORMAL";
    color = "text-cyan-400";
    barCount = 3;
  } else if (volatilityRatio < 2.5) {
    level = "HIGH";
    color = "text-amber-400";
    barCount = 4;
  } else {
    level = "EXTREME";
    color = "text-red-400";
    barCount = 5;
  }

  return (
    <div className="card-elite rounded-xl border border-[#252532] bg-[#111118] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className={cn("h-4 w-4", color, level === "EXTREME" && "animate-volatility")} />
          <span className="text-xs font-medium text-zinc-400">Volatility</span>
        </div>
        <Badge variant={level === "HIGH" || level === "EXTREME" ? "danger" : level === "NORMAL" ? "info" : "default"}>
          {level}
        </Badge>
      </div>

      {/* Volatility bars */}
      <div className="flex items-end gap-1 h-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "w-2 rounded-sm transition-all duration-300",
              i <= barCount ? (
                level === "EXTREME" ? "bg-red-500 animate-pulse" :
                level === "HIGH" ? "bg-amber-500" :
                level === "NORMAL" ? "bg-cyan-500" :
                level === "LOW" ? "bg-blue-500" : "bg-zinc-600"
              ) : "bg-[#16161f]"
            )}
            style={{ height: `${i * 20}%` }}
          />
        ))}
        <span className={cn("text-xs font-mono ml-2", color)}>
          {volatilityRatio.toFixed(2)}x
        </span>
      </div>
    </div>
  );
}
