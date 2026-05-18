"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Badge, Progress } from "@/components/ui";
import { Brain, AlertTriangle, Lightbulb, Heart } from "lucide-react";

export function AIAssistant() {
  const { aiReasoning, signal } = useTradingStore();

  if (!aiReasoning) {
    return (
      <Card>
        <div className="h-48 flex items-center justify-center">
          <span className="text-zinc-500 text-sm">AI analyzing market...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <CardTitle>AI Sniper Intelligence</CardTitle>
        </div>
        <Badge variant="warning">
          Score: {aiReasoning.scoreBreakdown.overall.toFixed(0)}
        </Badge>
      </CardHeader>

      {/* Market Condition */}
      <div className="rounded-lg bg-[#16161f] p-3 mb-3">
        <p className="text-xs font-medium text-amber-400 mb-1">Market Condition</p>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {aiReasoning.marketCondition}
        </p>
      </div>

      {/* Institutional Narrative */}
      <div className="rounded-lg bg-[#16161f] p-3 mb-3">
        <p className="text-xs font-medium text-cyan-400 mb-1">Institutional Narrative</p>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {aiReasoning.institutionalNarrative}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2 mb-3">
        <p className="text-xs font-medium text-zinc-400">Score Breakdown</p>
        {Object.entries(aiReasoning.scoreBreakdown)
          .filter(([key]) => key !== "overall")
          .map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 w-20 capitalize">{key}</span>
              <Progress
                value={value}
                variant={value > 70 ? "success" : value > 50 ? "warning" : "danger"}
                size="sm"
                className="flex-1"
              />
              <span className="text-xs text-zinc-400 w-8">{value.toFixed(0)}</span>
            </div>
          ))}
      </div>

      {/* Insights */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-amber-400" />
          <p className="text-xs font-medium text-zinc-400">Insights</p>
        </div>
        {aiReasoning.insights.slice(0, 3).map((insight, i) => (
          <p key={i} className="text-xs text-zinc-400 pl-4">• {insight}</p>
        ))}
      </div>

      {/* Risk Warnings */}
      {aiReasoning.riskWarnings.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <p className="text-xs font-medium text-red-400">Risk Warnings</p>
          </div>
          {aiReasoning.riskWarnings.slice(0, 2).map((warning, i) => (
            <p key={i} className="text-xs text-red-400/70 pl-4">• {warning}</p>
          ))}
        </div>
      )}

      {/* Psychology */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Heart className="h-3 w-3 text-pink-400" />
          <p className="text-xs font-medium text-zinc-400">Psychology</p>
        </div>
        {aiReasoning.psychologyTips.slice(0, 2).map((tip, i) => (
          <p key={i} className="text-xs text-zinc-500 pl-4 italic">"{tip}"</p>
        ))}
      </div>

      {/* Recommendation */}
      <div className="mt-3 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
        <p className="text-xs font-semibold text-amber-400">
          {aiReasoning.recommendation}
        </p>
      </div>
    </Card>
  );
}
