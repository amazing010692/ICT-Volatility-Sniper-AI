"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CheckSquare, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { ChecklistItem } from "@/types";

export function ChecklistPanel() {
  const { checklist, signal } = useTradingStore();

  if (!checklist) {
    return (
      <Card>
        <div className="h-48 flex items-center justify-center">
          <span className="text-zinc-500 text-sm">Loading checklist...</span>
        </div>
      </Card>
    );
  }

  const activeList = signal?.direction === "BUY"
    ? checklist.buyConditions
    : signal?.direction === "SELL"
      ? checklist.sellConditions
      : checklist.waitConditions;

  const metCount = activeList.filter((item) => item.status === "MET").length;
  const totalCount = activeList.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-amber-400" />
          <CardTitle>Scalp Checklist</CardTitle>
        </div>
        <Badge variant={metCount >= totalCount * 0.7 ? "success" : metCount >= totalCount * 0.5 ? "warning" : "danger"}>
          {metCount}/{totalCount}
        </Badge>
      </CardHeader>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {activeList.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const statusConfig = {
    MET: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/5" },
    FAILED: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/5" },
    WARNING: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/5" },
  };

  const config = statusConfig[item.status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg p-2.5", config.bg)}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-200">{item.label}</p>
        <p className="text-xs text-zinc-500 truncate">{item.description}</p>
      </div>
      <span className="text-xs text-zinc-600 shrink-0">
        {(item.weight * 100).toFixed(0)}%
      </span>
    </div>
  );
}
