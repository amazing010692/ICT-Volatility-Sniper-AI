"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge, Progress } from "@/components/ui";
import { cn, formatPrice } from "@/lib/utils";
import { Target, TrendingUp, TrendingDown, Pause, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SignalCard() {
  const { signal, selectedPair } = useTradingStore();

  if (!signal) {
    return (
      <Card className="animate-pulse">
        <div className="h-48 flex items-center justify-center">
          <span className="text-zinc-500 text-sm">Scanning for signals...</span>
        </div>
      </Card>
    );
  }

  const directionConfig = {
    BUY: {
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      glow: "glow-buy" as const,
      label: "LONG",
    },
    SELL: {
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      glow: "glow-sell" as const,
      label: "SHORT",
    },
    WAIT: {
      icon: Pause,
      color: "text-zinc-400",
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/30",
      glow: "glow-gold" as const,
      label: "WAIT",
    },
  };

  const config = directionConfig[signal.direction];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={signal.direction + signal.timestamp}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          glow={signal.direction === "BUY" ? "buy" : signal.direction === "SELL" ? "sell" : "none"}
          className={cn(
            signal.direction !== "WAIT" && "animate-sniper-lock"
          )}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              <CardTitle>Signal — {selectedPair}</CardTitle>
            </div>
            <Badge
              variant={signal.tradeQuality === "A+" || signal.tradeQuality === "A" ? "success" : signal.tradeQuality === "B" ? "warning" : "default"}
            >
              {signal.tradeQuality}
            </Badge>
          </CardHeader>

          {/* Direction & Confidence */}
          <div className="flex items-center justify-between mb-4">
            <div className={cn("flex items-center gap-3 px-4 py-2 rounded-lg border", config.bg, config.border)}>
              <Icon className={cn("h-6 w-6", config.color)} />
              <span className={cn("text-2xl font-bold", config.color)}>
                {config.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-zinc-100">
                {signal.confidence.toFixed(0)}%
              </p>
              <p className="text-xs text-zinc-500">Confidence</p>
            </div>
          </div>

          {/* Confidence bar */}
          <Progress
            value={signal.confidence}
            variant={signal.confidence > 75 ? "success" : signal.confidence > 55 ? "warning" : "danger"}
            size="md"
            className="mb-4"
          />

          {/* Entry levels */}
          {signal.direction !== "WAIT" && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-[#16161f] p-2.5">
                <p className="text-xs text-zinc-500 mb-0.5">Entry</p>
                <p className="text-sm font-mono font-semibold text-zinc-200">
                  {formatPrice(signal.entry, selectedPair)}
                </p>
              </div>
              <div className="rounded-lg bg-[#16161f] p-2.5">
                <p className="text-xs text-zinc-500 mb-0.5">Stop Loss</p>
                <p className="text-sm font-mono font-semibold text-red-400">
                  {formatPrice(signal.stopLoss, selectedPair)}
                </p>
              </div>
              <div className="rounded-lg bg-[#16161f] p-2.5">
                <p className="text-xs text-zinc-500 mb-0.5">TP1 (2R)</p>
                <p className="text-sm font-mono font-semibold text-emerald-400">
                  {formatPrice(signal.takeProfit1, selectedPair)}
                </p>
              </div>
              <div className="rounded-lg bg-[#16161f] p-2.5">
                <p className="text-xs text-zinc-500 mb-0.5">TP2 (3.5R)</p>
                <p className="text-sm font-mono font-semibold text-emerald-400">
                  {formatPrice(signal.takeProfit2, selectedPair)}
                </p>
              </div>
            </div>
          )}

          {/* Risk/Reward */}
          {signal.direction !== "WAIT" && (
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs text-zinc-400">
                R:R {signal.riskRewardRatio.toFixed(1)} — Risk ${Math.abs(signal.entry - signal.stopLoss).toFixed(2)}/unit
              </span>
            </div>
          )}

          {/* Reasoning */}
          <div className="space-y-1.5">
            {signal.reasoning.slice(0, 3).map((reason, i) => (
              <p key={i} className="text-xs text-zinc-400 leading-relaxed">
                {reason}
              </p>
            ))}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
