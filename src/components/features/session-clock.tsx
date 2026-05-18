"use client";

import { useClock } from "@/hooks";
import { Badge } from "@/components/ui";
import { Clock, Globe, Crosshair } from "lucide-react";
import { Progress } from "@/components/ui";

export function SessionClock() {
  const clock = useClock();

  const sessionColors = {
    LONDON: "text-cyan-400",
    NEW_YORK: "text-emerald-400",
    ASIAN: "text-purple-400",
    CLOSED: "text-zinc-500",
  };

  const sessionBadgeVariant = {
    LONDON: "info" as const,
    NEW_YORK: "success" as const,
    ASIAN: "warning" as const,
    CLOSED: "default" as const,
  };

  // Format times
  const utcTime = clock.currentTime.toUTCString().slice(17, 25);
  const localTime = clock.currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const localDate = clock.currentTime.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="card-elite rounded-xl border border-[#252532] bg-[#111118] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-medium text-zinc-400">Session Clock</span>
        </div>
        <div className="flex items-center gap-2">
          {clock.isKillZone && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
              <Crosshair className="h-3 w-3 text-red-400 animate-pulse" />
              <span className="text-[10px] text-red-400 font-bold">KILL ZONE</span>
            </div>
          )}
          <Badge variant={sessionBadgeVariant[clock.currentSession]} pulse={clock.isKillZone}>
            {clock.currentSession}
          </Badge>
        </div>
      </div>

      {/* Time display — both UTC and Local */}
      <div className="flex items-center justify-between mb-2" suppressHydrationWarning>
        <div className="flex items-center gap-4">
          {/* Local Time (primary) */}
          <div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Local</p>
            <span suppressHydrationWarning className={`text-lg font-mono font-bold ${sessionColors[clock.currentSession]}`}>
              {localTime}
            </span>
          </div>
          {/* UTC Time */}
          <div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-wider">UTC</p>
            <span suppressHydrationWarning className="text-sm font-mono text-zinc-400">
              {utcTime}
            </span>
          </div>
          {/* Date */}
          <div className="hidden sm:block">
            <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Date</p>
            <span suppressHydrationWarning className="text-sm font-mono text-zinc-500">
              {localDate}
            </span>
          </div>
        </div>
      </div>

      {clock.currentSession !== "CLOSED" && (
        <div className="space-y-1">
          <Progress
            value={clock.sessionProgress}
            variant={clock.isKillZone ? "danger" : "info"}
            size="sm"
          />
          <p className="text-[10px] text-zinc-500">
            {clock.killZoneLabel || `${clock.currentSession} session`} — {(100 - clock.sessionProgress).toFixed(0)}% remaining
          </p>
        </div>
      )}

      {clock.currentSession === "CLOSED" && clock.nextSessionIn > 0 && (
        <p className="text-[10px] text-zinc-600">
          Next session in {Math.floor(clock.nextSessionIn / 60)}h {clock.nextSessionIn % 60}m
        </p>
      )}
    </div>
  );
}
