// ================================================
// ICT Volatility Sniper AI — Market Data Service
// PERSISTENT CANDLES — candles build up over time.
// Only adds new candles when a new minute ticks.
// Signals stay stable between refreshes.
// ================================================

import type { Candle, MarketData, TradingPair, Timeframe } from "@/types";

/** Volatility per M1 candle in price units */
const M1_VOLATILITY: Record<TradingPair, number> = {
  XAUUSD: 1.8,
  EURUSD: 0.00025,
  GBPUSD: 0.00035,
  USDJPY: 0.045,
  GBPJPY: 0.07,
  NAS100: 8.0,
  US30: 12.0,
};

/** Spread in price units */
const SPREADS: Record<TradingPair, number> = {
  XAUUSD: 0.30,
  EURUSD: 0.00008,
  GBPUSD: 0.00012,
  USDJPY: 0.012,
  GBPJPY: 0.025,
  NAS100: 1.5,
  US30: 2.5,
};

// ================================================
// PERSISTENT CANDLE STORE
// Candles are stored in memory per pair.
// New candles are only added when a new minute starts.
// This prevents signal flipping on every refresh.
// ================================================

interface CandleStore {
  candles: Candle[];
  lastMinute: number; // The minute timestamp of the last candle
  lastPrice: number; // Last known price
  trendBias: number; // Current trend direction
  trendDuration: number;
}

const candleStores: Map<string, CandleStore> = new Map();

/** Get or create the candle store for a pair+timeframe */
function getStore(pair: TradingPair, timeframe: Timeframe): CandleStore {
  const key = `${pair}-${timeframe}`;
  if (!candleStores.has(key)) {
    candleStores.set(key, {
      candles: [],
      lastMinute: 0,
      lastPrice: 0,
      trendBias: (Math.random() - 0.5) * 0.4,
      trendDuration: 0,
    });
  }
  return candleStores.get(key)!;
}

/** Get the current minute timestamp (floored to minute boundary) */
function getCurrentMinute(timeframe: Timeframe): number {
  const now = Date.now();
  const intervalMs = getIntervalMs(timeframe);
  return Math.floor(now / intervalMs) * intervalMs;
}

// ================================================
// LIVE PRICE FETCHING
// ================================================

let priceCache: { price: number; pair: string; timestamp: number } | null = null;
const CACHE_TTL = 15_000; // 15 seconds for tighter price tracking

async function fetchLivePrice(pair: TradingPair): Promise<number> {
  if (priceCache && priceCache.pair === pair && Date.now() - priceCache.timestamp < CACHE_TTL) {
    return priceCache.price;
  }

  try {
    if (pair === "XAUUSD") {
      const res = await fetch("https://api.gold-api.com/price/XAU", {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.price && data.price > 1000) {
          priceCache = { price: data.price, pair, timestamp: Date.now() };
          return data.price;
        }
      }
    }
  } catch { /* fall through */ }

  try {
    if (pair !== "XAUUSD" && pair !== "NAS100" && pair !== "US30") {
      const base = pair.slice(0, 3);
      const quote = pair.slice(3, 6);
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.rates?.[quote]) {
          const price = data.rates[quote];
          priceCache = { price, pair, timestamp: Date.now() };
          return price;
        }
      }
    }
  } catch { /* fall through */ }

  return getFallbackPrice(pair);
}

function getFallbackPrice(pair: TradingPair): number {
  const CURRENT_PRICES: Record<TradingPair, number> = {
    XAUUSD: 4575.00,
    EURUSD: 1.1180,
    GBPUSD: 1.3290,
    USDJPY: 145.50,
    GBPJPY: 193.40,
    NAS100: 21200.00,
    US30: 42500.00,
  };
  return CURRENT_PRICES[pair];
}

// ================================================
// PERSISTENT CANDLE GENERATION
// Only generates NEW candles when a new minute ticks.
// Existing candles are preserved between refreshes.
// ================================================

