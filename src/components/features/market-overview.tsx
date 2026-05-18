"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { Activity, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function MarketOverview() {
  const { marketData, signal, smc, selectedPair } = useTradingStore();

  if (!marketData) {
    return (
      <Card className="animate-pulse">
        <div className="h-32 flex items-center justify-center">
          <span className="text-zinc-500 text-sm">Loading market data...</span>
        </div>
      </Card>
    );
  }

  const priceChange = marketData.candles.length > 1
    ? marketData.currentPrice - marketData.candles[marketData.candles.length - 2].close
    : 0;
  const priceChangePercent = marketData.candles.length > 1
    ? (priceChange / marketData.candles[marketData.candles.length - 2].close) * 100
    : 0;

  const metrics = [
    {
      label: "Price",
      value: formatPrice(marketData.currentPrice, selectedPair),
      change: priceChange,
    },
    {
      label: "Spread",
      value: `${marketData.spread.toFixed(1)} pips`,
      change: null,
    },
    {
      label: "SMC Confluence",
      value: `${smc?.confluenceScore ?? 0}/100`,
      change: null,
    },
    {
      label: "Bias",
      value: smc?.institutionalBias ?? "—",
      change: null,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <CardTitle>Market Overview</CardTitle>
        </div>
        <Badge variant={priceChange >= 0 ? "success" : "danger"}>
          {priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(3)}%
        </Badge>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg bg-[#16161f] p-2.5">
            <p className="text-xs text-zinc-500 mb-0.5">{metric.label}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-mono font-semibold text-zinc-200">
                {metric.value}
              </span>
              {metric.change !== null && (
                metric.change > 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                ) : metric.change < 0 ? (
                  <ArrowDownRight className="h-3 w-3 text-red-400" />
                ) : (
                  <Minus className="h-3 w-3 text-zinc-500" />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
