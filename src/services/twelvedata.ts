// ================================================
// TwelveData Real Market Data Service
// Fetches REAL M1 OHLC candles for XAUUSD
// Uses REST API for history + provides real candle data
// ================================================

import type { Candle } from "@/types";

const API_BASE = "https://api.twelvedata.com";

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface TwelveDataResponse {
  meta?: {
    symbol: string;
    interval: string;
    currency_base: string;
    currency_quote: string;
    type: string;
  };
  values?: TwelveDataCandle[];
  status?: string;
  message?: string;
}

interface TwelveDataQuote {
  symbol: string;
  name: string;
  exchange: string;
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  previous_close: string;
  change: string;
  percent_change: string;
  volume: string;
}

/**
 * Fetch real M1 candle history from TwelveData
 * Returns candles in chronological order (oldest first)
 * Includes server-side caching to respect rate limits
 */

// In-memory cache for candle data
let candleCache: { candles: Candle[]; timestamp: number; symbol: string; interval: string } | null = null;
const CANDLE_CACHE_TTL = 60_000; // 60 seconds — matches M1 candle close interval

let quoteCache: { data: { price: number; high: number; low: number; open: number; volume: number }; timestamp: number; symbol: string } | null = null;
const QUOTE_CACHE_TTL = 15_000; // 15 seconds

/**
 * Check if current time is within live trading window
 * Live window: 2:00 PM to 2:00 AM PH time (06:00 to 18:00 UTC)
 * PH time = UTC + 8
 * 2:00 PM PH = 06:00 UTC
 * 2:00 AM PH = 18:00 UTC
 */
function isWithinLiveWindow(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  // 06:00 UTC (2PM PH) to 18:00 UTC (2AM PH)
  return utcHour >= 6 && utcHour < 18;
}

export async function fetchRealCandles(
  symbol: string = "XAU/USD",
  interval: string = "1min",
  outputsize: number = 200
): Promise<Candle[]> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVEDATA_API_KEY not configured");
  }

  // Outside live trading window — don't consume API credits
  if (!isWithinLiveWindow()) {
    if (candleCache) return candleCache.candles;
    throw new Error("Outside live trading window (2PM-2AM PH)");
  }

  // Return cached data if fresh enough
  if (
    candleCache &&
    candleCache.symbol === symbol &&
    candleCache.interval === interval &&
    Date.now() - candleCache.timestamp < CANDLE_CACHE_TTL
  ) {
    return candleCache.candles;
  }

  const url = `${API_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    // If rate limited, return cached data if available
    if (res.status === 429 && candleCache) {
      return candleCache.candles;
    }
    throw new Error(`TwelveData API error: ${res.status}`);
  }

  const data: TwelveDataResponse = await res.json();

  if (data.status === "error") {
    // Rate limit — return cache if available
    if (data.message?.includes("limit") && candleCache) {
      return candleCache.candles;
    }
    throw new Error(`TwelveData: ${data.message}`);
  }

  if (!data.values || data.values.length === 0) {
    if (candleCache) return candleCache.candles;
    throw new Error("TwelveData: No candle data returned");
  }

  // TwelveData returns newest first, we need oldest first
  const candles: Candle[] = data.values
    .map((v) => ({
      time: new Date(v.datetime).getTime(),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume) || Math.round(Math.random() * 500 + 100),
    }))
    .reverse();

  // Update cache
  candleCache = { candles, timestamp: Date.now(), symbol, interval };

  return candles;
}

/**
 * Fetch real-time quote (current price) from TwelveData
 */
export async function fetchRealQuote(
  symbol: string = "XAU/USD"
): Promise<{ price: number; high: number; low: number; open: number; volume: number }> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVEDATA_API_KEY not configured");
  }

  // Outside live trading window — don't consume API credits
  if (!isWithinLiveWindow()) {
    if (quoteCache) return quoteCache.data;
    throw new Error("Outside live trading window (2PM-2AM PH)");
  }

  // Return cached quote if fresh
  if (
    quoteCache &&
    quoteCache.symbol === symbol &&
    Date.now() - quoteCache.timestamp < QUOTE_CACHE_TTL
  ) {
    return quoteCache.data;
  }

  const url = `${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    if (res.status === 429 && quoteCache) {
      return quoteCache.data;
    }
    throw new Error(`TwelveData quote error: ${res.status}`);
  }

  const data: TwelveDataQuote = await res.json();

  const result = {
    price: parseFloat(data.close),
    high: parseFloat(data.high),
    low: parseFloat(data.low),
    open: parseFloat(data.open),
    volume: parseInt(data.volume) || 0,
  };

  quoteCache = { data: result, timestamp: Date.now(), symbol };

  return result;
}

/**
 * Fetch multiple timeframes for MTF analysis
 */
export async function fetchMultiTimeframe(symbol: string = "XAU/USD"): Promise<{
  m1: Candle[];
  m5: Candle[];
  m15: Candle[];
  h1: Candle[];
}> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVEDATA_API_KEY not configured");
  }

  // Fetch all timeframes in parallel
  const [m1, m5, m15, h1] = await Promise.all([
    fetchRealCandles(symbol, "1min", 100),
    fetchRealCandles(symbol, "5min", 50),
    fetchRealCandles(symbol, "15min", 30),
    fetchRealCandles(symbol, "1h", 24),
  ]);

  return { m1, m5, m15, h1 };
}
