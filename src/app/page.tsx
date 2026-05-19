"use client";

import { useEffect } from "react";
import { useTradingStore } from "@/store";
import {
  Sidebar,
  SessionClock,
  VolatilityMeter,
  SignalCard,
  DisplacementDetector,
  MarketOverview,
  ChartWidget,
  MomentumScanner,
  LiquidityHeatmap,
  MTFPanel,
  AIAssistant,
  TimingPanel,
  ChecklistPanel,
  BacktestPanel,
  JournalPanel,
  SettingsPanel,
  PairSelector,
} from "@/components/features";

export default function DashboardPage() {
  const { activeTab, fetchData, startAutoRefresh } = useTradingStore();

  useEffect(() => {
    fetchData();
    const cleanup = startAutoRefresh();
    return cleanup;
  }, [fetchData, startAutoRefresh]);

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-16 lg:ml-56 p-3 md:p-4 lg:p-6 pb-20 md:pb-6 bg-grid min-w-0 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4">
          <PairSelector />
        </div>

        {/* Tab Content */}
        {activeTab === "command-center" && <CommandCenterView />}
        {activeTab === "chart" && <ChartView />}
        {activeTab === "scanner" && <ScannerView />}
        {activeTab === "timing" && <TimingView />}
        {activeTab === "checklist" && <ChecklistView />}
        {activeTab === "ai-sniper" && <AISniperView />}
        {activeTab === "backtest" && <BacktestView />}
        {activeTab === "journal" && <JournalView />}
        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}

/** Command Center — Main dashboard view */
function CommandCenterView() {
  return (
    <div className="space-y-4">
      {/* Top row: Session + Volatility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SessionClock />
        <VolatilityMeter />
      </div>

      {/* Signal + Displacement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SignalCard />
        <DisplacementDetector />
      </div>

      {/* Market Overview */}
      <MarketOverview />

      {/* Chart */}
      <ChartWidget />

      {/* Bottom row: Momentum + Liquidity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MomentumScanner />
        <LiquidityHeatmap />
      </div>

      {/* MTF + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MTFPanel />
        <AIAssistant />
      </div>
    </div>
  );
}

function ChartView() {
  return (
    <div className="space-y-4">
      <ChartWidget />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MarketOverview />
        <MomentumScanner />
      </div>
    </div>
  );
}

function ScannerView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MomentumScanner />
        <DisplacementDetector />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiquidityHeatmap />
        <VolatilityMeter />
      </div>
    </div>
  );
}

function TimingView() {
  return (
    <div className="space-y-4">
      <TimingPanel />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SessionClock />
        <VolatilityMeter />
      </div>
    </div>
  );
}

function ChecklistView() {
  return (
    <div className="space-y-4">
      <ChecklistPanel />
      <SignalCard />
    </div>
  );
}

function AISniperView() {
  return (
    <div className="space-y-4">
      <AIAssistant />
      <MTFPanel />
    </div>
  );
}

function BacktestView() {
  return (
    <div className="space-y-4">
      <BacktestPanel />
    </div>
  );
}

function JournalView() {
  return (
    <div className="space-y-4">
      <JournalPanel />
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-4">
      <SettingsPanel />
    </div>
  );
}
