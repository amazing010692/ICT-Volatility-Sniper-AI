"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variants = {
      default: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
      ghost: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
      outline: "border-[#252532] text-zinc-300 hover:bg-[#16161f] hover:border-zinc-600",
      danger: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
      success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    };

    const sizes = {
      sm: "h-7 px-2.5 text-xs",
      md: "h-9 px-4 text-sm",
      lg: "h-11 px-6 text-base",
      icon: "h-9 w-9",
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
