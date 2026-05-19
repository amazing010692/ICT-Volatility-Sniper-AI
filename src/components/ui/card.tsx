"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "buy" | "sell" | "gold" | "none";
}

export function Card({ children, className, glow = "none" }: CardProps) {
  const glowClasses = {
    buy: "glow-buy",
    sell: "glow-sell",
    gold: "glow-gold",
    none: "",
  };

  return (
    <div
      className={cn(
        "card-elite rounded-xl border border-[#252532] bg-[#111118] p-3 md:p-4 overflow-hidden",
        glowClasses[glow],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn("text-sm font-semibold text-zinc-200", className)}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("", className)}>{children}</div>;
}
