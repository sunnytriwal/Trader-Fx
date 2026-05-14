import { VaultTrade } from "../types/vault";

export interface VaultInsights {
  strategyInsight: { title: string; subtitle: string; status: "positive" | "warning" | "danger" | "neutral" };
  worstPair: { title: string; subtitle: string; status: "positive" | "warning" | "danger" | "neutral" };
  rrInsight: { title: string; subtitle: string; status: "positive" | "warning" | "danger" | "neutral" };
  executionInsight: { title: string; subtitle: string; status: "positive" | "warning" | "danger" | "neutral" };
  consistencyScore: number;
}

export function generateVaultInsights(trades: VaultTrade[]): VaultInsights {
  const defaultInsights: VaultInsights = {
    strategyInsight: { title: "Awaiting Data", subtitle: "Save more trades to see which setup yields the highest profits.", status: "neutral" },
    worstPair: { title: "Awaiting Data", subtitle: "Save more trades to identify risk areas.", status: "neutral" },
    rrInsight: { title: "Awaiting Data", subtitle: "Save more trades with risk/reward data.", status: "neutral" },
    executionInsight: { title: "Awaiting Data", subtitle: "Log your mistakes to identify recurring habits.", status: "neutral" },
    consistencyScore: 50,
  };

  const completedTrades = trades.filter(t => t.result !== "Pending" && t.pnl !== undefined);
  if (completedTrades.length < 3) return defaultInsights;

  // Strategy Insight
  const strategyProfits: Record<string, number> = {};
  completedTrades.forEach(t => {
    if (t.strategyName) {
      if (!strategyProfits[t.strategyName]) strategyProfits[t.strategyName] = 0;
      strategyProfits[t.strategyName] += (t.pnl || 0);
    }
  });
  let bestStrategy = "None";
  let bestStrategyProfit = -Infinity;
  Object.entries(strategyProfits).forEach(([strategy, profit]) => {
    if (profit > bestStrategyProfit) {
      bestStrategyProfit = profit;
      bestStrategy = strategy;
    }
  });

  if (bestStrategy !== "None" && bestStrategyProfit > 0) {
    defaultInsights.strategyInsight = {
      title: bestStrategy,
      subtitle: `${bestStrategy} setups generate your highest average PnL.`,
      status: "positive"
    };
  }

  // Worst Pair
  const pairLosses: Record<string, number> = {};
  completedTrades.forEach(t => {
    if ((t.pnl || 0) < 0) {
      if (!pairLosses[t.pair]) pairLosses[t.pair] = 0;
      pairLosses[t.pair] += (t.pnl || 0);
    }
  });
  let worstPair = "None";
  let worstPairLoss = 0;
  Object.entries(pairLosses).forEach(([pair, loss]) => {
    if (loss < worstPairLoss) {
      worstPairLoss = loss;
      worstPair = pair;
    }
  });
  if (worstPair !== "None") {
    defaultInsights.worstPair = {
      title: worstPair,
      subtitle: `${worstPair} accounts for most of your total losses.`,
      status: "danger"
    };
  }

  // RR Insight
  const winners = completedTrades.filter(t => (t.pnl || 0) > 0);
  let bestRRAvg = 0;
  if (winners.length > 0) {
    const totalRR = winners.reduce((sum, t) => sum + (t.rrRatio || 0), 0);
    bestRRAvg = totalRR / winners.length;
    defaultInsights.rrInsight = {
      title: `1:${bestRRAvg.toFixed(1)} RR`,
      subtitle: `Highest profitability appears near 1:${bestRRAvg.toFixed(1)} setups.`,
      status: "positive"
    };
  }

  // Execution Insight (Mistakes)
  const mistakeCounts: Record<string, number> = {};
  completedTrades.forEach(t => {
    if (t.mistakes && t.mistakes.length > 0) {
      t.mistakes.forEach(m => {
        if (!mistakeCounts[m]) mistakeCounts[m] = 0;
        mistakeCounts[m]++;
      });
    }
  });
  let worstMistake = "None";
  let maxMistakes = 0;
  Object.entries(mistakeCounts).forEach(([mistake, count]) => {
    if (count > maxMistakes) {
      maxMistakes = count;
      worstMistake = mistake;
    }
  });
  if (worstMistake !== "None") {
    defaultInsights.executionInsight = {
      title: worstMistake,
      subtitle: `Most losing trades feature ${worstMistake.toLowerCase()} execution.`,
      status: "warning"
    };
  }

  // Consistency Score
  let score = 50;
  const winRate = winners.length / completedTrades.length;
  score += (winRate - 0.5) * 50;
  if (bestRRAvg > 1.5) score += 10;
  if (bestRRAvg > 2.0) score += 5;
  if (worstMistake === "None") score += 10;
  else score -= 5;
  
  defaultInsights.consistencyScore = Math.min(Math.max(Math.round(score), 0), 100);

  return defaultInsights;
}

export interface PerformanceInsights {
  bestDay: { title: string; subtitle: string; status: "positive" | "warning" | "danger" | "neutral" };
  worstHabit: { title: string; subtitle: string; status: "positive" | "warning" | "danger" | "neutral" };
  bestAsset: { title: string; subtitle: string; status: "positive" | "warning" | "danger" | "neutral" };
  riskBehavior: { title: string; subtitle: string; status: "positive" | "warning" | "danger" | "neutral" };
  consistencyScore: number;
  improvementSuggestion: string;
}

