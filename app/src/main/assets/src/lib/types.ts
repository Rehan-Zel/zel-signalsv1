export type Bias = "Bullish" | "Bearish";

export interface Signal {
  symbol: string;
  timeframe: string;
  bias: Bias;
  confidence: number;
  entry: number;
  takeProfit: number;
  stopLoss: number;
  reasoning: string;
  currentPrice?: number;
  generatedAt: number;
}

export type TradeStatus = "pending" | "win" | "loss";

export interface PaperTrade extends Signal {
  id: string;
  status: TradeStatus;
  loggedAt: number;
}

export const STORAGE_KEYS = {
  twelveData: "zel_twelve_data_key",
  openRouter: "zel_openrouter_key",
  trades: "zel_paper_trades",
} as const;
