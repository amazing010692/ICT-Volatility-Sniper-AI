"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  variant = "default",
  size = "md",
  className,
  showLabel = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    default: "bg-amber-500",
    success: "bg-emerald-500",
    danger: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-cyan-500",
  };

  const sizes = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full rounded-full bg-[#16161f] overflow-hidden", sizes[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-zinc-500 mt-1">{percentage.toFixed(0)}%</span>
      )}
    </div>
  );
}
