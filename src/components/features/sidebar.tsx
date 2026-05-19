"use client";

import { cn } from "@/lib/utils";
import { useTradingStore } from "@/store";
import {
  Zap,
  BarChart3,
  ScanLine,
  Clock,
  CheckSquare,
  Brain,
  FlaskConical,
  BookOpen,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const TABS = [
  { id: "command-center", label: "Command Center", icon: Zap },
  { id: "chart", label: "Chart", icon: BarChart3 },
  { id: "scanner", label: "Scanner", icon: ScanLine },
  { id: "timing", label: "Timing Intel", icon: Clock },
  { id: "checklist", label: "Scalp Checklist", icon: CheckSquare },
  { id: "ai-sniper", label: "AI Sniper", icon: Brain },
  { id: "backtest", label: "Backtest", icon: FlaskConical },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

// Show these tabs in the mobile bottom bar
const MOBILE_TABS = TABS.slice(0, 5);

export function Sidebar() {
  const { activeTab, setActiveTab } = useTradingStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-16 flex-col items-center border-r border-[#252532] bg-[#0a0a0f] py-4 lg:w-56">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700">
            <Zap className="h-5 w-5 text-black" />
          </div>
          <span className="hidden text-sm font-bold text-amber-400 lg:block">
            ICT Sniper AI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 w-full px-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-[#16161f]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:block truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="mt-auto px-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden text-xs text-zinc-500 lg:block">Live</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-[#252532] bg-[#0a0a0f]/95 backdrop-blur-md px-1 py-2 safe-bottom">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all duration-200 min-w-0",
                isActive
                  ? "text-amber-400"
                  : "text-zinc-500"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] truncate max-w-[56px]">
                {tab.id === "command-center" ? "Home" : tab.label}
              </span>
            </button>
          );
        })}

        {/* More menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all duration-200",
            mobileMenuOpen ? "text-amber-400" : "text-zinc-500"
          )}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 shrink-0" />
          ) : (
            <Menu className="h-5 w-5 shrink-0" />
          )}
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* Mobile "More" menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu panel */}
          <div className="absolute bottom-16 left-4 right-4 rounded-xl border border-[#252532] bg-[#111118] p-3 shadow-2xl">
            <div className="grid grid-cols-4 gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg p-3 transition-all duration-200",
                      isActive
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-zinc-400 hover:bg-[#16161f]"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] text-center leading-tight">
                      {tab.id === "command-center" ? "Home" : tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
