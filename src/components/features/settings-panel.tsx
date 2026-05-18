"use client";

import { useTradingStore } from "@/store";
import { Card, CardHeader, CardTitle, Button } from "@/components/ui";
import { Settings, RotateCcw } from "lucide-react";
import { DEFAULT_SETTINGS } from "@/config";

export function SettingsPanel() {
  const { settings, setSettings } = useTradingStore();

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-zinc-400" />
          <CardTitle>Strategy Settings</CardTitle>
        </div>
        <Button size="sm" variant="ghost" onClick={resetSettings}>
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </CardHeader>

      <div className="space-y-4">
        {/* EMA Settings */}
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-2">EMA Periods</p>
          <div className="grid grid-cols-3 gap-2">
            <SettingInput
              label="Fast"
              value={settings.emaFast}
              onChange={(v) => setSettings({ emaFast: v })}
            />
            <SettingInput
              label="Medium"
              value={settings.emaMedium}
              onChange={(v) => setSettings({ emaMedium: v })}
            />
            <SettingInput
              label="Slow"
              value={settings.emaSlow}
              onChange={(v) => setSettings({ emaSlow: v })}
            />
          </div>
        </div>

        {/* Volatility Settings */}
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-2">Volatility</p>
          <div className="grid grid-cols-2 gap-2">
            <SettingInput
              label="ATR Period"
              value={settings.atrPeriod}
              onChange={(v) => setSettings({ atrPeriod: v })}
            />
            <SettingInput
              label="ADX Period"
              value={settings.adxPeriod}
              onChange={(v) => setSettings({ adxPeriod: v })}
            />
          </div>
        </div>

        {/* Thresholds */}
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-2">Thresholds</p>
          <div className="grid grid-cols-2 gap-2">
            <SettingInput
              label="ADX Threshold"
              value={settings.adxThreshold}
              onChange={(v) => setSettings({ adxThreshold: v })}
            />
            <SettingInput
              label="Risk %"
              value={settings.riskPercent}
              onChange={(v) => setSettings({ riskPercent: v })}
              step={0.5}
            />
          </div>
        </div>

        {/* Sensitivity */}
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-2">Signal Sensitivity</p>
          <div className="flex gap-2">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setSettings({ signalSensitivity: level })}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  settings.signalSensitivity === level
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-[#16161f] text-zinc-500 border border-transparent hover:text-zinc-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Current config summary */}
        <div className="rounded-lg bg-[#16161f] p-3">
          <p className="text-xs text-zinc-500 mb-1">Active Configuration</p>
          <p className="text-xs text-zinc-400">
            EMA: {settings.emaFast}/{settings.emaMedium}/{settings.emaSlow} | ATR: {settings.atrPeriod} | ADX: {settings.adxThreshold} | Sensitivity: {settings.signalSensitivity}
          </p>
        </div>
      </div>
    </Card>
  );
}

function SettingInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="rounded-lg bg-[#16161f] p-2">
      <label className="text-xs text-zinc-500 block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        className="w-full bg-transparent text-sm text-zinc-200 font-mono outline-none border-b border-zinc-700 focus:border-amber-500 pb-0.5"
      />
    </div>
  );
}
