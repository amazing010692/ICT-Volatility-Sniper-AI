"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Layers, AlertTriangle, Crosshair } from "lucide-react";

export function MTFPanel() {
  const { mtf } = useTradingStore();

  if (!mtf) {
    return (
      <Card>
        <div className="h-48 flex items-center justify-center">
          <span className="text-zinc-500 text-sm">Loading MTF analysis...</span>
        </div>
      </Card>
    );
  }

  const trendColor = (trend: string) => {
    if (trend === "BULLISH") return "text-emerald-400";
    if (trend === "BEARISH") return "text-red-400";
    return "text-zinc-400";
  };

  const trendBg = (trend: string) => {
    if (trend === "BULLISH") return "bg-emerald-500/10";
    if (trend === "BEARISH") return "bg-red-500/10";
    return "bg-zinc-500/10";
  };

  const timeframes = [
    { label: "H1", data: mtf.h1 },
    { label: "M15", data: mtf.m15 },
    { label: "M5", data: mtf.m5 },
    { label: "M1", data: mtf.m1 },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <CardTitle>Multi-Timeframe</CardTitle>
        </div>
        <Badge variant={mtf.confluenceScore > 70 ? "success" : mtf.confluenceScore > 50 ? "warning" : "default"}>
          {mtf.confluenceScore}% Confluence
        </Badge>
      </CardHeader>

      {/* Overall Bias */}
      <div className={cn("rounded-lg p-3 mb-3", trendBg(mtf.overallBias))}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Overall Bias</span>
          <span className={cn("text-sm font-bold", trendColor(mtf.overallBias))}>
            {mtf.overallBias}
          </span>
        </div>
        {mtf.topDownConfirmation && (
          <p className="text-xs text-emerald-400 mt-1">✓ Top-down confirmation</p>
        )}
      </div>

      {/* Timeframe Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {timeframes.map((tf) => (
          <div key={tf.label} className="rounded-lg bg-[#16161f] p-2 text-center">
            <p className="text-xs text-zinc-500 mb-1">{tf.label}</p>
            <p className={cn("text-xs font-bold", trendColor(tf.data.trend))}>
              {tf.data.trend === "BULLISH" ? "↑" : tf.data.trend === "BEARISH" ? "↓" : "—"}
            </p>
            <Progress
              value={tf.data.strength}
              variant={tf.data.trend === "BULLISH" ? "success" : tf.data.trend === "BEARISH" ? "danger" : "default"}
              size="sm"
              className="mt-1"
            />
          </div>
        ))}
      </div>

      {/* Alerts */}
      {mtf.retailTrapDetected && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/20 p-2.5 mb-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          <span className="text-xs text-red-400">
            Retail Trap: {mtf.retailTrapDirection} — LTF diverging from HTF
          </span>
        </div>
      )}

      {mtf.scalpOpportunity && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
          <Crosshair className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            Scalp Opportunity: {mtf.scalpDirection} — M5/M1 aligned
          </span>
        </div>
      )}
    </Card>
  );
}