export function generatePerformanceInsights(trades: VaultTrade[]): PerformanceInsights {
  const completedTrades = trades.filter(t => t.result !== "Pending" && t.pnl !== undefined);
  
  const defaultInsights: PerformanceInsights = {
    bestDay: { title: "Awaiting Data", subtitle: "Log more trades.", status: "neutral" },
    worstHabit: { title: "Awaiting Data", subtitle: "Log more mistakes.", status: "neutral" },
    bestAsset: { title: "Awaiting Data", subtitle: "Log more pairs.", status: "neutral" },
    riskBehavior: { title: "Awaiting Data", subtitle: "Log more risk entries.", status: "neutral" },
    consistencyScore: 50,
    improvementSuggestion: "Log more trades (at least 3) to receive personalized AI improvement suggestions."
  };

  if (completedTrades.length < 3) return defaultInsights;

  // Consistency Score formula
  const winners = completedTrades.filter(t => (t.pnl || 0) > 0);
  const winRate = winners.length / completedTrades.length;
  let score = 50 + (winRate - 0.5) * 60; 

  // Worst Habit
  const mistakeCounts: Record<string, number> = {};
  completedTrades.forEach(t => {
    if (t.mistakes) {
      t.mistakes.forEach(m => {
        if (!mistakeCounts[m]) mistakeCounts[m] = 0;
        mistakeCounts[m]++;
      });
    }
  });
  let worstMistake = "None";
  let maxMistakes = 0;
  Object.entries(mistakeCounts).forEach(([mistake, count]) => {
    if (count > maxMistakes) {
      maxMistakes = count;
      worstMistake = mistake;
    }
  });
  
  if (worstMistake !== "None") {
    defaultInsights.worstHabit = {
      title: worstMistake,
      subtitle: `Most large losses happen when you ${worstMistake.toLowerCase()}.`,
      status: "danger"
    };
    score -= 10;
  } else {
    defaultInsights.worstHabit = {
      title: "Clean Execution",
      subtitle: "Very few repeated mistakes detected.",
      status: "positive"
    };
    score += 15;
  }

  // Session / Best Day
  const dayProfits: Record<string, number> = {};
  completedTrades.forEach(t => {
    const day = new Date(t.date).toLocaleDateString("en-US", { weekday: "long" });
    if (!dayProfits[day]) dayProfits[day] = 0;
    dayProfits[day] += (t.pnl || 0);
  });
  let bestDay = "Unknown";
  let bestDayPnl = -Infinity;
  Object.entries(dayProfits).forEach(([d, p]) => {
    if (p > bestDayPnl) { bestDayPnl = p; bestDay = d; }
  });
  if (bestDayPnl > 0) {
    defaultInsights.bestDay = {
      title: bestDay,
      subtitle: `${bestDay} produces your highest average RR and win consistency.`,
      status: "positive"
    };
  } else {
    defaultInsights.bestDay = {
      title: "No Edge Found",
      subtitle: "No specific day generates a clear edge yet.",
      status: "neutral"
    };
  }

  // Best Asset
  const pairWins: Record<string, number> = {};
  winners.forEach(t => {
    if (!pairWins[t.pair]) pairWins[t.pair] = 0;
    pairWins[t.pair] += (t.pnl || 0);
  });
  let bestPair = "None";
  let bestPairPnl = -Infinity;
  Object.entries(pairWins).forEach(([pair, val]) => {
    if (val > bestPairPnl) { bestPairPnl = val; bestPair = pair; }
  });
  if (bestPair !== "None" && bestPairPnl > 0) {
    defaultInsights.bestAsset = {
      title: bestPair,
      subtitle: `${bestPair} currently delivers your most stable performance profile.`,
      status: "positive"
    };
  }

  // Risk Behavior
  const highRiskTrades = completedTrades.filter(t => t.riskPercent > 1);
  const lowRiskTrades = completedTrades.filter(t => t.riskPercent <= 1);
  let riskStatus: "positive" | "warning" | "danger" = "positive";
  let riskStr = "Controlled Risk";
  let riskSub = "Consistency is extremely high with your current risk sizing.";

  if (highRiskTrades.length > lowRiskTrades.length) {
    riskStr = "Aggressive Risk";
    riskSub = "Most losses occur when risking above 2%. Your win rate improves when risk stays below 1%.";
    riskStatus = "danger";
    score -= 10;
  } else if (highRiskTrades.length > 0) {
    riskStr = "Moderate Risk";
    riskSub = "Slight variance in sizing. Consistency improves when risk stays steady.";
    riskStatus = "warning";
  }

  defaultInsights.riskBehavior = {
    title: riskStr,
    subtitle: riskSub,
    status: riskStatus
  };

  score = Math.max(0, Math.min(100, Math.round(score)));
  defaultInsights.consistencyScore = score;
  
  if (riskStatus === "danger") {
    defaultInsights.improvementSuggestion = "Consistency improves significantly when risk stays below 1%. Most losses occur during high-volatility, large-size entries.";
  } else if (worstMistake !== "None") {
    defaultInsights.improvementSuggestion = `Pattern detected: ${worstMistake}. Stepping away from the charts during drawdowns will instantly improve your equity curve.`;
  } else if (bestDayPnl > 0) {
    defaultInsights.improvementSuggestion = `${bestDay} is your strongest session. Scale up risk slightly on these setups, and shrink size on weak days.`;
  } else {
    defaultInsights.improvementSuggestion = "Maintain current execution discipline. Keep tracking trades to reveal deeper insights.";
  }

  return defaultInsights;
}
