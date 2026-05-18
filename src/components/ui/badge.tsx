"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info";
  className?: string;
  pulse?: boolean;
}

export function Badge({ children, variant = "default", className, pulse }: BadgeProps) {
  const variants = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border",
        variants[variant],
        pulse && "animate-pulse",
        className
      )}
    >
      {children}
    </span>
  );
}
