"use client";

import { useEffect, useRef, useState } from "react";
import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { BarChart3, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChartWidget() {
  const { selectedPair, marketData } = useTradingStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !marketData) return;

    // Map pair names to TradingView symbols
    const TV_SYMBOLS: Record<string, string> = {
      XAUUSD: "OANDA:XAUUSD",
      EURUSD: "OANDA:EURUSD",
      GBPUSD: "OANDA:GBPUSD",
      USDJPY: "OANDA:USDJPY",
      GBPJPY: "OANDA:GBPJPY",
      NAS100: "PEPPERSTONE:NAS100",
      US30: "PEPPERSTONE:US30",
    };

    const symbol = TV_SYMBOLS[selectedPair] || `OANDA:${selectedPair}`;

    // TradingView widget embed
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#0a0a0f",
      gridColor: "#16161f",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      allow_symbol_change: true,
      support_host: "https://www.tradingview.com",
    });

    // Clear previous widget
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [selectedPair, marketData, isFullscreen]);

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col">
        {/* Fullscreen header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#252532]">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-zinc-200">{selectedPair} — M1 Chart</span>
            <Badge variant="info">Live</Badge>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#16161f] transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
            Exit
          </button>
        </div>
        {/* Fullscreen chart */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden"
        >
          <div className="flex items-center justify-center h-full">
            <span className="text-zinc-500 text-sm">Loading chart...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-[460px] md:h-[560px] chart-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-cyan-400" />
          <CardTitle>{selectedPair} — M1 Chart</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-[#16161f] transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <Badge variant="info">Live</Badge>
        </div>
      </CardHeader>
      <div
        ref={containerRef}
        className="tradingview-widget-container h-[410px] md:h-[510px] rounded-lg bg-[#16161f]"
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-zinc-500 text-sm">Loading chart...</span>
        </div>
      </div>
    </Card>
  );
}
