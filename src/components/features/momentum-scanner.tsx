"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Gauge,
  Activity,
  Target,
  Flame,
} from "lucide-react";

// ================================================
// ICT Volatility Sniper AI — MOMENTUM SCANNER
//
// Advanced momentum phase detection & visualization:
// - Phase classification (Compression → Ignition → Acceleration → Climax → Exhaustion)
// - Velocity tracking & acceleration
// - ATR expansion detection
// - Continuation probability gauge
// - Entry quality assessment
// - Warning system
// - Institutional narrative
// ================================================

export function MomentumScanner() {
  const { momentum, marketData } = useTradingStore();

  if (!momentum || !marketData) {
    return (
      <Card>
        <div className="h-40 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-amber-400 animate-spin" />
            <span className="text-zinc-500 text-sm">Scanning momentum...</span>
          </div>
        </div>
      </Card>
    );
  }

  const phaseConfig = {
    COMPRESSION: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", icon: Activity, emoji: "🎯" },
    IGNITION: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: Zap, emoji: "⚡" },
    ACCELERATION: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: Flame, emoji: "🔥" },
    CLIMAX: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertTriangle, emoji: "🚨" },
    EXHAUSTION: { color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: TrendingDown, emoji: "⚠️" },
  };

  const config = phaseConfig[momentum.phase];
  const PhaseIcon = config.icon;

  const entryColors = {
    PRIME: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    GOOD: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    ACCEPTABLE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    LATE: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    AVOID: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <Card className={cn("border", config.border, momentum.phase === "IGNITION" && "animate-momentum")}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PhaseIcon className={cn("h-4 w-4", config.color)} />
          <CardTitle>Momentum Engine</CardTitle>
        </div>
        <Badge variant={momentum.phase === "IGNITION" || momentum.phase === "ACCELERATION" ? "success" : momentum.phase === "CLIMAX" || momentum.phase === "EXHAUSTION" ? "danger" : "warning"}>
          {config.emoji} {momentum.phase}
        </Badge>
      </CardHeader>

      {/* Phase & Entry Quality */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={cn("rounded-lg p-2.5 border", config.bg, config.border)}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Phase</p>
          <p className={cn("text-sm font-bold", config.color)}>{momentum.phase}</p>
          <p className="text-[9px] text-zinc-500 mt-0.5">{momentum.phaseDescription}</p>
        </div>
        <div className={cn("rounded-lg p-2.5 border", entryColors[momentum.entryQuality])}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Entry Quality</p>
          <p className="text-sm font-bold">{momentum.entryQuality}</p>
          <p className="text-[9px] text-zinc-500 mt-0.5">
            {momentum.entryQuality === "PRIME" ? "Enter NOW" :
             momentum.entryQuality === "GOOD" ? "Good entry" :
             momentum.entryQuality === "LATE" ? "Reduce size" : "Wait"}
          </p>
        </div>
      </div>

      {/* Continuation Probability */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Continuation Probability</span>
          <span className={cn("text-sm font-bold font-mono",
            momentum.continuationProbability > 70 ? "text-emerald-400" :
            momentum.continuationProbability > 50 ? "text-amber-400" : "text-red-400"
          )}>
            {momentum.continuationProbability.toFixed(0)}%
          </span>
        </div>
        <Progress
          value={momentum.continuationProbability}
          variant={momentum.continuationProbability > 70 ? "success" : momentum.continuationProbability > 50 ? "warning" : "danger"}
          size="md"
        />
      </div>

      {/* Velocity & ATR Metrics */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        <MetricBox
          label="Velocity"
          value={`${momentum.candleVelocity.toFixed(1)}x`}
          highlight={momentum.candleVelocity > 1.3}
          color={momentum.candleVelocity > 1.3 ? "text-amber-400" : "text-zinc-300"}
        />
        <MetricBox
          label="Accel"
          value={`${momentum.velocityAcceleration > 0 ? "+" : ""}${momentum.velocityAcceleration.toFixed(0)}%`}
          highlight={momentum.velocityAcceleration > 20}
          color={momentum.velocityAcceleration > 20 ? "text-emerald-400" : momentum.velocityAcceleration < -10 ? "text-red-400" : "text-zinc-300"}
        />
        <MetricBox
          label="ATR Δ"
          value={`${momentum.atrAcceleration > 0 ? "+" : ""}${momentum.atrAcceleration.toFixed(0)}%`}
          highlight={momentum.isATRExpanding}
          color={momentum.isATRExpanding ? "text-cyan-400" : "text-zinc-300"}
        />
        <MetricBox
          label="Impulse"
          value={`${momentum.consecutiveImpulse}`}
          highlight={momentum.consecutiveImpulse >= 2}
          color={momentum.consecutiveImpulse >= 3 ? "text-amber-400" : momentum.consecutiveImpulse >= 2 ? "text-emerald-400" : "text-zinc-300"}
        />
      </div>

      {/* Body Dominance & Stacking */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <MetricBox
          label="Body Dom"
          value={`${(momentum.bodyDominance * 100).toFixed(0)}%`}
          highlight={momentum.bodyDominance > 0.6}
          color={momentum.bodyDominance > 0.6 ? "text-emerald-400" : "text-zinc-300"}
        />
        <MetricBox
          label="Stacking"
          value={momentum.isStacking ? "YES" : "NO"}
          highlight={momentum.isStacking}
          color={momentum.isStacking ? "text-amber-400" : "text-zinc-500"}
        />
        <MetricBox
          label="Compress"
          value={momentum.compressionBars > 0 ? `${momentum.compressionBars} bars` : "—"}
          highlight={momentum.expansionImminent}
          color={momentum.expansionImminent ? "text-purple-400" : "text-zinc-300"}
        />
      </div>

      {/* Warnings */}
      {momentum.warnings.length > 0 && (
        <div className="space-y-1 mb-3">
          {momentum.warnings.slice(0, 2).map((w, i) => (
            <div key={i} className={cn(
              "rounded-lg px-2.5 py-1.5 text-[10px] border",
              w.severity === "HIGH" ? "bg-red-500/5 border-red-500/20 text-red-400" :
              w.severity === "MEDIUM" ? "bg-amber-500/5 border-amber-500/20 text-amber-400" :
              "bg-zinc-500/5 border-zinc-700/30 text-zinc-400"
            )}>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Narrative */}
      <div className="rounded-lg bg-[#16161f] border border-[#252532] p-2.5">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-bold">AI Momentum Analysis</p>
        <p className="text-[11px] text-zinc-300 leading-relaxed">{momentum.narrative}</p>
      </div>

      {/* Continuation Factors */}
      {momentum.continuationFactors.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Factors</p>
          <div className="flex flex-wrap gap-1">
            {momentum.continuationFactors.map((f, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#16161f] text-zinc-400 border border-[#252532]">
                ✓ {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function MetricBox({ label, value, highlight, color }: { label: string; value: string; highlight: boolean; color: string }) {
  return (
    <div className={cn(
      "rounded-lg p-1.5 text-center border",
      highlight ? "bg-[#16161f] border-[#252532]" : "bg-[#111118] border-transparent"
    )}>
      <p className="text-[8px] text-zinc-600 uppercase">{label}</p>
      <p className={cn("text-xs font-bold font-mono", color)}>{value}</p>
    </div>
  );
}
