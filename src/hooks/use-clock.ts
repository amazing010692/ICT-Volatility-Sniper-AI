"use client";

import { useState, useEffect } from "react";
import type { MarketSession } from "@/types";
import { SESSION_TIMES, KILL_ZONES } from "@/config";

interface ClockState {
  currentTime: Date;
  utcHour: number;
  utcMinute: number;
  currentSession: MarketSession;
  sessionProgress: number;
  isKillZone: boolean;
  killZoneLabel: string | null;
  nextSessionIn: number;
}

/** Real-time clock hook for session timing */
export function useClock(): ClockState {
  const [state, setState] = useState<ClockState>(getClockState());

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getClockState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return state;
}

function getClockState(): ClockState {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // Determine current session
  let currentSession: MarketSession = "CLOSED";
  let sessionProgress = 0;

  if (utcHour >= SESSION_TIMES.LONDON.start && utcHour < SESSION_TIMES.LONDON.end) {
    currentSession = "LONDON";
    const totalMinutes = (SESSION_TIMES.LONDON.end - SESSION_TIMES.LONDON.start) * 60;
    const elapsed = (utcHour - SESSION_TIMES.LONDON.start) * 60 + utcMinute;
    sessionProgress = (elapsed / totalMinutes) * 100;
  } else if (utcHour >= SESSION_TIMES.NEW_YORK.start && utcHour < SESSION_TIMES.NEW_YORK.end) {
    currentSession = "NEW_YORK";
    const totalMinutes = (SESSION_TIMES.NEW_YORK.end - SESSION_TIMES.NEW_YORK.start) * 60;
    const elapsed = (utcHour - SESSION_TIMES.NEW_YORK.start) * 60 + utcMinute;
    sessionProgress = (elapsed / totalMinutes) * 100;
  } else if (utcHour >= SESSION_TIMES.ASIAN.start && utcHour < SESSION_TIMES.ASIAN.end) {
    currentSession = "ASIAN";
    const totalMinutes = (SESSION_TIMES.ASIAN.end - SESSION_TIMES.ASIAN.start) * 60;
    const elapsed = (utcHour - SESSION_TIMES.ASIAN.start) * 60 + utcMinute;
    sessionProgress = (elapsed / totalMinutes) * 100;
  }

  // Check kill zones
  let isKillZone = false;
  let killZoneLabel: string | null = null;

  for (const [, kz] of Object.entries(KILL_ZONES)) {
    if (utcHour >= kz.start && utcHour < kz.end) {
      isKillZone = true;
      killZoneLabel = kz.label;
      break;
    }
  }

  // Calculate next session
  let nextSessionIn = 0;
  if (currentSession === "CLOSED") {
    const nextStart = SESSION_TIMES.ASIAN.start;
    nextSessionIn = ((nextStart - utcHour + 24) % 24) * 60 - utcMinute;
  }

  return {
    currentTime: now,
    utcHour,
    utcMinute,
    currentSession,
    sessionProgress,
    isKillZone,
    killZoneLabel,
    nextSessionIn,
  };
}
