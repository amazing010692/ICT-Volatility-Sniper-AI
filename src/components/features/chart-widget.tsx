"use client";

import { useEffect, useRef } from "react";
import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { BarChart3 } from "lucide-react";

export function ChartWidget() {
  const { selectedPair, marketData } = useTradingStore();
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [selectedPair, marketData]);

  return (
    <Card className="h-[320px] md:h-[400px]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-cyan-400" />
          <CardTitle>{selectedPair} — M1 Chart</CardTitle>
        </div>
        <Badge variant="info">Live</Badge>
      </CardHeader>
      <div
        ref={containerRef}
        className="tradingview-widget-container h-[260px] md:h-[340px] rounded-lg overflow-hidden bg-[#16161f]"
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-zinc-500 text-sm">Loading chart...</span>
        </div>
      </div>
    </Card>
  );
}
