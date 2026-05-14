export type TradeResult = "Pending" | "Win" | "Loss" | "Break Even";
export type TradeMistake = "Overtrading" | "Early entry" | "Fear exit" | "Revenge trade" | "No confirmation" | "FOMO entry" | "Other";

export interface VaultTrade {
  id: string;
  date: string; // ISO format
  pair: string;
  direction: "Long" | "Short";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskPercent: number;
  riskAmount: number;
  rrRatio: number;

  // Custom User Inputs
  strategyName: string;
  notes: string;
  result: TradeResult;
  pnl: number;
  mistakes: TradeMistake[];
  screenshot?: string; // Data URL or external link
}
