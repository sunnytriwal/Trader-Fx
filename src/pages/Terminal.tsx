import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Activity, Database, Save, Search, Sun, Moon, ChevronRight, X, Eye, 
  TrendingUp, TrendingDown, Clock, Check, AlertCircle, Loader2,
  Target, History, LineChart, BarChart3, Sparkles, ArrowRight, Star, ChevronDown, BadgeCheck, ImageIcon, Calculator, Compass
} from "lucide-react";
import { cn } from "../lib/utils";
import { useVaultStore } from "../store/vaultStore";
import { AssetType, CalcInputs, calculateTrade } from "../lib/calc";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

function FaqItem({ q, a }: { q: string, a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-white/5 rounded-[1rem] overflow-hidden bg-white dark:bg-[#121218] group premium-hover">
       <button 
         onClick={() => setIsOpen(!isOpen)} 
         className="w-full px-5 py-4 flex items-center justify-between text-left gap-4"
       >
          <span className="font-bold text-sm dark:text-zinc-200 text-slate-800">{q}</span>
          <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform dark:text-zinc-500 text-slate-400", isOpen && "rotate-180 text-cyan-500")} />
       </button>
       <div className={cn("px-5 overflow-hidden transition-all duration-300", isOpen ? "max-h-40 pb-4 opacity-100" : "max-h-0 opacity-0")}>
          <p className="text-xs dark:text-zinc-400 text-slate-600 font-medium leading-relaxed">{a}</p>
       </div>
    </div>
  )
}

const MARKETS = [
  // Forex Majors & Minors
  { symbol: "EURUSD", name: "Euro vs US Dollar", category: "Forex", type: "forex" },
  { symbol: "GBPUSD", name: "Great British Pound vs US Dollar", category: "Forex", type: "forex" },
  { symbol: "USDJPY", name: "US Dollar vs Japanese Yen", category: "Forex", type: "jpy" },
  { symbol: "USDCAD", name: "US Dollar vs Canadian Dollar", category: "Forex", type: "forex" },
  { symbol: "USDCHF", name: "US Dollar vs Swiss Franc", category: "Forex", type: "forex" },
  { symbol: "AUDUSD", name: "Australian Dollar vs US Dollar", category: "Forex", type: "forex" },
  { symbol: "NZDUSD", name: "New Zealand Dollar vs US Dollar", category: "Forex", type: "forex" },
  { symbol: "EURJPY", name: "Euro vs Japanese Yen", category: "Forex", type: "jpy" },
  { symbol: "GBPJPY", name: "Great British Pound vs Japanese Yen", category: "Forex", type: "jpy" },
  { symbol: "AUDJPY", name: "Australian Dollar vs Japanese Yen", category: "Forex", type: "jpy" },
  { symbol: "EURGBP", name: "Euro vs Great British Pound", category: "Forex", type: "forex" },
  { symbol: "EURAUD", name: "Euro vs Australian Dollar", category: "Forex", type: "forex" },
  { symbol: "CHFJPY", name: "Swiss Franc vs Japanese Yen", category: "Forex", type: "jpy" },
  
  // Metals
  { symbol: "XAUUSD", name: "Gold vs US Dollar", category: "Gold", type: "gold" },
  { symbol: "XAGUSD", name: "Silver vs US Dollar", category: "Gold", type: "gold" },

  // Oil
  { symbol: "USOIL", name: "US WTI Crude Oil", category: "Oil", type: "commodity" },
  { symbol: "UKOIL", name: "Brent Crude Oil", category: "Oil", type: "commodity" },

  // Indices
  { symbol: "US30", name: "Wall Street 30", category: "Indices", type: "indices" },
  { symbol: "US100", name: "US Tech 100", category: "Indices", type: "indices" },
  { symbol: "SPX500", name: "US 500", category: "Indices", type: "indices" },
  { symbol: "GER40", name: "Germany 40", category: "Indices", type: "indices" },
  { symbol: "NAS100", name: "NASDAQ 100", category: "Indices", type: "indices" },

  // Crypto
  { symbol: "BTCUSD", name: "Bitcoin", category: "Crypto", type: "crypto" },
  { symbol: "ETHUSD", name: "Ethereum", category: "Crypto", type: "crypto" },
  { symbol: "SOLUSD", name: "Solana", category: "Crypto", type: "crypto" },
  { symbol: "XRPUSD", name: "Ripple", category: "Crypto", type: "crypto" },
];

const QUICK_PAIRS = [
  { pair: "EURUSD", category: "Forex", type: "forex", color: "text-cyan-500", border: "border-cyan-500/50", bg: "bg-cyan-500/10" },
  { pair: "USDJPY", category: "Forex", type: "jpy", color: "text-cyan-500", border: "border-cyan-500/50", bg: "bg-cyan-500/10" },
  { pair: "XAUUSD", category: "Gold", type: "gold", color: "text-amber-500", border: "border-amber-500/50", bg: "bg-amber-500/10" },
  { pair: "BTCUSD", category: "Crypto", type: "crypto", color: "text-emerald-500", border: "border-emerald-500/50", bg: "bg-emerald-500/10" },
];

const resolveChartSymbol = (pair: string) => {
  const cryptoOanda = ["BTCUSD", "ETHUSD"];
  if (cryptoOanda.includes(pair)) return `OANDA:${pair}`;
  
  const cryptoBinance = ["SOLUSD", "XRPUSD"];
  if (cryptoBinance.includes(pair)) return `BINANCE:${pair.replace("USD", "USDT")}`;

  return pair;
};

export default function Terminal() {
  const navigate = useNavigate();
  const { addTrade, trades } = useVaultStore();

  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [isDark, setIsDark] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputs, setInputs] = useState<CalcInputs>({
    balance: 10000,
    riskPercent: 1.0,
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    pair: "EURUSD",
    assetType: "forex",
    useManualPipValue: false,
    manualPipValue: "",
  });

  const [previewTradeId, setPreviewTradeId] = useState<string | null>(null);

  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains("dark");
    setIsDark(isDarkTheme);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const results = useMemo(() => calculateTrade(inputs), [inputs]);

  const handleInputChange = (field: keyof CalcInputs, value: string | boolean | number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchPair = (val: string) => {
    setSearchQuery(val);
    setIsSearchOpen(true);
  };

  const handleSelectMarket = (market: typeof MARKETS[0]) => {
    setSearchQuery(market.symbol);
    setInputs(prev => ({ 
      ...prev, 
      pair: market.symbol, 
      assetType: market.type as AssetType,
      entryPrice: "",
      stopLoss: "",
      takeProfit: ""
    }));
    setIsSearchOpen(false);
  };

  const filteredMarkets = useMemo(() => {
    if (!searchQuery) return MARKETS;
    const q = searchQuery.replace(/\//g, "").toLowerCase();
    return MARKETS.filter(m => 
      m.symbol.toLowerCase().includes(q) || 
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectQuickPair = (pairDef: typeof QUICK_PAIRS[number]) => {
    setSearchQuery(pairDef.pair);
    setInputs(prev => ({ 
      ...prev, 
      pair: pairDef.pair, 
      assetType: pairDef.type as AssetType,
      entryPrice: "",
      stopLoss: "",
      takeProfit: ""
    }));
    setIsSearchOpen(false);
  };

  const handleSaveTrade = async () => {
     if(results.lotSize > 0 && inputs.entryPrice !== "" && inputs.stopLoss !== "") {
       setSaveState("saving");
       
       // Simulate small network delay for UX
       await new Promise(resolve => setTimeout(resolve, 600));

       try {
         addTrade({
           date: new Date().toISOString(),
           pair: inputs.pair,
           direction: results.tradeType === "SELL" ? "Short" : "Long",
           entryPrice: Number(inputs.entryPrice),
           stopLoss: Number(inputs.stopLoss),
           takeProfit: Number(inputs.takeProfit) || 0,
           lotSize: results.lotSize,
           riskPercent: Number(inputs.riskPercent),
           riskAmount: results.riskAmount,
           rrRatio: results.riskRewardRatio || 0,
           strategyName: "Manual Setup",
           notes: "",
           result: "Pending",
           pnl: 0,
           mistakes: [],
         });
         
         setSaveState("success");
         setToast({ message: "Trade saved to Vault", type: "success" });
         
         setTimeout(() => {
           setSaveState("idle");
         }, 2000);

         setTimeout(() => {
           setToast(null);
         }, 4000);
       } catch (err) {
         setSaveState("error");
         setToast({ message: "Failed to save trade", type: "error" });
         setTimeout(() => setSaveState("idle"), 2000);
         setTimeout(() => setToast(null), 4000);
       }
     } else {
       setToast({ message: "Incomplete trade setup. Cannot save.", type: "error" });
       setTimeout(() => setToast(null), 3000);
     }
  };

  const recentTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [trades]);

  const previewTrade = trades.find(t => t.id === previewTradeId);

  return (
    <div className="min-h-screen dark:bg-[#0f1115] bg-[#fafafa] text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300 pb-20 md:pb-0">
      
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        {/* SEARCH & QUICK PAIRS */}
        <section className="flex flex-col items-center justify-center space-y-6 w-full max-w-2xl mx-auto">
           {/* SEARCH BOX */}
           <div className="relative group w-full z-40">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                 <Search className="h-6 w-6 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search forex, gold, indices, crypto..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => handleSearchPair(e.target.value)}
                className="w-full bg-white dark:bg-[#181b22] border dark:border-[#2a2f3a] border-slate-200 rounded-2xl pl-16 pr-6 py-5 text-xl font-bold dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-sm focus:shadow-[0_0_20px_rgba(6,182,212,0.15)] placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              {/* SEARCH DROPDOWN */}
              {isSearchOpen && (
                 <>
                   <div 
                     className="fixed inset-0 z-[-1]" 
                     onClick={() => setIsSearchOpen(false)}
                   />
                   <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#181b22] border dark:border-[#2a2f3a] border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto">
                     {filteredMarkets.length === 0 ? (
                       <div className="p-6 text-center text-rose-500 dark:text-rose-400 font-bold">
                         No market found
                       </div>
                     ) : (
                       <div className="flex flex-col py-2">
                         {filteredMarkets.map((market) => (
                           <button
                             key={market.symbol}
                             onClick={() => handleSelectMarket(market)}
                             className={cn(
                               "flex items-center justify-between w-full px-6 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left",
                               inputs.pair === market.symbol ? "bg-cyan-500/5 dark:bg-cyan-500/10" : ""
                             )}
                           >
                             <div className="flex flex-col">
                               <span className={cn(
                                 "text-lg font-bold font-mono",
                                 inputs.pair === market.symbol ? "text-cyan-500" : "text-slate-900 dark:text-white"
                               )}>
                                 {market.symbol}
                               </span>
                               <span className="text-xs font-medium text-slate-500 dark:text-zinc-500">
                                 {market.name}
                               </span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-[#0f1115] text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-white/5">
                                 {market.category}
                               </span>
                             </div>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 </>
              )}
           </div>

           {/* QUICK PAIRS */}
           <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar w-full pb-2 justify-start sm:justify-center">
              {QUICK_PAIRS.map(pair => {
                const isActive = inputs.pair === pair.pair;
                return (
                  <button 
                    key={pair.pair}
                    onClick={() => handleSelectQuickPair(pair)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 rounded-xl border transition-all shrink-0 cursor-pointer text-sm font-bold tracking-widest uppercase",
                      isActive 
                        ? `dark:bg-[#181b22] bg-white ${pair.border} ${pair.color} shadow-sm`
                        : "dark:bg-transparent bg-transparent dark:border-[#2a2f3a] border-slate-200 dark:text-zinc-500 text-slate-500 dark:hover:border-zinc-700 hover:border-slate-300 hover:text-slate-700 dark:hover:text-zinc-300"
                    )}
                  >
                    {pair.pair}
                  </button>
                );
              })}
           </div>
        </section>

        {/* LIVE CHART */}
        <div className="w-full max-w-[1000px] mx-auto relative group/chart z-20 isolate">
           {/* Outer Ambient Glow */}
           <div className="absolute -inset-1 bg-gradient-to-b from-cyan-400/20 to-transparent dark:from-cyan-500/30 dark:via-blue-500/10 dark:to-transparent rounded-[2rem] blur-xl opacity-30 group-hover/chart:opacity-80 transition-opacity duration-1000 animate-pulse -z-10"></div>
           
           {/* Layered Premium Border Frame */}
           <div className="relative p-[2px] rounded-[1.8rem] overflow-hidden transition-all duration-700 bg-gradient-to-b from-slate-300 via-slate-200/50 to-slate-100 dark:from-cyan-400/50 dark:via-blue-900/40 dark:to-white/5 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] group-hover/chart:shadow-[0_25px_60px_-15px_rgba(6,182,212,0.25)] dark:shadow-[0_0_40px_-10px_rgba(6,182,212,0.2)] dark:group-hover/chart:shadow-[0_0_60px_-10px_rgba(6,182,212,0.4)]">
             
             {/* Animated border shine */}
             <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-cyan-400/60 dark:via-cyan-300/40 to-transparent -translate-x-[100%] group-hover/chart:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
             
             {/* Inner Panel */}
             <div className="bg-slate-50/95 dark:bg-[#08080b]/95 rounded-[calc(1.8rem-2px)] flex flex-col h-[400px] sm:h-[450px] md:h-[500px] backdrop-blur-2xl relative shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] overflow-hidden">
                
                {/* Inner Edge Lighting */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 dark:via-cyan-400/30 to-transparent z-30 opacity-80 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-[2px] h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/15 to-transparent z-30 pointer-events-none"></div>
                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-black/10 dark:via-black/50 to-transparent z-30 pointer-events-none"></div>

                {/* Premium Top Bar */}
                <div className="h-14 border-b border-slate-200 dark:border-white/5 flex items-center px-5 md:px-6 justify-between bg-white/50 dark:bg-[#121218]/80 backdrop-blur-md z-20 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black dark:text-white text-slate-900 tracking-tight flex items-center">
                      {inputs.pair || "PAIR"} <span className="opacity-40 font-normal ml-1.5 text-xs text-slate-600 dark:text-zinc-400">• Dynamic</span>
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 drop-shadow-sm">Live</span>
                    </div>
                  </div>
                </div>

                {/* Skeleton Loader */}
                <div className="absolute inset-x-0 bottom-0 top-14 flex items-center justify-center bg-slate-50 dark:bg-[#0a0c10] z-0">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin opacity-40" />
                </div>

                {/* TradingView Chart */}
                <div className="flex-1 w-full bg-white dark:bg-[#181b22] relative z-10 dark:opacity-95 mix-blend-normal">
                  <AdvancedRealTimeChart
                    symbol={resolveChartSymbol(inputs.pair)}
                    theme={isDark ? "dark" : "light"}
                    width="100%"
                    height="100%"
                    hide_side_toolbar={false}
                    allow_symbol_change={true}
                    save_image={true}
                    timezone="Etc/UTC"
                    style="1"
                    toolbar_bg={isDark ? "#181b22" : "#ffffff"}
                    enable_publishing={false}
                    hide_top_toolbar={false}
                  />
                </div>
             </div>
           </div>
        </div>

        {/* CALCULATOR WORKSPACE */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
           
           {/* CALCULATOR INPUTS */}
           <div className="bg-white dark:bg-[#181b22] border border-slate-200 dark:border-[#2a2f3a] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-sm relative overflow-hidden group premium-hover">
             
             <div className="grid grid-cols-2 gap-4">
                <div className="relative group/input">
                   <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-zinc-500 z-10">Balance ($)</label>
                   <input 
                     type="number"
                     value={inputs.balance}
                     onChange={(e) => handleInputChange("balance", e.target.value)}
                     className="w-full bg-transparent border border-slate-200 dark:border-[#333a45] rounded-xl px-4 py-4 text-base font-mono font-bold focus:border-cyan-500 focus:outline-none transition-colors"
                   />
                </div>
                <div className="relative group/input">
                   <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-zinc-500 z-10">Risk (%)</label>
                   <input 
                     type="number"
                     step="0.1"
                     value={inputs.riskPercent}
                     onChange={(e) => handleInputChange("riskPercent", e.target.value)}
                     className="w-full bg-transparent border border-slate-200 dark:border-[#333a45] rounded-xl px-4 py-4 text-base font-mono font-bold focus:border-cyan-500 focus:outline-none transition-colors"
                   />
                </div>
             </div>

             <div className="relative group/input mt-2">
                <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-cyan-500 z-10">Entry Price</label>
                <input 
                  type="number"
                  value={inputs.entryPrice}
                  onChange={(e) => handleInputChange("entryPrice", e.target.value)}
                  className="w-full bg-transparent border border-cyan-500/30 rounded-xl px-4 py-5 text-xl font-mono font-bold focus:border-cyan-500 focus:outline-none transition-colors"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="relative group/input">
                   <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-rose-500 z-10">Stop Loss</label>
                   <input 
                     type="number"
                     value={inputs.stopLoss}
                     onChange={(e) => handleInputChange("stopLoss", e.target.value)}
                     className="w-full bg-transparent border border-rose-500/30 rounded-xl px-4 py-4 text-base font-mono font-bold focus:border-rose-500 focus:outline-none transition-colors"
                   />
                </div>
                <div className="relative group/input">
                   <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-emerald-500 z-10">Take Profit</label>
                   <input 
                     type="number"
                     value={inputs.takeProfit}
                     onChange={(e) => handleInputChange("takeProfit", e.target.value)}
                     className="w-full bg-transparent border border-emerald-500/30 rounded-xl px-4 py-4 text-base font-mono font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                   />
                </div>
             </div>
           </div>

           {/* RESULTS */}
           <div className="bg-white dark:bg-[#181b22] border border-slate-200 dark:border-[#2a2f3a] rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full shadow-sm relative overflow-hidden group premium-hover">
             
             <div className="text-center mb-8">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Recommended Lot Size</span>
                <div className={cn(
                   "text-6xl sm:text-7xl font-black font-mono tracking-tighter transition-all",
                   results.lotSize > 0 ? "text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "dark:text-zinc-700 text-slate-300"
                )}>
                   {results.lotSize > 0 ? results.lotSize.toFixed(2) : "0.00"}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Risk Amount</span>
                   <span className="font-mono text-xl font-black text-rose-500">${results.riskAmount.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Target Profit</span>
                   <span className="font-mono text-xl font-black text-emerald-500">${results.potentialProfit?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Distance ({results.distanceUnit})</span>
                   <span className="font-mono text-xl font-black dark:text-white text-slate-900">{results.pipDistance.toFixed(1)}</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">RR Ratio</span>
                   <span className={cn("font-mono text-xl font-black", (results.riskRewardRatio || 0) >= 2 ? "text-cyan-500" : "dark:text-white text-slate-900")}>
                     1:{results.riskRewardRatio?.toFixed(2) || "0.00"}
                   </span>
                </div>
             </div>

             <div className="mt-8">
                <button 
                  onClick={saveState === "idle" ? handleSaveTrade : undefined} 
                  disabled={saveState === "saving"}
                  className={cn(
                    "w-full py-4 rounded-xl transition-all duration-300 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 relative overflow-hidden shadow-sm",
                    saveState === "idle" ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] cursor-pointer active:scale-[0.98]" :
                    saveState === "saving" ? "bg-amber-500/20 text-amber-500 border border-amber-500/50 cursor-not-allowed" :
                    saveState === "success" ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white" :
                    "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] text-white"
                  )}
                >
                   {saveState === "idle" && <><Save className="w-4 h-4" /> Save Trade Setup</>}
                   {saveState === "saving" && <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>}
                   {saveState === "success" && <><Check className="w-4 h-4" /> ✓ Trade Saved</>}
                   {saveState === "error" && <><AlertCircle className="w-4 h-4" /> Failed</>}
                </button>
             </div>
           </div>

        </div>

        {/* RECENT TRADES */}
        <div className="mt-8 mb-12">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Recent Setups</h2>
             <button onClick={() => navigate('/vault')} className="text-xs font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer">
                View All <ChevronRight className="w-3.5 h-3.5" />
             </button>
          </div>
          
          {recentTrades.length === 0 ? (
             <div className="text-sm text-zinc-500 font-medium py-12 text-center border border-dashed dark:border-[#2a2f3a] border-slate-200 rounded-2xl">
                No recent trades. Save a setup above to start journaling.
             </div>
          ) : (
             <div className="flex flex-col gap-2">
                {recentTrades.map((trade) => {
                   const isWin = trade.result === "Win";
                   const isLoss = trade.result === "Loss";
                   const isPending = trade.result === "Pending";
                   const pnlStr = isWin ? `+${trade.pnl.toFixed(2)}` : isLoss ? `-${Math.abs(trade.pnl).toFixed(2)}` : "Pending";
                   
                   return (
                      <div key={trade.id} onClick={() => setPreviewTradeId(trade.id)} className="flex items-center justify-between dark:bg-[#181b22] bg-white border dark:border-[#2a2f3a] border-slate-200 rounded-xl p-4 sm:px-6 cursor-pointer hover:border-cyan-500/50 transition-all shadow-sm">
                         <div className="flex items-center gap-4">
                            <span className="font-bold text-lg dark:text-white text-slate-900 w-24">{trade.pair}</span>
                            <div className="hidden sm:flex flex-col">
                               <span className={cn("text-[10px] font-bold uppercase tracking-widest", trade.direction === "Long" ? "text-emerald-500" : "text-rose-500")}>{trade.direction}</span>
                               <span className="text-xs font-medium text-zinc-500">{format(new Date(trade.date), "MMM d, yyyy")}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-6 sm:gap-10">
                            <div className="flex flex-col items-end">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">RR Ratio</span>
                               <span className="font-mono text-sm font-bold dark:text-white text-slate-900">1:{trade.rrRatio.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col items-end w-24">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Result</span>
                               <span className={cn("font-mono text-sm font-bold", isWin ? "text-emerald-500" : isLoss ? "text-rose-500" : "text-zinc-500")}>
                                 {pnlStr}
                               </span>
                            </div>
                            <div className="hidden sm:block text-zinc-400 dark:text-zinc-600">
                               <ChevronRight className="w-5 h-5" />
                            </div>
                         </div>
                      </div>
                   )
                })}
             </div>
          )}
        </div>

      </main>

      {/* 2. SMALL ANALYTICS STRIP */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 mb-12">
         <div className="flex text-center md:text-left overflow-x-auto snap-x snap-mandatory hide-scrollbar">
            <div className="flex w-full min-w-max md:min-w-0 md:pl-0 sm:justify-start lg:justify-between items-center gap-4 dark:bg-[#121218]/50 bg-white border border-slate-200 dark:border-white/5 rounded-2xl p-4 md:p-5 shadow-sm divide-x divide-slate-200 dark:divide-white/5">
                
                <div className="flex-1 min-w-[120px] px-4 snap-center shrink-0">
                   <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                      <Target className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[9px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-400">Total Net PnL</span>
                   </div>
                   <div className="text-xl font-black font-mono text-emerald-500 tracking-tight">+$4,250.00</div>
                </div>

                <div className="flex-1 min-w-[120px] px-4 snap-center shrink-0">
                   <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                      <Activity className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[9px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-400">Win Rate</span>
                   </div>
                   <div className="text-xl font-black font-mono dark:text-white text-slate-900 tracking-tight">64.5%</div>
                </div>

                <div className="flex-1 min-w-[120px] px-4 snap-center shrink-0">
                   <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                      <History className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[9px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-400">Total Trades</span>
                   </div>
                   <div className="text-xl font-black font-mono dark:text-white text-slate-900 tracking-tight">128</div>
                </div>

                <div className="flex-1 min-w-[120px] px-4 snap-center shrink-0 hidden sm:block">
                   <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                      <LineChart className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[9px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-400">Avg RR</span>
                   </div>
                   <div className="text-xl font-black font-mono dark:text-white text-slate-900 tracking-tight">1:2.4</div>
                </div>
            </div>
         </div>
      </div>

      {/* 3. SMALL FEATURE PANELS */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 mb-24">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Vault Panel */}
            <div className="dark:bg-[#121218] bg-white border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm group premium-hover flex flex-col justify-between h-[240px]">
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-500">Trade Vault</span>
                     <Database className="w-4 h-4 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-black dark:text-white text-slate-900 tracking-tight mb-1">Save and review every trade.</h3>
                  <p className="text-xs dark:text-zinc-500 text-slate-500 font-medium line-clamp-2">Log screenshots, notes, and outcomes to improve execution and consistency.</p>
               </div>
               
               <div className="mt-4 flex flex-col gap-2 relative">
                  <div className="w-full dark:bg-white/5 bg-slate-100 rounded-lg p-2.5 flex justify-between items-center border border-transparent group-hover:border-slate-200 dark:group-hover:border-white/10 transition-colors shadow-sm">
                     <div className="flex items-center gap-2.5">
                         <div className="w-6 h-6 rounded bg-slate-200 dark:bg-[#0c0c10] flex items-center justify-center border border-slate-300 dark:border-white/10">
                            <ImageIcon className="w-3 h-3 text-slate-500" />
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold dark:text-white text-slate-900 text-[10px]">EURUSD Breakout</span>
                            <span className="text-[9px] dark:text-zinc-500 text-slate-500 uppercase tracking-widest font-mono">1:3.0 RR</span>
                         </div>
                     </div>
                     <span className="text-emerald-500 font-mono font-bold text-[10px]">+$42</span>
                  </div>
                  <div className="w-full dark:bg-white/5 bg-slate-100 rounded-lg p-2.5 flex justify-between items-center border border-transparent group-hover:border-slate-200 dark:group-hover:border-white/10 transition-colors shadow-sm opacity-60">
                     <div className="flex items-center gap-2.5">
                         <div className="w-6 h-6 rounded bg-slate-200 dark:bg-[#0c0c10] flex items-center justify-center border border-slate-300 dark:border-white/10">
                            <ImageIcon className="w-3 h-3 text-slate-500" />
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold dark:text-white text-slate-900 text-[10px]">XAUUSD Liquidity Sweep</span>
                            <span className="text-[9px] dark:text-zinc-500 text-slate-500 uppercase tracking-widest font-mono">1:4.5 RR</span>
                         </div>
                     </div>
                     <span className="text-emerald-500 font-mono font-bold text-[10px]">+$76</span>
                  </div>
               </div>
            </div>

            {/* Performance Panel */}
            <div className="dark:bg-[#121218] bg-white border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm group premium-hover flex flex-col justify-between h-[240px]">
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-500">Performance</span>
                     <BarChart3 className="w-4 h-4 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-black dark:text-white text-slate-900 tracking-tight mb-1">Understand your trading behavior.</h3>
                  <p className="text-xs dark:text-zinc-500 text-slate-500 font-medium line-clamp-2">Analyze win rate, PnL, consistency, and trading patterns with funded-style analytics.</p>
               </div>
               
               <div className="mt-4 flex flex-col gap-3">
                   <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mb-0.5">Win Rate</span>
                         <span className="text-lg font-black font-mono dark:text-white text-slate-900 leading-none">64.5%</span>
                      </div>
                      <div className="flex flex-col text-right">
                         <span className="text-[9px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mb-0.5">Net PNL</span>
                         <span className="text-lg font-black font-mono text-emerald-500 leading-none">+$4.2k</span>
                      </div>
                   </div>
                   <div className="w-full h-8 relative flex items-end justify-between overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full overflow-visible preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 20">
                         <path d="M0,20 L10,18 L20,15 L30,17 L40,10 L50,12 L60,5 L70,8 L80,3 L90,6 L100,0" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500 drop-shadow-[0_2px_4px_rgba(16,185,129,0.5)] transition-all duration-1000 group-hover:drop-shadow-[0_4px_6px_rgba(16,185,129,0.8)] opacity-80" vectorEffect="non-scaling-stroke"/>
                      </svg>
                   </div>
                   <div className="flex flex-wrap gap-[3px] opacity-90 mt-1">
                       {Array.from({length: 28}).map((_, i) => (
                          <div key={i} className={cn(
                            "w-3 h-3 rounded-[2px] transition-colors",
                            i%7===0 || i%12===0 ? "bg-rose-500/80 group-hover:bg-rose-500" 
                            : i%3===0 || i%5===0 ? "bg-emerald-500/80 group-hover:bg-emerald-500" 
                            : "bg-slate-100 dark:bg-white/5 group-hover:dark:bg-white/10 group-hover:bg-slate-200"
                          )}></div>
                       ))}
                   </div>
               </div>
            </div>

            {/* AI Panel */}
            <div className="dark:bg-[#121218] bg-white border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm group premium-hover flex flex-col justify-between h-[240px] relative overflow-hidden">
               <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-cyan-500/10 blur-[30px] rounded-full pointer-events-none"></div>
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-500">AI Insights</span>
                     <Sparkles className="w-4 h-4 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-black dark:text-white text-slate-900 tracking-tight mb-1">Smart Analytics.</h3>
                  <p className="text-xs dark:text-zinc-500 text-slate-500 font-medium line-clamp-2">Identify mistakes and optimize your strategy.</p>
               </div>
               
               <div className="mt-4 text-[10px] sm:text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-100/50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 p-3 rounded-lg leading-relaxed shadow-sm font-medium relative z-10 transition-colors group-hover:border-cyan-400/50 group-hover:bg-cyan-500/20">
                  "Your London breakout setups show highest consistency between 1:2–1:3 RR."
               </div>
            </div>

         </div>
      </div>

      {/* 3.5 HOW IT WORKS SECTION */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 mb-24 relative">
         <div className="text-center mb-10 flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-black dark:text-white text-slate-900 tracking-tighter font-mono mb-3">How It Works</h2>
            <p className="text-sm dark:text-zinc-400 text-slate-500 font-medium tracking-wide">Simple workflow built for modern traders.</p>
         </div>

         <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {[
              { title: "Select Pair", desc: "Choose Forex, Gold, Crypto, or Indices pairs.", icon: Search },
              { title: "Set Risk %", desc: "Define account balance and risk percentage.", icon: Target },
              { title: "Calculate Position Size", desc: "Get precise lot size, RR, and risk instantly.", icon: Calculator },
              { title: "Save Trade to Vault", desc: "Store screenshots, notes, and strategy setups.", icon: Database },
              { title: "Track Performance & AI Insights", desc: "Analyze consistency, behavior, and performance trends.", icon: BarChart3 }
            ].map((step, i) => (
               <div key={i} className="flex-1 dark:bg-[#121218] bg-white border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 shadow-sm group premium-hover relative flex flex-row lg:flex-col items-center lg:items-start text-left gap-4 lg:gap-0 overflow-hidden">
                  <div className="absolute -right-2 -bottom-4 text-[100px] font-black italic dark:text-white/[0.02] text-slate-900/[0.03] pointer-events-none leading-none select-none hidden lg:block">
                     {i+1}
                  </div>
                  
                  <div className="w-12 h-12 shrink-0 rounded-xl dark:bg-[#1a1a24] bg-slate-50 flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-colors lg:mb-5 relative z-10">
                     <step.icon className="w-5 h-5 text-slate-600 dark:text-zinc-400 group-hover:text-cyan-500 transition-colors" />
                  </div>
                  
                  <div className="flex flex-col relative z-10 w-full">
                     <div className="text-[9px] font-bold uppercase tracking-widest text-cyan-500 mb-1">Step {i+1}</div>
                     <h3 className="text-sm font-black dark:text-white text-slate-900 tracking-tight mb-1">{step.title}</h3>
                     <p className="text-xs dark:text-zinc-500 text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* 4. PREMIUM PRICING SECTION */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 mb-24 relative" id="pricing">
         {/* Background ambient glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
         
         <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black dark:text-white text-slate-900 tracking-tighter mb-4 font-mono">
               Upgrade Your Edge.
            </h2>
            <p className="text-sm dark:text-zinc-400 text-slate-500 font-medium tracking-wide max-w-xl mx-auto">
               Institutional-grade tools, funded-account analytics, and premium AI—all in one workspace.
            </p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-stretch max-w-6xl mx-auto z-10">
            {[ 
              { 
                m: "1 Month", 
                orig: "₹499", 
                price: "₹199", 
                highlight: false,
                badge: null,
                btn: "Start Trading",
                features: [
                  "Smart Lot Size Calculator",
                  "Live TradingView Chart",
                  "Basic AI Assistant",
                  "Save up to 50 Trade Vault entries",
                  "Performance Analytics",
                  "Basic Risk Tracking",
                  "Forex, Gold & Crypto support"
                ]
              },
              { 
                m: "3 Months", 
                orig: "₹999", 
                price: "₹499", 
                highlight: true,
                badge: "Best Value",
                btn: "Get Setup Access",
                features: [
                  "Unlimited Trade Vault Saves",
                  "Advanced AI Insights",
                  "Funded-style Analytics",
                  "Strategy Tagging",
                  "Trade Notes & Screenshots",
                  "Advanced Risk Tracking",
                  "Faster AI Responses"
                ]
              },
              { 
                m: "6 Months", 
                orig: "₹1999", 
                price: "₹999", 
                highlight: false,
                badge: null,
                btn: "Get Setup Access",
                features: [
                  "Advanced Performance Heatmaps",
                  "Priority AI Processing",
                  "Multi-Setup Tracking",
                  "Deep Performance Analytics",
                  "Institutional Dashboard Features"
                ]
              },
              { 
                m: "1 Year", 
                orig: "₹2999", 
                price: "₹1499", 
                highlight: false,
                badge: "Pro Trader",
                btn: "Upgrade Workspace",
                features: [
                  "Unlimited Access",
                  "Future Premium Features",
                  "Highest AI Limits",
                  "Advanced Analytics Access",
                  "Premium Workspace Features",
                  "Priority Updates"
                ]
              } 
            ].map((plan, i) => (
             <div key={i} className={cn(
               "relative rounded-[1.5rem] flex flex-col p-6 transition-all duration-500 overflow-hidden group/plan",
               plan.highlight 
                 ? "dark:bg-[#121216] bg-white border border-cyan-500/50 shadow-[0_15px_40px_-5px_rgba(6,182,212,0.3)] lg:-translate-y-4 hover:lg:-translate-y-6 hover:-translate-y-2 z-10 hover:border-cyan-400 hover:shadow-[0_20px_50px_-5px_rgba(6,182,212,0.4)]" 
                 : "dark:bg-[#0c0c10] bg-white border dark:border-white/5 border-slate-200 shadow-sm premium-hover"
             )}>
                {/* Border Glow for all on hover, strongest on highlight */}
                <div className={cn(
                  "absolute inset-0 z-0 bg-gradient-to-b from-cyan-500/0 via-cyan-500/0 opacity-0 transition-opacity duration-500 pointer-events-none rounded-[1.5rem]",
                  plan.highlight ? "to-cyan-500/10 opacity-100 group-hover/plan:to-cyan-500/20" : "to-cyan-500/5 group-hover/plan:opacity-100"
                )}></div>
                
                {plan.badge && (
                  <div className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-b-lg shadow-sm whitespace-nowrap z-10",
                    plan.badge === "Best Value" ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                  )}>
                    {plan.badge}
                  </div>
                )}
                
                <div className="relative z-10 flex flex-col h-full mt-4">
                   <h3 className={cn("text-xs font-black uppercase tracking-widest mb-3", plan.highlight ? "text-cyan-500" : "dark:text-zinc-400 text-slate-500")}>{plan.m}</h3>
                   
                   <div className="mb-0.5 h-4 flex items-center">
                     <span className="text-[10px] dark:text-zinc-600 text-slate-400 line-through font-mono font-bold">{plan.orig}</span>
                   </div>
                   
                   <div className="text-4xl font-black dark:text-white text-slate-900 mb-6 tracking-tighter">
                     {plan.price}
                   </div>

                   <div className="flex-1 flex flex-col gap-3.5 mb-8">
                      {plan.features.map((feat, idx) => (
                         <div key={idx} className="flex items-start gap-2.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className={cn("text-xs dark:text-zinc-300 text-slate-600 font-medium leading-relaxed", idx === 0 && "font-bold text-slate-900 dark:text-white")}>{feat}</span>
                         </div>
                      ))}
                   </div>

                   <button className={cn(
                     "w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 mt-auto relative overflow-hidden group/btn",
                     plan.highlight 
                       ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                       : "dark:bg-[#1a1a24] bg-slate-100 dark:text-white text-slate-900 hover:bg-slate-200 dark:hover:bg-[#2a2a2a]"
                   )}>
                     <span className="relative z-10 flex items-center gap-2">{plan.btn} <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" /></span>
                     {plan.highlight && (
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                     )}
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* 5. TRUSTED BY TRADERS SECTION */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 mb-24 relative">
         <div className="text-center mb-10 flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-black dark:text-white text-slate-900 tracking-tighter font-mono mb-4">Trusted by Traders.</h2>
            <div className="flex items-center gap-4 dark:bg-white/5 bg-white border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-full text-xs font-bold dark:text-zinc-300 text-slate-700 shadow-sm backdrop-blur-sm">
               <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-500" /> 10,000+ Trades Logged</span>
               <span className="opacity-30">•</span>
               <span className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> 4.9 Average Rating</span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
            {[
               { text: "This tool completely improved my risk management and execution discipline.", author: "Alexander M.", role: "Forex Trader" },
               { text: "The vault and performance analytics feel like a funded account dashboard.", author: "Sarah T.", role: "Gold Scalper" },
               { text: "Much better than using separate calculators and journals. Everything in one place.", author: "David K.", role: "Crypto Trader" }
            ].map((review, i) => (
               <div key={i} className="bg-white dark:bg-[#121218] border border-slate-200 dark:border-white/5 p-6 md:p-8 rounded-[1.5rem] shadow-sm flex flex-col justify-between h-full group premium-hover">
                  <div className="flex items-center gap-1 mb-5">
                     {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" />)}
                  </div>
                  <p className="text-sm dark:text-zinc-300 text-slate-700 font-medium leading-relaxed mb-8 italic">"{review.text}"</p>
                  <div className="flex items-center gap-3 mt-auto">
                     <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-colors">
                        <span className="font-black text-sm dark:text-white text-slate-900">{review.author.charAt(0)}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] items-center gap-1 flex font-bold uppercase tracking-widest dark:text-zinc-200 text-slate-800">
                           {review.author} <BadgeCheck className="w-3 h-3 text-cyan-500" />
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500">{review.role}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* 6. FAQ SECTION */}
      <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 mb-32 relative">
         <div className="text-center mb-10 flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-black dark:text-white text-slate-900 tracking-tighter font-mono mb-3">Frequently Asked Questions</h2>
            <h3 className="text-sm dark:text-zinc-400 text-slate-600 font-medium tracking-wide">Common questions about the Trader.fx platform</h3>
         </div>
         
         <div className="flex flex-col gap-3">
             <FaqItem q="Do I need trading experience to use this platform?" a="No. The platform is designed for both beginner and advanced traders." />
             <FaqItem q="Does the calculator support Forex, Gold, Crypto & Indices?" a="Yes. The platform supports major Forex pairs, Gold, Crypto, and Indices." />
             <FaqItem q="Can I save my trade setups?" a="Yes. You can save, review, and analyze trades inside the Trade Vault." />
             <FaqItem q="Does the AI assistant give trading signals?" a="No. The AI assistant helps analyze performance, risk behavior, and trading patterns." />
             <FaqItem q="Will more features be added in future updates?" a="Yes. Future updates will include more advanced trading workspace features and analytics." />
         </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full py-8 border-t dark:border-white/5 border-slate-200 dark:bg-[#08080b] bg-slate-50 text-center md:text-left">
         <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-black tracking-widest dark:text-zinc-600 text-slate-400 uppercase flex items-center gap-2">
               <Activity className="w-3.5 h-3.5 text-cyan-500" /> TRADER.FX
            </div>
            
            <div className="flex items-center gap-4 text-[9px] font-bold dark:text-zinc-600 text-slate-400 uppercase tracking-widest">
               <a href="#" className="hover:text-slate-900 dark:hover:text-cyan-500 transition-colors">Terms</a>
               <a href="#" className="hover:text-slate-900 dark:hover:text-cyan-500 transition-colors">Privacy</a>
            </div>
         </div>
      </footer>

      {/* QUICK PREVIEW MODAL */}
      {previewTrade && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-sm" onClick={() => setPreviewTradeId(null)} />
            <div className="relative w-full max-w-xl bg-white dark:bg-[#181b22] border border-slate-200 dark:border-[#2a2f3a] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
               
               <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter dark:text-white text-slate-900 uppercase leading-none mb-2">{previewTrade.pair}</h3>
                    <div className="flex items-center gap-3">
                       <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                          previewTrade.direction === "Long" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                       )}>
                          {previewTrade.direction}
                       </span>
                       <span className="text-xs font-bold text-zinc-500">
                          {format(new Date(previewTrade.date), "MMM d, yyyy • HH:mm")}
                       </span>
                    </div>
                  </div>
                  <button onClick={() => setPreviewTradeId(null)} className="w-10 h-10 rounded-full dark:bg-[#0f1115] bg-slate-100 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-slate-200 dark:border-white/5">
                    <X className="w-5 h-5 dark:text-white text-slate-900" />
                  </button>
               </div>

               <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Final Result</span>
                     <span className={cn(
                        "text-xl font-black font-mono",
                        previewTrade.result === "Win" ? "text-emerald-500" :
                        previewTrade.result === "Loss" ? "text-rose-500" : "dark:text-white text-slate-900"
                     )}>
                        {previewTrade.result === "Pending" ? "Pending" : `${previewTrade.pnl > 0 ? '+' : ''}$${Math.abs(previewTrade.pnl).toFixed(2)}`}
                     </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Target RR</span>
                     <span className="text-xl font-black font-mono dark:text-white text-slate-900">1:{previewTrade.rrRatio.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Risk</span>
                     <span className="text-xl font-black font-mono text-rose-500">${previewTrade.riskAmount.toFixed(2)}</span>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-6 mb-8 text-sm bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 p-6 rounded-2xl">
                  <div className="flex flex-col gap-1 items-center text-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Entry Price</span>
                     <span className="font-mono text-base font-bold text-cyan-500">{previewTrade.entryPrice}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center text-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Stop Loss</span>
                     <span className="font-mono text-base font-bold text-rose-500">{previewTrade.stopLoss}</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center text-center">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Take Profit</span>
                     <span className="font-mono text-base font-bold text-emerald-500">{previewTrade.takeProfit || "Open"}</span>
                  </div>
               </div>
               
               <button onClick={() => { setPreviewTradeId(null); navigate('/vault'); }} className="w-full py-4 rounded-xl bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer border border-cyan-500/20">
                 <Eye className="w-4 h-4" /> View Full Details in Vault
               </button>
            </div>
         </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
         <div className="fixed bottom-6 right-6 z-[110] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={cn(
               "flex items-center gap-3 px-5 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border backdrop-blur-xl",
               toast.type === "success" 
                 ? "dark:bg-emerald-500/10 bg-emerald-50 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                 : "dark:bg-rose-500/10 bg-rose-50 border-rose-500/20 text-rose-600 dark:text-rose-400"
            )}>
               {toast.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
               <span className="text-sm font-bold tracking-wide">{toast.message}</span>
            </div>
         </div>
      )}

    </div>
  );
}
