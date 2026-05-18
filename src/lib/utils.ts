import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price with appropriate decimal places */
export function formatPrice(price: number, pair: string = "XAUUSD"): string {
  if (pair === "XAUUSD" || pair === "USDJPY" || pair === "GBPJPY" || pair === "NAS100" || pair === "US30") {
    return price.toFixed(2);
  }
  return price.toFixed(5);
}

/** Format percentage */
export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/** Format timestamp to readable time */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Get color class based on direction */
export function getDirectionColor(direction: "BUY" | "SELL" | "WAIT" | "BULLISH" | "BEARISH" | "NEUTRAL"): string {
  switch (direction) {
    case "BUY":
    case "BULLISH":
      return "text-emerald-400";
    case "SELL":
    case "BEARISH":
      return "text-red-400";
    default:
      return "text-zinc-400";
  }
}

/** Get background color class based on direction */
export function getDirectionBg(direction: "BUY" | "SELL" | "WAIT" | "BULLISH" | "BEARISH" | "NEUTRAL"): string {
  switch (direction) {
    case "BUY":
    case "BULLISH":
      return "bg-emerald-500/10 border-emerald-500/30";
    case "SELL":
    case "BEARISH":
      return "bg-red-500/10 border-red-500/30";
    default:
      return "bg-zinc-500/10 border-zinc-500/30";
  }
}
