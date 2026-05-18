"use client";

import { useTradingStore } from "@/store";
import { TRADING_PAIRS } from "@/config";
import type { TradingPair } from "@/types";
import { cn } from "@/lib/utils";

export function PairSelector() {
  const { selectedPair, setSelectedPair } = useTradingStore();

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {(Object.keys(TRADING_PAIRS) as TradingPair[]).map((pair) => (
        <button
          key={pair}
          onClick={() => setSelectedPair(pair)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
            selectedPair === pair
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-[#16161f] border border-transparent"
          )}
        >
          {pair}
        </button>
      ))}
    </div>
  );
}
