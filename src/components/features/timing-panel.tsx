"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Clock, Target, AlertCircle } from "lucide-react";

export function TimingPanel() {
  const { timing } = useTradingStore();

  if (!timing) {
    return (
      <Card>
        <div className="h-48 flex items-center justify-center">
          <span className="text-zinc-500 text-sm">Loading timing data...</span>
        </div>
      </Card>
    );
  }

  const timingColors = {
    OPTIMAL: "text-emerald-400",
    ACCEPTABLE: "text-cyan-400",
    LATE: "text-amber-400",
    TOO_LATE: "text-red-400",
    MISSED: "text-zinc-500",
  };

  const actionColors = {
    HOLD: "text-cyan-400",
    CLOSE_NOW: "text-red-400",
    PARTIAL_CLOSE: "text-amber-400",
    TRAIL_STOP: "text-emerald-400",
    ADD_POSITION: "text-emerald-400",
    NO_POSITION: "text-zinc-500",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <CardTitle>Timing Intelligence</CardTitle>
        </div>
        <Badge
          variant={timing.entryTiming === "OPTIMAL" ? "success" : timing.entryTiming === "ACCEPTABLE" ? "info" : "warning"}
        >
          {timing.entryTiming}
        </Badge>
      </CardHeader>

      {/* Entry Timing */}
      <div className="rounded-lg bg-[#16161f] p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">Entry Timing</span>
          <span className={cn("text-sm font-bold", timingColors[timing.entryTiming])}>
            {timing.entryTimingScore}/100
          </span>
        </div>
        <Progress
          value={timing.entryTimingScore}
          variant={timing.entryTimingScore > 70 ? "success" : timing.entryTimingScore > 45 ? "warning" : "danger"}
          size="sm"
        />
        <p className="text-xs text-zinc-500 mt-1.5">{timing.entryTimingReason}</p>
      </div>

      {/* Move Exhaustion */}
      <div className="rounded-lg bg-[#16161f] p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">Move Exhaustion</span>
          <span className={cn(
            "text-sm font-bold",
            timing.moveExhaustion > 75 ? "text-red-400" : timing.moveExhaustion > 50 ? "text-amber-400" : "text-emerald-400"
          )}>
            {timing.moveExhaustion.toFixed(0)}%
          </span>
        </div>
        <Progress
          value={timing.moveExhaustion}
          variant={timing.moveExhaustion > 75 ? "danger" : timing.moveExhaustion > 50 ? "warning" : "success"}
          size="sm"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-zinc-600">Current: ${timing.currentMoveSize.toFixed(2)}</span>
          <span className="text-xs text-zinc-600">Avg: ${timing.averageMoveSize.toFixed(2)}</span>
        </div>
      </div>

      {/* Position Action */}
      <div className="rounded-lg bg-[#16161f] p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-400">Position Action</span>
          <span className={cn("text-xs font-bold", actionColors[timing.positionAction])}>
            {timing.positionAction.replace("_", " ")}
          </span>
        </div>
        <p className="text-xs text-zinc-500">{timing.positionActionReason}</p>
      </div>

      {/* Pattern */}
      <div className="rounded-lg bg-[#16161f] p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-3 w-3 text-cyan-400" />
          <span className="text-xs font-medium text-zinc-300">{timing.patternName}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-xs text-zinc-500">Prob: {timing.patternProbability}%</span>
          <span className="text-xs text-zinc-500">WR: {timing.historicalWinRate}%</span>
        </div>
      </div>

      {/* Session Info */}
      {timing.optimalEntryWindow && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
          <AlertCircle className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400">Optimal entry window active</span>
        </div>
      )}
    </Card>
  );
}
