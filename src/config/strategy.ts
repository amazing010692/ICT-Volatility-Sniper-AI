// ================================================
// ICT Volatility Sniper AI — Strategy Configuration
// HYPER-SENSITIVE M1 XAUUSD Scalping Settings
// ================================================

import type { StrategySettings, TradingPair, MarketSession } from "@/types";

/** Default strategy settings — tuned for aggressive M1 scalping */
export const DEFAULT_SETTINGS: StrategySettings = {
  emaFast: 5,
  emaMedium: 13,
  emaSlow: 34,
  ema200: 200,
  atrPeriod: 7,
  atrThreshold: 0.03,
  adxPeriod: 7,
  adxThreshold: 15,
  riskPercent: 1,
  timeframe: "1m",
  sessionFilter: ["LONDON", "NEW_YORK", "ASIAN"],
  signalSensitivity: "HIGH",
};

/** Signal confidence thresholds */
export const SIGNAL_THRESHOLDS = {
  HIGH_CONFIDENCE: 75,
  MEDIUM_CONFIDENCE: 55,
  LOW_CONFIDENCE: 35,
} as const;

/** Checklist item weights for scoring */
export const CHECKLIST_WEIGHTS = {
  sessionActive: 0.12,
  marketStructure: 0.15,
  emaAlignment: 0.12,
  momentumCandle: 0.18,
  liquiditySweep: 0.15,
  breakoutConfirmation: 0.10,
  adxStrength: 0.06,
  atrVolatility: 0.05,
  vwapPosition: 0.04,
  noNearbyLevel: 0.03,
} as const;

/** Session times in UTC hours */
export const SESSION_TIMES: Record<Exclude<MarketSession, "CLOSED">, { start: number; end: number }> = {
  ASIAN: { start: 0, end: 8 },
  LONDON: { start: 7, end: 16 },
  NEW_YORK: { start: 12, end: 21 },
};

/** Kill zones — optimal entry windows */
export const KILL_ZONES = {
  LONDON_OPEN: { start: 7, end: 9, label: "London Open Kill Zone" },
  NEW_YORK_OPEN: { start: 12, end: 14, label: "New York Open Kill Zone" },
  LONDON_CLOSE: { start: 15, end: 16, label: "London Close Kill Zone" },
  ASIAN_OPEN: { start: 0, end: 2, label: "Asian Open Kill Zone" },
} as const;

/** M1 Execution parameters — ultra-tight for scalping */
export const M1_EXECUTION = {
  MAX_SPREAD_PIPS: 3.5,
  MIN_RR_RATIO: 1.5,
  MAX_STOP_LOSS_ATR: 1.5,
  PARTIAL_CLOSE_AT_RR: 2.0,
  TRAIL_STOP_ACTIVATION_RR: 2.5,
  MAX_HOLD_CANDLES: 30,
  IMPULSE_BODY_RATIO: 0.45,
  DISPLACEMENT_ATR_MULTIPLE: 1.3,
  CONSECUTIVE_CANDLES_TREND: 2,
  LOOKBACK_STRUCTURE: 2,
  LOOKBACK_LIQUIDITY: 15,
} as const;

/** Volatility thresholds for M1 XAUUSD */
export const VOLATILITY_THRESHOLDS = {
  DEAD_MARKET: 0.01,
  LOW_VOLATILITY: 0.03,
  NORMAL_VOLATILITY: 0.06,
  HIGH_VOLATILITY: 0.12,
  EXTREME_VOLATILITY: 0.20,
  ADX_TRENDING: 15,
  ADX_STRONG_TREND: 25,
  ADX_EXTREME: 40,
} as const;

/** Trading pairs configuration */
export const TRADING_PAIRS: Record<TradingPair, { name: string; pipSize: number; avgSpread: number; category: string }> = {
  XAUUSD: { name: "Gold / USD", pipSize: 0.01, avgSpread: 2.5, category: "Metals" },
  EURUSD: { name: "Euro / USD", pipSize: 0.0001, avgSpread: 0.8, category: "Majors" },
  GBPUSD: { name: "GBP / USD", pipSize: 0.0001, avgSpread: 1.2, category: "Majors" },
  USDJPY: { name: "USD / JPY", pipSize: 0.01, avgSpread: 1.0, category: "Majors" },
  GBPJPY: { name: "GBP / JPY", pipSize: 0.01, avgSpread: 2.0, category: "Crosses" },
  NAS100: { name: "Nasdaq 100", pipSize: 0.01, avgSpread: 1.5, category: "Indices" },
  US30: { name: "Dow Jones 30", pipSize: 0.01, avgSpread: 2.0, category: "Indices" },
};

/** Auto-refresh interval in milliseconds — 30s to respect TwelveData rate limits */
export const REFRESH_INTERVAL = 30_000;

/** Maximum candles to fetch per request */
export const MAX_CANDLES = 200;
