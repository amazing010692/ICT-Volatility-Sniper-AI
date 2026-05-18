"use client";

import { create } from "zustand";
import type {
  TradingPair,
  MarketData,
  TradingSignal,
  TradingChecklist,
  SMCAnalysis,
  AIReasoning,
  MTFAnalysis,
  TimingIntelligence,
  StrategySettings,
  TradeJournal,
  BacktestResult,
} from "@/types";
import type { MomentumAnalysisAdvanced } from "@/services/momentum-engine";
import { DEFAULT_SETTINGS, REFRESH_INTERVAL } from "@/config";

interface TradingState {
  // Core state
  selectedPair: TradingPair;
  marketData: MarketData | null;
  signal: TradingSignal | null;
  checklist: TradingChecklist | null;
  smc: SMCAnalysis | null;
  aiReasoning: AIReasoning | null;
  mtf: MTFAnalysis | null;
  timing: TimingIntelligence | null;
  momentum: MomentumAnalysisAdvanced | null;
  settings: StrategySettings;

  // UI state
  isLoading: boolean;
  lastFetch: number;
  error: string | null;
  activeTab: string;

  // Journal & Backtest
  journal: TradeJournal[];
  backtestResult: BacktestResult | null;

  // Actions
  setSelectedPair: (pair: TradingPair) => void;
  setActiveTab: (tab: string) => void;
  setSettings: (settings: Partial<StrategySettings>) => void;
  addJournalEntry: (entry: TradeJournal) => void;
  fetchData: () => Promise<void>;
  startAutoRefresh: () => () => void;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  // Initial state
  selectedPair: "XAUUSD",
  marketData: null,
  signal: null,
  checklist: null,
  smc: null,
  aiReasoning: null,
  mtf: null,
  timing: null,
  momentum: null,
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  lastFetch: 0,
  error: null,
  activeTab: "command-center",
  journal: [],
  backtestResult: null,

  // Actions
  setSelectedPair: (pair) => {
    set({ selectedPair: pair, marketData: null, signal: null, momentum: null });
    get().fetchData();
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  addJournalEntry: (entry) =>
    set((state) => ({
      journal: [entry, ...state.journal],
    })),

  fetchData: async () => {
    const { selectedPair, settings } = get();
    set({ isLoading: true, error: null });

    try {
      // Fetch market data
      const marketRes = await fetch(
        `/api/market?pair=${selectedPair}&timeframe=${settings.timeframe}`
      );
      if (!marketRes.ok) throw new Error("Failed to fetch market data");
      const marketData: MarketData = await marketRes.json();

      // Fetch signal
      const signalRes = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair: selectedPair, settings }),
      });
      if (!signalRes.ok) throw new Error("Failed to fetch signal");
      const signalData = await signalRes.json();

      set({
        marketData,
        signal: signalData.signal,
        checklist: signalData.checklist,
        smc: signalData.smc,
        aiReasoning: signalData.aiReasoning,
        mtf: signalData.mtf,
        timing: signalData.timing,
        momentum: signalData.momentum,
        isLoading: false,
        lastFetch: Date.now(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  startAutoRefresh: () => {
    const interval = setInterval(() => {
      get().fetchData();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  },
}));
