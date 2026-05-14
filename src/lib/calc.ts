export type AssetType = "forex" | "jpy" | "gold" | "crypto" | "commodity" | "indices";

export interface CalcInputs {
  balance: number | "";
  riskPercent: number | "";
  entryPrice: number | "";
  stopLoss: number | "";
  takeProfit: number | "";
  assetType: AssetType;
  pair: string;
  useManualPipValue: boolean;
  manualPipValue: number | "";
}

export interface CalcResults {
  tradeType: "BUY" | "SELL" | null;
  riskAmount: number;
  pipDistance: number;
  distanceUnit: "Pips" | "Points";
  lotSize: number;
  riskRewardRatio: number | null;
  potentialProfit: number | null;
  pipValueUsed: number;
}

export function calculateTrade(inputs: CalcInputs): CalcResults {
  const {
    balance,
    riskPercent,
    entryPrice,
    stopLoss,
    takeProfit,
    assetType,
    useManualPipValue,
    manualPipValue,
  } = inputs;

  if (
    balance === "" ||
    balance <= 0 ||
    riskPercent === "" ||
    riskPercent <= 0 ||
    entryPrice === "" ||
    entryPrice <= 0 ||
    stopLoss === "" ||
    stopLoss <= 0 ||
    entryPrice === stopLoss
  ) {
    return {
      tradeType: null,
      riskAmount: 0,
      pipDistance: 0,
      distanceUnit: "Pips",
      lotSize: 0,
      riskRewardRatio: null,
      potentialProfit: null,
      pipValueUsed: 0,
    };
  }

  const riskAmount = Number(balance) * (Number(riskPercent) / 100);
  const tradeType = Number(entryPrice) > Number(stopLoss) ? "BUY" : "SELL";

  let pipSize = 0.0001;
  let defaultPipValue = 10;
  let distanceUnit: "Pips" | "Points" = "Pips";

  switch (assetType) {
    case "forex":
      pipSize = 0.0001;
      defaultPipValue = (0.0001 / Number(entryPrice)) * 100000;
      distanceUnit = "Pips";
      break;
    case "jpy":
      pipSize = 0.01;
      defaultPipValue = (0.01 / Number(entryPrice)) * 100000;
      distanceUnit = "Pips";
      break;
    case "gold":
      pipSize = 0.1;
      defaultPipValue = 10;
      distanceUnit = "Points";
      break;
    case "crypto":
      pipSize = 1;
      defaultPipValue = 1;
      distanceUnit = "Points";
      break;
    case "commodity":
      pipSize = 0.01;
      defaultPipValue = 10;
      distanceUnit = "Points";
      break;
    case "indices":
      pipSize = 1;
      defaultPipValue = 1;
      distanceUnit = "Points";
      break;
  }

  const pipValue =
    useManualPipValue && manualPipValue !== ""
      ? Number(manualPipValue)
      : defaultPipValue;
  const pipDistance = Math.abs(Number(entryPrice) - Number(stopLoss)) / pipSize;

  let lotSize = 0;
  if (pipDistance > 0 && pipValue > 0) {
    lotSize = riskAmount / (pipDistance * pipValue);
  }

  let riskRewardRatio = null;
  let potentialProfit = null;

  if (
    takeProfit !== "" &&
    Number(takeProfit) > 0 &&
    Number(takeProfit) !== Number(entryPrice)
  ) {
    // Basic verification that TP makes sense for trade direction
    const isValidTP =
      tradeType === "BUY"
        ? Number(takeProfit) > Number(entryPrice)
        : Number(takeProfit) < Number(entryPrice);

    if (isValidTP) {
      const rewardPips =
        Math.abs(Number(takeProfit) - Number(entryPrice)) / pipSize;
      if (pipDistance > 0) {
        riskRewardRatio = rewardPips / pipDistance;
        potentialProfit = riskAmount * riskRewardRatio;
      }
    }
  }

  return {
    tradeType,
    riskAmount,
    pipDistance,
    distanceUnit,
    lotSize,
    riskRewardRatio,
    potentialProfit,
    pipValueUsed: pipValue,
  };
}
