"use client";

import { useState } from "react";
import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { cn, formatPrice } from "@/lib/utils";
import { BookOpen, Plus, TrendingUp, TrendingDown } from "lucide-react";
import type { TradeJournal } from "@/types";

export function JournalPanel() {
  const { journal, addJournalEntry, signal, selectedPair } = useTradingStore();
  const [showForm, setShowForm] = useState(false);

  const logTrade = () => {
    if (!signal || signal.direction === "WAIT") return;

    const entry: TradeJournal = {
      id: Date.now().toString(),
      pair: selectedPair,
      direction: signal.direction,
      entry: signal.entry,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit1,
      result: "OPEN",
      pnl: 0,
      notes: `${signal.tradeQuality} setup — ${signal.reasoning[0] || ""}`,
      timestamp: Date.now(),
      session: "LONDON",
      confidence: signal.confidence,
    };

    addJournalEntry(entry);
    setShowForm(false);
  };

  // Calculate stats
  const wins = journal.filter((t) => t.result === "WIN").length;
  const losses = journal.filter((t) => t.result === "LOSS").length;
  const totalPnl = journal.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <CardTitle>Trade Journal</CardTitle>
        </div>
        <Button size="sm" onClick={logTrade} disabled={!signal || signal.direction === "WAIT"}>
          <Plus className="h-3 w-3" />
          Log Trade
        </Button>
      </CardHeader>

      {/* Stats */}
      {journal.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg bg-[#16161f] p-2 text-center">
            <p className="text-xs text-zinc-500">W/L</p>
            <p className="text-sm font-bold text-zinc-200">{wins}/{losses}</p>
          </div>
          <div className="rounded-lg bg-[#16161f] p-2 text-center">
            <p className="text-xs text-zinc-500">Win Rate</p>
            <p className="text-sm font-bold text-emerald-400">
              {journal.length > 0 ? ((wins / Math.max(wins + losses, 1)) * 100).toFixed(0) : 0}%
            </p>
          </div>
          <div className="rounded-lg bg-[#16161f] p-2 text-center">
            <p className="text-xs text-zinc-500">PnL</p>
            <p className={cn("text-sm font-bold", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
              {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(0)}
            </p>
          </div>
        </div>
      )}

      {/* Journal entries */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {journal.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No trades logged yet</p>
            <p className="text-xs text-zinc-600">Click &quot;Log Trade&quot; to record a signal</p>
          </div>
        ) : (
          journal.slice(0, 10).map((trade) => (
            <div key={trade.id} className="flex items-center gap-2 rounded-lg bg-[#16161f] p-2.5">
              {trade.direction === "BUY" ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-200">{trade.pair}</span>
                  <Badge variant={trade.result === "WIN" ? "success" : trade.result === "LOSS" ? "danger" : "default"}>
                    {trade.result}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 truncate">
                  Entry: {formatPrice(trade.entry, trade.pair)} | Conf: {trade.confidence.toFixed(0)}%
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {new Date(trade.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