function updateCandleStore(
  store: CandleStore,
  pair: TradingPair,
  timeframe: Timeframe,
  livePrice: number
): void {
  const currentMinute = getCurrentMinute(timeframe);
  const intervalMs = getIntervalMs(timeframe);
  const vol = M1_VOLATILITY[pair] * getTimeframeVolMultiplier(timeframe);

  // FIRST TIME: Generate initial history (100 candles leading up to now)
  if (store.candles.length === 0) {
    const historyCount = 100;
    let price = livePrice - (Math.random() - 0.3) * vol * 10;
    const startTime = currentMinute - historyCount * intervalMs;
    const drift = (livePrice - price) / historyCount;

    for (let i = 0; i < historyCount; i++) {
      const time = startTime + i * intervalMs;
      const candle = generateSingleCandle(price, vol, store, pair, drift);
      candle.time = time;
      store.candles.push(candle);
      price = candle.close;
    }

    store.lastMinute = currentMinute - intervalMs;
    store.lastPrice = price;
  }

  // ADD NEW CANDLES: Only if a new minute has started
  if (currentMinute > store.lastMinute) {
    // How many new candles to add (usually 1, but could be more if page was inactive)
    const missedCandles = Math.min(
      Math.floor((currentMinute - store.lastMinute) / intervalMs),
      30 // Cap at 30 to prevent huge generation
    );

    let price = store.lastPrice;

    for (let i = 0; i < missedCandles; i++) {
      const time = store.lastMinute + (i + 1) * intervalMs;

      // For the LAST candle, drift toward the live price
      const isLast = i === missedCandles - 1;
      const drift = isLast ? (livePrice - price) * 0.7 : 0;

      const candle = generateSingleCandle(price, vol, store, pair, drift);
      candle.time = time;
      store.candles.push(candle);
      price = candle.close;
    }

    store.lastMinute = currentMinute;
    store.lastPrice = price;

    // Keep max 300 candles in memory
    if (store.candles.length > 300) {
      store.candles = store.candles.slice(-300);
    }
  }

  // UPDATE the current (last) candle's close to match live price
  // This makes the "current price" always accurate
  if (store.candles.length > 0) {
    const lastCandle = store.candles[store.candles.length - 1];
    lastCandle.close = roundPrice(livePrice, pair);
    lastCandle.high = roundPrice(Math.max(lastCandle.high, livePrice), pair);
    lastCandle.low = roundPrice(Math.min(lastCandle.low, livePrice), pair);
    store.lastPrice = livePrice;
  }
}

/** Generate a single candle based on current price and volatility */
function generateSingleCandle(
  currentPrice: number,
  vol: number,
  store: CandleStore,
  pair: TradingPair,
  drift: number = 0
): Candle {
  // Trend management
  store.trendDuration++;
  if (store.trendDuration > 15 + Math.random() * 25) {
    store.trendBias = (Math.random() - 0.5) * 0.5;
    store.trendDuration = 0;
  }

  // Candle type randomization
  const rand = Math.random();
  let candleVol = vol;
  let isBigCandle = false;

  if (rand > 0.92) {
    candleVol = vol * (2.5 + Math.random() * 2.5);
    isBigCandle = true;
  } else if (rand > 0.80) {
    candleVol = vol * (1.5 + Math.random() * 1.0);
  } else if (rand < 0.15) {
    candleVol = vol * 0.3;
  }

  const direction = Math.random() + store.trendBias > 0.5 ? 1 : -1;
  const bodySize = candleVol * (0.3 + Math.random() * 0.7) * direction;

  const wickMultiplier = isBigCandle ? 0.15 : 0.5;
  const upperWick = Math.random() * candleVol * wickMultiplier;
  const lowerWick = Math.random() * candleVol * wickMultiplier;

  const open = currentPrice;
  const close = open + bodySize + drift;
  const high = Math.max(open, close) + upperWick;
  const low = Math.min(open, close) - lowerWick;

  const baseVolume = 100 + Math.random() * 200;
  const volume = isBigCandle ? baseVolume * (2 + Math.random() * 3) : baseVolume;

  return {
    time: 0, // Will be set by caller
    open: roundPrice(open, pair),
    high: roundPrice(high, pair),
    low: roundPrice(low, pair),
    close: roundPrice(close, pair),
    volume: Math.round(volume),
  };
}

