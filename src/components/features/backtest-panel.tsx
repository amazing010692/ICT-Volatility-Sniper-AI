"use client";

import { useState } from "react";
import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge, Button, Progress } from "@/components/ui";
import { FlaskConical, Play, BarChart3, TrendingUp, TrendingDown, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSignal } from "@/services/signal-engine";
import { generateCandles } from "@/services/market-data";
import { analyzeMomentumAdvanced } from "@/services/momentum-engine";
import type { TradingPair, MarketSession, SignalDirection, Candle } from "@/types";
import { DEFAULT_SETTINGS } from "@/config";

// ================================================
// Backtest Panel — REAL Signal Engine Execution
// Runs the actual signal engine on generated candle history.
// Each trade is a real signal the engine would have fired.
// ================================================

interface BacktestTrade {
  id: number;
  pair: TradingPair;
  direction: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  result: "WIN" | "LOSS";
  pnl: number;
  rr: number;
  confidence: number;
  quality: string;
  session: MarketSession;
  momentumPhase: string;
  entryTime: Date;
  exitTime: Date;
  duration: number;
  reason: string;
}

interface BacktestSummary {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  averageRR: number;
  maxDrawdown: number;
  netPnl: number;
  bestTrade: number;
  worstTrade: number;
  avgDuration: number;
  avgConfidence: number;
  sessionBreakdown: { session: MarketSession; trades: number; winRate: number }[];
}

