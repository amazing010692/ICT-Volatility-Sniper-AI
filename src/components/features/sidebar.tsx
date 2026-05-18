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
} from "lucide-react";

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

export function Sidebar() {
  const { activeTab, setActiveTab } = useTradingStore();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center border-r border-[#252532] bg-[#0a0a0f] py-4 lg:w-56">
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
  );
}