// ================================================
// PUBLIC API
// ================================================

/** Fetch market data with PERSISTENT candles and live price */
export async function fetchMarketDataAsync(
  pair: TradingPair,
  timeframe: Timeframe = "1m",
  count: number = 200
): Promise<MarketData> {
  const livePrice = await fetchLivePrice(pair);
  const store = getStore(pair, timeframe);

  // Update the persistent store (adds new candles only when minute ticks)
  updateCandleStore(store, pair, timeframe, livePrice);

  // Return the requested number of candles
  const candles = store.candles.slice(-Math.min(count, store.candles.length));

  return {
    pair,
    timeframe,
    candles,
    currentPrice: livePrice,
    spread: SPREADS[pair],
    lastUpdated: Date.now(),
  };
}

/** Synchronous version (uses fallback price, still persistent) */
export function fetchMarketData(
  pair: TradingPair,
  timeframe: Timeframe = "1m",
  count: number = 200
): MarketData {
  const livePrice = getFallbackPrice(pair);
  const store = getStore(pair, timeframe);

  updateCandleStore(store, pair, timeframe, livePrice);

  const candles = store.candles.slice(-Math.min(count, store.candles.length));

  return {
    pair,
    timeframe,
    candles,
    currentPrice: livePrice,
    spread: SPREADS[pair],
    lastUpdated: Date.now(),
  };
}

/** Generate candles (non-persistent, for backtest use) */
export function generateCandles(
  pair: TradingPair,
  count: number = 200,
  timeframe: Timeframe = "1m",
  livePrice?: number
): Candle[] {
  const candles: Candle[] = [];
  const basePrice = livePrice || getFallbackPrice(pair);
  const vol = M1_VOLATILITY[pair] * getTimeframeVolMultiplier(timeframe);
  const intervalMs = getIntervalMs(timeframe);

  let currentPrice = basePrice - (Math.random() - 0.3) * vol * 10;
  const now = Date.now();
  const startTime = now - count * intervalMs;
  const drift = (basePrice - currentPrice) / count;

  let trendBias = (Math.random() - 0.5) * 0.5;
  let trendDuration = 0;

  const tempStore: CandleStore = {
    candles: [],
    lastMinute: 0,
    lastPrice: currentPrice,
    trendBias,
    trendDuration,
  };

  for (let i = 0; i < count; i++) {
    const candle = generateSingleCandle(currentPrice, vol, tempStore, pair, drift);
    candle.time = startTime + i * intervalMs;
    candles.push(candle);
    currentPrice = candle.close;
  }

  // Last candle closes at live price
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = roundPrice(basePrice, pair);
    last.high = roundPrice(Math.max(last.high, basePrice), pair);
    last.low = roundPrice(Math.min(last.low, basePrice), pair);
  }

  return candles;
}

// ================================================
// HELPERS
// ================================================

function roundPrice(price: number, pair: TradingPair): number {
  switch (pair) {
    case "XAUUSD": return Math.round(price * 100) / 100;
    case "EURUSD":
    case "GBPUSD": return Math.round(price * 100000) / 100000;
    case "USDJPY":
    case "GBPJPY": return Math.round(price * 1000) / 1000;
    case "NAS100":
    case "US30": return Math.round(price * 10) / 10;
    default: return Math.round(price * 100) / 100;
  }
}

function getIntervalMs(timeframe: Timeframe): number {
  switch (timeframe) {
    case "1m": return 60_000;
    case "5m": return 300_000;
    case "15m": return 900_000;
    case "30m": return 1_800_000;
    case "1h": return 3_600_000;
    case "4h": return 14_400_000;
    case "1d": return 86_400_000;
    default: return 60_000;
  }
}

function getTimeframeVolMultiplier(timeframe: Timeframe): number {
  switch (timeframe) {
    case "1m": return 1;
    case "5m": return 2.2;
    case "15m": return 3.8;
    case "30m": return 5.5;
    case "1h": return 7.5;
    case "4h": return 15;
    case "1d": return 30;
    default: return 1;
  }
}