export function BacktestPanel() {
  const { selectedPair, marketData, settings } = useTradingStore();
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [showAll, setShowAll] = useState(false);

  const runBacktest = () => {
    setIsRunning(true);

    // Use setTimeout to not block UI
    setTimeout(() => {
      const basePrice = marketData?.currentPrice || 4540;
      const { summary: s, trades: t } = executeBacktest(selectedPair, basePrice, settings || DEFAULT_SETTINGS);
      setSummary(s);
      setTrades(t);
      setIsRunning(false);
    }, 500);
  };

  const displayedTrades = showAll ? trades : trades.slice(0, 15);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-purple-400" />
            <CardTitle>Backtest Engine — {selectedPair} M1 Scalping</CardTitle>
          </div>
          {summary && (
            <Badge variant={summary.winRate > 60 ? "success" : "warning"}>
              {summary.winRate.toFixed(1)}% WR
            </Badge>
          )}
        </CardHeader>

        {!summary ? (
          <div className="text-center py-8">
            <BarChart3 className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 mb-1">
              Backtest the ICT M1 strategy on {selectedPair}
            </p>
            <p className="text-xs text-zinc-600 mb-4">
              Runs the real signal engine on 500 simulated M1 candles.
              Each trade is a signal the engine actually fired.
            </p>
            <Button onClick={runBacktest} disabled={isRunning}>
              <Play className="h-3.5 w-3.5" />
              {isRunning ? "Running Signal Engine..." : "Run Backtest"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <MetricCard label="Total Trades" value={summary.totalTrades.toString()} />
              <MetricCard label="Win Rate" value={`${summary.winRate.toFixed(1)}%`} color="text-emerald-400" />
              <MetricCard label="Profit Factor" value={summary.profitFactor.toFixed(2)} color="text-cyan-400" />
              <MetricCard label="Avg R:R" value={summary.averageRR.toFixed(1)} color="text-amber-400" />
            </div>

            {/* Win/Loss Bar */}
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Wins: {summary.wins}</span>
                <span>Losses: {summary.losses}</span>
              </div>
              <Progress value={summary.winRate} variant="success" size="md" />
            </div>

            {/* PnL, Drawdown, Duration, Confidence */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className={cn("rounded-lg border p-2.5 text-center", summary.netPnl > 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
                <p className="text-[10px] text-zinc-500">Net PnL</p>
                <p className={cn("text-sm font-bold", summary.netPnl > 0 ? "text-emerald-400" : "text-red-400")}>
                  {summary.netPnl > 0 ? "+" : ""}${summary.netPnl.toFixed(0)}
                </p>
              </div>
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-2.5 text-center">
                <p className="text-[10px] text-zinc-500">Max Drawdown</p>
                <p className="text-sm font-bold text-red-400">-{summary.maxDrawdown.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-[#16161f] p-2.5 text-center">
                <p className="text-[10px] text-zinc-500">Avg Confidence</p>
                <p className="text-sm font-bold text-amber-400">{summary.avgConfidence.toFixed(0)}%</p>
              </div>
              <div className="rounded-lg bg-[#16161f] p-2.5 text-center">
                <p className="text-[10px] text-zinc-500">Avg Duration</p>
                <p className="text-sm font-bold text-zinc-300">{summary.avgDuration.toFixed(0)} min</p>
              </div>
            </div>

            {/* Session Breakdown */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-bold">Session Breakdown</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {summary.sessionBreakdown.map((s) => (
                  <div key={s.session} className="rounded-lg bg-[#16161f] p-2 text-center">
                    <p className="text-[10px] text-zinc-500">{s.session}</p>
                    <p className="text-xs font-bold text-zinc-300">{s.trades} trades</p>
                    <p className={cn("text-[10px] font-bold", s.winRate > 60 ? "text-emerald-400" : s.winRate > 45 ? "text-amber-400" : "text-red-400")}>
                      {s.winRate.toFixed(0)}% WR
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={runBacktest} variant="outline" className="w-full" disabled={isRunning}>
              {isRunning ? "Running..." : "Re-run Backtest (new candle data)"}
            </Button>
          </div>
        )}
      </Card>

      {/* Individual Trade History */}
      {trades.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <CardTitle>Trade History — {trades.length} Signals Fired</CardTitle>
            </div>
          </CardHeader>

          <div className="space-y-1.5">
            {displayedTrades.map((trade) => (
              <TradeRow key={trade.id} trade={trade} />
            ))}
          </div>

          {trades.length > 15 && (
            <div className="pt-3 text-center">
              <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
                {showAll ? "Show Less" : `Show All ${trades.length} Trades`}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function TradeRow({ trade }: { trade: BacktestTrade }) {
  const isWin = trade.result === "WIN";

  const day = trade.entryTime.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const utcTime = trade.entryTime.toUTCString().slice(17, 22);
  const localTime = trade.entryTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className={cn(
      "p-2.5 rounded-lg border text-xs",
      isWin ? "bg-emerald-500/3 border-emerald-500/10" : "bg-red-500/3 border-red-500/10"
    )}>
      {/* Top row */}
      <div className="flex items-center gap-2">
        <div className={cn("flex items-center justify-center h-6 w-6 rounded shrink-0", isWin ? "bg-emerald-500/10" : "bg-red-500/10")}>
          {trade.direction === "BUY" ? (
            <TrendingUp className={cn("h-3.5 w-3.5", isWin ? "text-emerald-400" : "text-red-400")} />
          ) : (
            <TrendingDown className={cn("h-3.5 w-3.5", isWin ? "text-emerald-400" : "text-red-400")} />
          )}
        </div>

        <div className="w-14 shrink-0">
          <p className="font-bold text-zinc-200">{trade.pair}</p>
          <p className={cn("text-[9px] font-bold", trade.direction === "BUY" ? "text-emerald-400" : "text-red-400")}>
            {trade.direction}
          </p>
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-3 gap-1">
          <div>
            <p className="text-[9px] text-zinc-600">Entry</p>
            <p className="font-mono text-zinc-300">{trade.entry.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] text-zinc-600">SL</p>
            <p className="font-mono text-red-400/70">{trade.stopLoss.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] text-zinc-600">Exit</p>
            <p className={cn("font-mono", isWin ? "text-emerald-400" : "text-red-400")}>
              {trade.exitPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="w-16 text-right shrink-0">
          <p className={cn("font-bold", isWin ? "text-emerald-400" : "text-red-400")}>
            {isWin ? "+" : ""}{trade.pnl.toFixed(0)}$
          </p>
          <p className="text-[9px] text-zinc-500">{trade.duration}m • {trade.rr.toFixed(1)}R</p>
        </div>
      </div>

      {/* Bottom row: time, session, confidence, reason */}
      <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-[#252532]/50 flex-wrap">
        <span className="text-[9px] text-zinc-400">📅 {day}</span>
        <span className="text-[9px] text-zinc-500 font-mono">
          <Globe className="h-2.5 w-2.5 inline" /> {utcTime} UTC
        </span>
        <span className="text-[9px] text-zinc-400 font-mono">
          <Clock className="h-2.5 w-2.5 inline" /> {localTime}
        </span>
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded",
          trade.session === "LONDON" ? "bg-cyan-500/10 text-cyan-400" :
          trade.session === "NEW_YORK" ? "bg-emerald-500/10 text-emerald-400" :
          "bg-purple-500/10 text-purple-400"
        )}>
          {trade.session}
        </span>
        <span className="text-[9px] text-amber-400/70">{trade.confidence.toFixed(0)}%</span>
        <span className="text-[9px] text-zinc-600 ml-auto truncate max-w-[140px] sm:max-w-[200px]">{trade.reason}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = "text-zinc-200" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-[#16161f] p-2.5">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className={cn("text-lg font-bold", color)}>{value}</p>
    </div>
  );
}

// ================================================
// REAL BACKTEST EXECUTION
// Generates 500 M1 candles, then walks through them
// running the actual signal engine at each bar.
// When a signal fires, it simulates the trade outcome.
// ================================================

function executeBacktest(
  pair: TradingPair,
  basePrice: number,
  settings: typeof DEFAULT_SETTINGS
): { summary: BacktestSummary; trades: BacktestTrade[] } {
  // Generate 500 M1 candles of history
  const allCandles = generateCandles(pair, 500, "1m", basePrice);
  const trades: BacktestTrade[] = [];

  let equity = 10000;
  let maxEquity = equity;
  let maxDrawdown = 0;
  let tradeId = 0;
  let cooldown = 0; // Bars to wait after a trade before taking another

  // Walk through candles, running signal engine at each bar
  for (let i = 30; i < allCandles.length - 10; i++) {
    // Skip if in cooldown (simulates holding a trade)
    if (cooldown > 0) {
      cooldown--;
      continue;
    }

    // Get candle window up to current bar
    const candleWindow = allCandles.slice(Math.max(0, i - 100), i + 1);

    // Run the REAL signal engine
    const { signal } = generateSignal(candleWindow, pair, settings);

    // Only take BUY or SELL signals (skip WAIT)
    if (signal.direction !== "BUY" && signal.direction !== "SELL") continue;

    // We have a signal — simulate the trade
    const entryCandle = allCandles[i];
    const entry = signal.entry;
    const stopLoss = signal.stopLoss;
    const takeProfit = signal.takeProfit1;
    const risk = Math.abs(entry - stopLoss);

    // Walk forward to determine outcome
    let exitPrice = entry;
    let result: "WIN" | "LOSS" = "LOSS";
    let duration = 0;

    for (let j = i + 1; j < Math.min(i + 15, allCandles.length); j++) {
      duration++;
      const bar = allCandles[j];

      if (signal.direction === "BUY") {
        // Check if SL hit
        if (bar.low <= stopLoss) {
          exitPrice = stopLoss;
          result = "LOSS";
          break;
        }
        // Check if TP hit
        if (bar.high >= takeProfit) {
          exitPrice = takeProfit;
          result = "WIN";
          break;
        }
        // If neither hit after 15 bars, close at current price
        if (j === Math.min(i + 14, allCandles.length - 1)) {
          exitPrice = bar.close;
          result = bar.close > entry ? "WIN" : "LOSS";
        }
      } else {
        // SELL
        if (bar.high >= stopLoss) {
          exitPrice = stopLoss;
          result = "LOSS";
          break;
        }
        if (bar.low <= takeProfit) {
          exitPrice = takeProfit;
          result = "WIN";
          break;
        }
        if (j === Math.min(i + 14, allCandles.length - 1)) {
          exitPrice = bar.close;
          result = bar.close < entry ? "WIN" : "LOSS";
        }
      }
    }

    // Calculate PnL
    const pnl = signal.direction === "BUY"
      ? (exitPrice - entry) * 10
      : (entry - exitPrice) * 10;
    const rr = risk > 0 ? Math.abs(exitPrice - entry) / risk : 0;

    equity += pnl;
    maxEquity = Math.max(maxEquity, equity);
    const dd = ((maxEquity - equity) / maxEquity) * 100;
    maxDrawdown = Math.max(maxDrawdown, dd);

    // Determine session from candle time
    const entryTime = new Date(entryCandle.time);
    const utcHour = entryTime.getUTCHours();
    let session: MarketSession = "CLOSED";
    if (utcHour >= 7 && utcHour < 16) session = "LONDON";
    else if (utcHour >= 12 && utcHour < 21) session = "NEW_YORK";
    else if (utcHour >= 0 && utcHour < 8) session = "ASIAN";

    // Get momentum phase
    const momentum = analyzeMomentumAdvanced(candleWindow);

    trades.push({
      id: ++tradeId,
      pair,
      direction: signal.direction,
      entry: Math.round(entry * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      takeProfit: Math.round(takeProfit * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      result,
      pnl: Math.round(pnl),
      rr,
      confidence: signal.confidence,
      quality: signal.tradeQuality,
      session,
      momentumPhase: momentum.phase,
      entryTime,
      exitTime: new Date(entryTime.getTime() + duration * 60000),
      duration,
      reason: signal.reasoning[0] || "Signal fired",
    });

    // Cooldown: wait for trade duration before next signal
    cooldown = duration + 2;
  }

  // Sort newest first
  trades.sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime());

  // Calculate summary
  const wins = trades.filter((t) => t.result === "WIN");
  const losses = trades.filter((t) => t.result === "LOSS");
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  const sessions: MarketSession[] = ["LONDON", "NEW_YORK", "ASIAN"];
  const sessionBreakdown = sessions.map((session) => {
    const sessionTrades = trades.filter((t) => t.session === session);
    const sessionWins = sessionTrades.filter((t) => t.result === "WIN");
    return {
      session,
      trades: sessionTrades.length,
      winRate: sessionTrades.length > 0 ? (sessionWins.length / sessionTrades.length) * 100 : 0,
    };
  });

  const summary: BacktestSummary = {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0,
    averageRR: trades.length > 0 ? trades.reduce((s, t) => s + t.rr, 0) / trades.length : 0,
    maxDrawdown,
    netPnl: totalPnl,
    bestTrade: trades.length > 0 ? Math.max(...trades.map((t) => t.pnl)) : 0,
    worstTrade: trades.length > 0 ? Math.min(...trades.map((t) => t.pnl)) : 0,
    avgDuration: trades.length > 0 ? trades.reduce((s, t) => s + t.duration, 0) / trades.length : 0,
    avgConfidence: trades.length > 0 ? trades.reduce((s, t) => s + t.confidence, 0) / trades.length : 0,
    sessionBreakdown,
  };

  return { summary, trades };
}
