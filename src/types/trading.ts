// ================================================
// ICT Volatility Sniper AI — Type Definitions
// Elite M1 XAUUSD Scalping Platform
// ================================================

export type TradingPair = "XAUUSD" | "EURUSD" | "GBPUSD" | "USDJPY" | "GBPJPY" | "NAS100" | "US30";
export type SignalDirection = "BUY" | "SELL" | "WAIT";
export type MarketSession = "ASIAN" | "LONDON" | "NEW_YORK" | "CLOSED";
export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";
export type TrendDirection = "BULLISH" | "BEARISH" | "NEUTRAL";
export type ChecklistStatus = "MET" | "FAILED" | "WARNING";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  pair: TradingPair;
  timeframe: Timeframe;
  candles: Candle[];
  currentPrice: number;
  spread: number;
  lastUpdated: number;
}

export interface EMAAnalysis {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  alignment: TrendDirection;
  crossover: "BULLISH_CROSS" | "BEARISH_CROSS" | "NONE";
}

export interface MarketStructure {
  trend: TrendDirection;
  breakOfStructure: boolean;
  bosDirection: TrendDirection | null;
  higherHighs: boolean;
  lowerLows: boolean;
  lastSwingHigh: number;
  lastSwingLow: number;
}

export interface LiquidityAnalysis {
  sweepDetected: boolean;
  sweepDirection: "ABOVE" | "BELOW" | null;
  sweepLevel: number | null;
  liquidityZones: { price: number; strength: number }[];
}

export interface VolatilityAnalysis {
  atr: number;
  atrPercent: number;
  isVolatile: boolean;
  adx: number;
  adxStrong: boolean;
}

export interface SessionAnalysis {
  currentSession: MarketSession;
  asianHigh: number;
  asianLow: number;
  asianRange: number;
  londonBreakout: boolean;
  londonBreakoutDirection: TrendDirection | null;
  vwap: number;
  priceAboveVwap: boolean;
}

export interface MomentumAnalysis {
  candleMomentum: "STRONG_BULLISH" | "STRONG_BEARISH" | "WEAK" | "NEUTRAL";
  bodyToWickRatio: number;
  consecutiveBullish: number;
  consecutiveBearish: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  description: string;
  weight: number;
}

export interface TradingChecklist {
  buyConditions: ChecklistItem[];
  sellConditions: ChecklistItem[];
  waitConditions: ChecklistItem[];
}

export interface TradingSignal {
  direction: SignalDirection;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  tradeQuality: "A+" | "A" | "B" | "C" | "NO_TRADE";
  reasoning: string[];
  timestamp: number;
}

export type EntryTiming = "OPTIMAL" | "ACCEPTABLE" | "LATE" | "TOO_LATE" | "MISSED";
export type PositionAction = "HOLD" | "CLOSE_NOW" | "PARTIAL_CLOSE" | "TRAIL_STOP" | "ADD_POSITION" | "NO_POSITION";

export interface TimingIntelligence {
  entryTiming: EntryTiming;
  entryTimingScore: number;
  entryTimingReason: string;
  moveExhaustion: number;
  averageMoveSize: number;
  currentMoveSize: number;
  movePercentComplete: number;
  positionAction: PositionAction;
  positionActionReason: string;
  closeConfidence: number;
  patternName: string;
  patternProbability: number;
  historicalWinRate: number;
  expectedRemainingMove: number;
  nearestSupport: number;
  nearestResistance: number;
  distanceToTarget: number;
  distanceToInvalidation: number;
  sessionLevels: {
    asianHigh: number;
    asianLow: number;
    londonHigh: number;
    londonLow: number;
    nyHigh: number;
    nyLow: number;
    prevDayHigh: number;
    prevDayLow: number;
  };
  htfLevels: {
    h1Resistance: number;
    h1Support: number;
    m15Resistance: number;
    m15Support: number;
  };
  sessionTimeRemaining: number;
  optimalEntryWindow: boolean;
  lateEntryPenalty: number;
}

export interface StrategySettings {
  emaFast: number;
  emaMedium: number;
  emaSlow: number;
  ema200: number;
  atrPeriod: number;
  atrThreshold: number;
  adxPeriod: number;
  adxThreshold: number;
  riskPercent: number;
  timeframe: Timeframe;
  sessionFilter: MarketSession[];
  signalSensitivity: "LOW" | "MEDIUM" | "HIGH";
}

export interface TradeJournal {
  id: string;
  pair: TradingPair;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  result: "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";
  pnl: number;
  notes: string;
  screenshot?: string;
  timestamp: number;
  session: MarketSession;
  confidence: number;
}

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  averageRR: number;
  maxDrawdown: number;
  netPnl: number;
  signals: TradingSignal[];
}

// SMC Engine Types
export interface OrderBlock {
  type: "BULLISH" | "BEARISH";
  high: number;
  low: number;
  mitigated: boolean;
  strength: number;
  timestamp: number;
}

export interface FairValueGap {
  type: "BULLISH" | "BEARISH";
  high: number;
  low: number;
  filled: boolean;
  size: number;
  timestamp: number;
}

export interface SMCAnalysis {
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  breakOfStructure: boolean;
  changeOfCharacter: boolean;
  displacement: boolean;
  displacementDirection: TrendDirection | null;
  premiumDiscount: "PREMIUM" | "DISCOUNT" | "EQUILIBRIUM";
  institutionalBias: TrendDirection;
  confluenceScore: number;
}

// MTF Engine Types
export interface TimeframeAnalysis {
  timeframe: Timeframe;
  trend: TrendDirection;
  strength: number;
  keyLevel: number;
  bias: TrendDirection;
}

export interface MTFAnalysis {
  h1: TimeframeAnalysis;
  m15: TimeframeAnalysis;
  m5: TimeframeAnalysis;
  m1: TimeframeAnalysis;
  overallBias: TrendDirection;
  confluenceScore: number;
  retailTrapDetected: boolean;
  retailTrapDirection: TrendDirection | null;
  scalpOpportunity: boolean;
  scalpDirection: SignalDirection;
  topDownConfirmation: boolean;
}

// AI Reasoning Types
export interface AIReasoning {
  marketCondition: string;
  institutionalNarrative: string;
  insights: string[];
  riskWarnings: string[];
  psychologyTips: string[];
  scoreBreakdown: {
    structure: number;
    momentum: number;
    liquidity: number;
    timing: number;
    overall: number;
  };
  recommendation: string;
  confidenceExplanation: string;
}
