export interface MarketAsset {
  name: string;
  type:
    | "forex_major"
    | "forex_minor"
    | "forex_exotic"
    | "commodity"
    | "crypto"
    | "metals";
  searchTerms: string[];
}

export const ASSETS: MarketAsset[] = [
  // Forex Majors
  {
    name: "EURUSD",
    type: "forex_major",
    searchTerms: ["eurusd", "eur", "usd"],
  },
  {
    name: "GBPUSD",
    type: "forex_major",
    searchTerms: ["gbpusd", "gbp", "usd"],
  },
  {
    name: "USDJPY",
    type: "forex_major",
    searchTerms: ["usdjpy", "usd", "jpy"],
  },
  {
    name: "USDCHF",
    type: "forex_major",
    searchTerms: ["usdchf", "usd", "chf"],
  },
  {
    name: "AUDUSD",
    type: "forex_major",
    searchTerms: ["audusd", "aud", "usd"],
  },
  {
    name: "USDCAD",
    type: "forex_major",
    searchTerms: ["usdcad", "usd", "cad"],
  },
  {
    name: "NZDUSD",
    type: "forex_major",
    searchTerms: ["nzdusd", "nzd", "usd"],
  },

  // Forex Minors
  {
    name: "EURGBP",
    type: "forex_minor",
    searchTerms: ["eurgbp", "eur", "gbp"],
  },
  {
    name: "EURAUD",
    type: "forex_minor",
    searchTerms: ["euraud", "eur", "aud"],
  },
  {
    name: "EURJPY",
    type: "forex_minor",
    searchTerms: ["eurjpy", "eur", "jpy"],
  },
  {
    name: "EURCHF",
    type: "forex_minor",
    searchTerms: ["eurchf", "eur", "chf"],
  },
  {
    name: "GBPJPY",
    type: "forex_minor",
    searchTerms: ["gbpjpy", "gbp", "jpy"],
  },
  {
    name: "GBPAUD",
    type: "forex_minor",
    searchTerms: ["gbpaud", "gbp", "aud"],
  },
  {
    name: "GBPCHF",
    type: "forex_minor",
    searchTerms: ["gbpchf", "gbp", "chf"],
  },
  {
    name: "AUDJPY",
    type: "forex_minor",
    searchTerms: ["audjpy", "aud", "jpy"],
  },
  {
    name: "AUDCAD",
    type: "forex_minor",
    searchTerms: ["audcad", "aud", "cad"],
  },
  {
    name: "AUDNZD",
    type: "forex_minor",
    searchTerms: ["audnzd", "aud", "nzd"],
  },
  {
    name: "NZDJPY",
    type: "forex_minor",
    searchTerms: ["nzdjpy", "nzd", "jpy"],
  },
  {
    name: "CADJPY",
    type: "forex_minor",
    searchTerms: ["cadjpy", "cad", "jpy"],
  },
  {
    name: "CHFJPY",
    type: "forex_minor",
    searchTerms: ["chfjpy", "chf", "jpy"],
  },

  // Forex Exotics
  {
    name: "USDINR",
    type: "forex_exotic",
    searchTerms: ["usdinr", "usd", "inr"],
  },
  {
    name: "EURINR",
    type: "forex_exotic",
    searchTerms: ["eurinr", "eur", "inr"],
  },
  {
    name: "GBPINR",
    type: "forex_exotic",
    searchTerms: ["gbpinr", "gbp", "inr"],
  },
  {
    name: "USDTRY",
    type: "forex_exotic",
    searchTerms: ["usdtry", "usd", "try"],
  },
  {
    name: "USDZAR",
    type: "forex_exotic",
    searchTerms: ["usdzar", "usd", "zar"],
  },
  {
    name: "USDSGD",
    type: "forex_exotic",
    searchTerms: ["usdsgd", "usd", "sgd"],
  },
  {
    name: "USDHKD",
    type: "forex_exotic",
    searchTerms: ["usdhkd", "usd", "hkd"],
  },
  {
    name: "USDMXN",
    type: "forex_exotic",
    searchTerms: ["usdmxn", "usd", "mxn"],
  },
  {
    name: "USDBRL",
    type: "forex_exotic",
    searchTerms: ["usdbrl", "usd", "brl"],
  },
  {
    name: "USDSEK",
    type: "forex_exotic",
    searchTerms: ["usdsek", "usd", "sek"],
  },
  {
    name: "USDNOK",
    type: "forex_exotic",
    searchTerms: ["usdnok", "usd", "nok"],
  },

  // Commodities
  {
    name: "WTI Crude Oil",
    type: "commodity",
    searchTerms: ["wti", "crude", "oil", "usoil"],
  },
  {
    name: "Brent Crude Oil",
    type: "commodity",
    searchTerms: ["brent", "crude", "oil", "ukoil"],
  },

  // Metals
  {
    name: "XAUUSD",
    type: "metals",
    searchTerms: ["xauusd", "gold", "xau", "usd"],
  },
  {
    name: "XAGUSD",
    type: "metals",
    searchTerms: ["xagusd", "silver", "xag", "usd"],
  },

  // Crypto
  {
    name: "BTCUSD",
    type: "crypto",
    searchTerms: ["btcusd", "bitcoin", "btc", "usd"],
  },
  {
    name: "ETHUSD",
    type: "crypto",
    searchTerms: ["ethusd", "ethereum", "eth", "usd"],
  },
  {
    name: "SOLUSD",
    type: "crypto",
    searchTerms: ["solusd", "solana", "sol", "usd"],
  },
];

// Provide some mock initial data for realism
export const generateMockPairData = (pair: string) => {
  const isJpy = pair.includes("JPY");
  let basePrice = isJpy ? 140 + Math.random() * 20 : 1 + Math.random() * 0.5;
  if (pair.includes("ZAR") || pair.includes("MXN") || pair.includes("TRY")) {
    basePrice = 15 + Math.random() * 10;
  }

  const spread = (Math.random() * (isJpy ? 0.05 : 0.0005)).toFixed(1);
  const changePercent = Math.random() * 2 - 1;
  const isBullish = changePercent > 0;

  const high = basePrice * (1 + Math.random() * 0.005);
  const low = basePrice * (1 - Math.random() * 0.005);

  return {
    pair,
    price: basePrice.toFixed(isJpy ? 3 : 5),
    change: changePercent.toFixed(2) + "%",
    isBullish,
    spread: isJpy ? spread : parseFloat(spread).toFixed(1), // mock spread
    high: high.toFixed(isJpy ? 3 : 5),
    low: low.toFixed(isJpy ? 3 : 5),
  };
};
