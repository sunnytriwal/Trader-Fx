import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVaultStore } from "../store/vaultStore";
import { VaultTrade, TradeMistake } from "../types/vault";
import { format, parseISO } from "date-fns";
import { 
  Database, Trash2, Image as ImageIcon, X, Edit3, 
  ArrowUp, ArrowDown, Camera, AlertTriangle, FileText, 
  Target, Download, Filter, Search as SearchIcon, Plus, Maximize2,
  ChevronDown, ExternalLink, Calendar, CheckCircle2, ChevronRight, BarChart, Check, AlertCircle, BrainCircuit
} from "lucide-react";
import { cn } from "../lib/utils";
import * as XLSX from "xlsx";
import AICoachChat from "../components/AICoachChat";
import NewTradeModal from "../components/NewTradeModal";

const MISTAKES_LIST: TradeMistake[] = [
  "Overtrading", "Early entry", "Fear exit", "Revenge trade", 
  "No confirmation", "FOMO entry", "Other"
];

export default function TradeVault() {
  const navigate = useNavigate();
  const { trades, deleteTrade } = useVaultStore();
  const [editingTrade, setEditingTrade] = useState<VaultTrade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<VaultTrade | null>(null);
  const [isNewTradeOpen, setIsNewTradeOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("All");
  const [pairFilter, setPairFilter] = useState<string>("All");

  const [strategyFilter, setStrategyFilter] = useState<string>("All");

  // Filter derivations
  const pairsList = ["All", ...Array.from(new Set(trades.map(t => t.pair)))];
  const strategyList = ["All", ...Array.from(new Set(trades.map(t => t.strategyName).filter((s): s is string => Boolean(s))))];
  
  const filteredTrades = useMemo(() => {
    const q = searchQuery.replace(/\//g, "").toLowerCase();
    const rawQ = searchQuery.toLowerCase();

    return trades.filter(t => {
      // Search
      const matchesSearch = 
        t.pair.toLowerCase().includes(q) || 
        (t.strategyName || "").toLowerCase().includes(rawQ) || 
        (t.notes || "").toLowerCase().includes(rawQ);
      
      // Outcome
      const matchesResult = resultFilter === "All" || 
        (resultFilter === "Breakeven" && t.result === "Break Even") || 
        t.result === resultFilter;

      // Pair
      const matchesPair = pairFilter === "All" || t.pair === pairFilter;
      
      // Strategy
      const matchesStrategy = strategyFilter === "All" || t.strategyName === strategyFilter;

      return matchesSearch && matchesResult && matchesPair && matchesStrategy;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trades, searchQuery, resultFilter, pairFilter, strategyFilter]);

  const handleExport = () => {
    try {
      if (trades.length === 0) {
        setToast({ message: "Vault is empty, nothing to export.", type: "error" });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const exportData = trades.map(t => ({
        Pair: t.pair,
        "Trade Type": t.direction,
        Entry: t.entryPrice,
        "Stop Loss": t.stopLoss,
        "Take Profit": t.takeProfit,
        "Lot Size": t.lotSize,
        "Risk %": t.riskPercent,
        "RR Ratio": t.rrRatio,
        PnL: (t.pnl === null || t.pnl === undefined) ? "" : t.pnl,
        Strategy: t.strategyName || "",
        Notes: t.notes || "",
        Date: format(parseISO(t.date), "yyyy-MM-dd"),
        Time: format(parseISO(t.date), "HH:mm"),
        Day: format(parseISO(t.date), "EEEE")
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Trades");
      
      XLSX.writeFile(workbook, "TradeVault_Export.xlsx");
      
      setToast({ message: "Excel file downloaded", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to export", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#0f1115] bg-[#fafafa] text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300 pb-20 md:pb-0">
      
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        
        {/* PAGE HEADER ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full mb-2">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 shadow-inner">
                 <Database className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                 <h1 className="text-3xl font-black tracking-tight dark:text-white text-slate-900 leading-none">Trade Vault</h1>
                 <p className="text-xs font-bold dark:text-zinc-500 text-slate-500 mt-1 uppercase tracking-widest hidden sm:block">
                   Save, organize, and review your trading setups.
                 </p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest dark:bg-white/5 bg-slate-100 dark:hover:bg-white/10 hover:bg-slate-200 dark:text-zinc-300 text-slate-600 transition-colors cursor-pointer">
                 <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button onClick={() => setIsNewTradeOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest dark:bg-cyan-500/10 bg-cyan-50 dark:text-cyan-400 text-cyan-600 dark:hover:bg-cyan-500/20 hover:bg-cyan-100 transition-colors cursor-pointer border border-cyan-500/20 shadow-sm">
                 <Plus className="w-4 h-4" /> New Trade
              </button>
           </div>
        </div>

        {/* SEARCH & FILTERS ROW */}
        <div className="flex flex-col md:flex-row gap-3 items-center w-full z-30 mt-4 mb-2">
          {/* Search Bar */}
          <div className="relative group w-full md:flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search pair, strategy, notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#181b22] border dark:border-[#2a2f3a] border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar pb-1 md:pb-0">
            {/* Filters */}
            <div className="relative shrink-0">
              <select 
                value={resultFilter} 
                onChange={(e) => setResultFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#181b22] border dark:border-[#2a2f3a] border-slate-200 rounded-xl pl-4 pr-10 py-3 text-xs font-bold uppercase tracking-widest dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm cursor-pointer"
              >
                <option value="All">All Outcomes</option>
                <option value="Win">Wins</option>
                <option value="Loss">Losses</option>
                <option value="Breakeven">Breakeven</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative shrink-0">
              <select 
                value={pairFilter} 
                onChange={(e) => setPairFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#181b22] border dark:border-[#2a2f3a] border-slate-200 rounded-xl pl-4 pr-10 py-3 text-xs font-bold uppercase tracking-widest dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm cursor-pointer"
              >
                {pairsList.map(p => (
                  <option key={p} value={p}>{p === "All" ? "All Pairs" : p}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative shrink-0">
              <select 
                value={strategyFilter} 
                onChange={(e) => setStrategyFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-[#181b22] border dark:border-[#2a2f3a] border-slate-200 rounded-xl pl-4 pr-10 py-3 text-xs font-bold uppercase tracking-widest dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm cursor-pointer"
              >
                {strategyList.map(s => (
                  <option key={s} value={s}>{s === "All" ? "All Strategies" : s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* TRADES GRID */}
        {filteredTrades.length === 0 ? (
          <div className="bg-white dark:bg-[#181b22] border border-dashed border-slate-200 dark:border-[#2a2f3a] rounded-3xl p-16 text-center flex flex-col items-center shadow-sm">
            <div className="w-20 h-20 dark:bg-[#0f1115] bg-slate-50 border dark:border-white/5 border-slate-200 rounded-full flex items-center justify-center mb-6">
              <Database className="w-8 h-8 dark:text-zinc-600 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black dark:text-white text-slate-900 mb-2 tracking-tight">No trades found</h2>
            <p className="text-sm font-medium dark:text-zinc-500 text-slate-500 max-w-sm mb-8">
              Either your vault is empty, or no trades match your current filters. Setup a trade in the Terminal to start compiling your journal.
            </p>
            <div className="flex gap-4">
              <button onClick={() => navigate('/')} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer">
                Go to Terminal
              </button>
              <button onClick={() => setIsNewTradeOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest dark:bg-[#121218] bg-slate-100 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 dark:text-zinc-300 text-slate-700 transition-colors cursor-pointer">
                Add Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTrades.map((trade) => {
              const isWin = trade.result === "Win";
              const isLoss = trade.result === "Loss";
              const isBE = trade.result === "Break Even";
              const isPending = trade.result === "Pending";
              
              const pnlColorClass = isWin ? "text-emerald-500" : isLoss ? "text-rose-500" : "dark:text-white text-slate-900";
              const borderHoverClass = isWin ? "hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]" : 
                                       isLoss ? "hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]" : 
                                       "hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]";

              return (
                <div 
                  key={trade.id} 
                  className={cn(
                    "bg-white dark:bg-[#181b22] border border-slate-200 dark:border-[#2a2f3a] rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 relative group overflow-hidden shadow-sm hover:-translate-y-1 cursor-pointer",
                    borderHoverClass
                  )}
                  onClick={() => setViewingTrade(trade)}
                >
                  <div className={cn(
                    "absolute -right-20 -top-20 w-32 h-32 blur-[60px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none",
                    isWin ? "bg-emerald-500" : isLoss ? "bg-rose-500" : "bg-slate-500"
                  )} />

                  {/* Top Row: Pair & Result */}
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex flex-col">
                      <span className="text-sm font-black dark:text-white text-slate-900 tracking-tight">{trade.pair}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mt-0.5">
                        {trade.strategyName || "No Strategy"}
                      </span>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest shadow-sm border",
                      isWin ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                      isLoss ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400" :
                      "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400"
                    )}>
                      {isBE ? "BE" : trade.result}
                    </div>
                  </div>

                  {/* Middle Row: PnL & RR */}
                  <div className="flex items-end justify-between relative z-10">
                      <div className="flex flex-col">
                        <span className={cn("text-base font-black font-mono leading-none", pnlColorClass)}>
                          {isPending ? "Pending" : `${isWin ? '+' : isLoss ? '-' : ''}$${Math.abs(trade.pnl || 0).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                            "flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest",
                            trade.direction === "Long" ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {trade.direction === "Long" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                            {trade.direction}
                        </div>
                        <span className="text-[10px] font-bold font-mono dark:text-zinc-400 text-slate-500 bg-slate-100 dark:bg-[#0f1115] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5">
                          1:{trade.rrRatio?.toFixed(1) || "0"}
                        </span>
                      </div>
                  </div>

                  {/* Bottom Row: Previews and Date */}
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-widest dark:text-zinc-500 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(trade.date), "MMM d, yy")}
                      </div>
                      
                      {trade.screenshot ? (
                        <div className="w-6 h-6 rounded bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 overflow-hidden relative">
                           <img src={trade.screenshot} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded bg-slate-50 dark:bg-[#0f1115] border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center opacity-50">
                           <ImageIcon className="w-3 h-3 dark:text-zinc-500 text-slate-400" />
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI ASSISTANT PANEL */}
        <div className="mt-8">
          <AICoachChat trades={trades} />
        </div>
      </main>

      {/* MODALS */}
      {viewingTrade && <ViewTradeModal trade={viewingTrade} onClose={() => setViewingTrade(null)} onEdit={() => { setEditingTrade(viewingTrade); setViewingTrade(null); }} onDelete={() => { deleteTrade(viewingTrade.id); setViewingTrade(null); }} />}
      {editingTrade && <EditTradeModal trade={editingTrade} onClose={() => setEditingTrade(null)} />}
      {isNewTradeOpen && (
        <NewTradeModal 
          onClose={() => setIsNewTradeOpen(false)} 
          onSuccess={() => {
            setIsNewTradeOpen(false);
            setToast({ message: "Trade Saved Successfully", type: "success" });
            setTimeout(() => setToast(null), 3000);
          }} 
        />
      )}

      {toast && (
        <div className={cn(
          "fixed bottom-24 sm:bottom-8 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-8 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold shadow-2xl animate-in slide-in-from-bottom-5 fade-in z-50",
          toast.type === "success" 
            ? "bg-emerald-500 text-white shadow-emerald-500/20" 
            : "bg-rose-500 text-white shadow-rose-500/20"
        )}>
          {toast.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

    </div>
  );
}

// ------------------------------------------------------------
// VIEW TRADE MODAL (Premium Full Screen / Modal)
// ------------------------------------------------------------
function ViewTradeModal({ trade, onClose, onEdit, onDelete }: { trade: VaultTrade, onClose: () => void, onEdit: () => void, onDelete: () => void }) {
  const isWin = trade.result === "Win";
  const isLoss = trade.result === "Loss";
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white dark:bg-[#181b22] border border-slate-200 dark:border-[#2a2f3a] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b dark:border-[#2a2f3a] border-slate-200 dark:bg-[#181b22] bg-white shrink-0">
           <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <h2 className="text-2xl font-black tracking-tight dark:text-white text-slate-900 flex items-center gap-3">
                 {trade.pair}
                 <span className={cn(
                   "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
                   trade.direction === "Long" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                 )}>
                   {trade.direction === "Long" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />} {trade.direction}
                 </span>
               </h2>
               <span className="text-xs font-bold dark:text-zinc-500 text-slate-500 mt-1 uppercase tracking-widest flex items-center gap-2">
                 <Calendar className="w-3 h-3" /> {format(parseISO(trade.date), "MMM d, yyyy • HH:mm")}
               </span>
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             <button onClick={onEdit} className="hidden sm:flex px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors items-center gap-2 cursor-pointer border border-cyan-500/20">
               <Edit3 className="w-3.5 h-3.5" /> Edit
             </button>
             <button onClick={onClose} className="w-10 h-10 rounded-full dark:bg-[#0f1115] bg-slate-100 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-slate-200 dark:border-white/5">
                <X className="w-5 h-5 dark:text-white text-slate-900" />
             </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-[#0f1115]">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
             
             {/* LEFT COLUMN: Data */}
             <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Result Section */}
                <div className="bg-white dark:bg-[#181b22] p-6 rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm relative overflow-hidden">
                   {isWin && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 blur-3xl opacity-10 pointer-events-none rounded-full" />}
                   {isLoss && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 blur-3xl opacity-10 pointer-events-none rounded-full" />}
                   
                   <span className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 block mb-2 relative z-10">Final Outcome</span>
                   <div className={cn(
                     "text-4xl font-black font-mono tracking-tight mb-4 relative z-10",
                     isWin ? "text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" : 
                     isLoss ? "text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]" : 
                     "dark:text-white text-slate-900"
                   )}>
                     {trade.result === "Pending" ? "Pending" : trade.result === "Break Even" ? "Breakeven" : `${isWin ? '+' : '-'}$${Math.abs(trade.pnl || 0).toFixed(2)}`}
                   </div>

                   <div className="grid grid-cols-2 gap-4 relative z-10">
                     <div className="flex flex-col bg-slate-50 dark:bg-[#0f1115] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Target RR</span>
                       <span className="text-sm font-black font-mono dark:text-white text-slate-900">1:{trade.rrRatio?.toFixed(2)}</span>
                     </div>
                     <div className="flex flex-col bg-slate-50 dark:bg-[#0f1115] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Risk</span>
                       <span className="text-sm font-black font-mono text-rose-500">${trade.riskAmount?.toFixed(2)}</span>
                     </div>
                   </div>
                </div>

                {/* Setup Params */}
                <div className="bg-white dark:bg-[#181b22] p-6 rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-4">
                     <Target className="w-3.5 h-3.5" /> Setup Parameters
                   </h3>
                   
                   <div className="space-y-3">
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Entry</span>
                        <span className="font-mono text-sm font-bold text-cyan-500">{trade.entryPrice}</span>
                     </div>
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Stop Loss</span>
                        <span className="font-mono text-sm font-bold text-rose-500">{trade.stopLoss}</span>
                     </div>
                     <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Take Profit</span>
                        <span className="font-mono text-sm font-bold text-emerald-500">{trade.takeProfit || "N/A"}</span>
                     </div>
                     <div className="flex justify-between items-center pt-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Lot Size</span>
                        <span className="font-mono text-sm font-bold dark:text-white text-slate-900">{trade.lotSize}</span>
                     </div>
                   </div>
                </div>

                {/* Strategy tags */}
                {(trade.strategyName || (trade.mistakes && trade.mistakes.length > 0)) && (
                   <div className="bg-white dark:bg-[#181b22] p-6 rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                         <BarChart className="w-3.5 h-3.5" /> Tags & Strategy
                      </h3>
                      
                      {trade.strategyName && (
                        <div className="mb-4">
                           <span className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest w-fit">
                             {trade.strategyName}
                           </span>
                        </div>
                      )}

                      {trade.mistakes && trade.mistakes.length > 0 && (
                        <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-2 block">Identified Mistakes</span>
                         <div className="flex flex-wrap gap-2">
                           {trade.mistakes.map(m => (
                             <span key={m} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3" /> {m}
                             </span>
                           ))}
                         </div>
                        </div>
                      )}
                   </div>
                )}
             </div>

             {/* RIGHT COLUMN: Evidence */}
             <div className="lg:col-span-8 flex flex-col gap-6">
                
                <div className="bg-white dark:bg-[#181b22] rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                   <div className="p-5 border-b border-slate-200 dark:border-[#2a2f3a] flex items-center justify-between shrink-0">
                      <span className="text-xs font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Chart Evidence
                      </span>
                      {trade.screenshot && (
                        <a href={trade.screenshot} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-colors">
                           Open Full Size <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                   </div>
                   <div className="flex-1 bg-slate-50 dark:bg-[#0f1115] p-2 flex items-center justify-center min-h-[300px]">
                     {trade.screenshot ? (
                       <img src={trade.screenshot} alt="Trade chart" className="max-w-full max-h-[600px] object-contain rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg" />
                     ) : (
                       <div className="flex flex-col items-center justify-center text-center p-8">
                          <div className="w-16 h-16 rounded-2xl dark:bg-[#181b22] bg-white border border-slate-200 dark:border-[#2a2f3a] flex items-center justify-center mb-4 shadow-sm">
                             <ImageIcon className="w-8 h-8 text-slate-400 dark:text-zinc-600" />
                          </div>
                          <span className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-2">No Screenshot Attached</span>
                          <span className="text-xs font-medium text-slate-500 dark:text-zinc-500 max-w-[250px]">
                            Edit this trade to upload visual evidence of your setup and execution.
                          </span>
                       </div>
                     )}
                   </div>
                </div>

                {trade.notes && (
                  <div className="bg-white dark:bg-[#181b22] p-6 rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4"/> Trade Notes & Journal
                    </h3>
                    <p className="dark:text-zinc-300 text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-serif">
                      {trade.notes}
                    </p>
                  </div>
                )}
             </div>

           </div>
        </div>

        {/* mobile action bar */}
        <div className="p-4 border-t dark:border-[#2a2f3a] border-slate-200 dark:bg-[#181b22] bg-white flex sm:hidden justify-between gap-3 shrink-0">
           <button onClick={onDelete} className="px-4 py-3 flex-1 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold uppercase tracking-widest border border-rose-500/20 text-center">
             Delete
           </button>
           <button onClick={onEdit} className="px-4 py-3 flex-1 rounded-xl bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-cyan-500/30 text-center">
             Edit Trade
           </button>
        </div>

      </div>
    </div>
  );
}

// ------------------------------------------------------------
// EDIT TRADE MODAL 
// ------------------------------------------------------------
function EditTradeModal({ trade, onClose }: { trade: VaultTrade, onClose: () => void }) {
  const { updateTrade } = useVaultStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    entryPrice: trade.entryPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    strategyName: trade.strategyName || "",
    notes: trade.notes || "",
    result: trade.result,
    pnl: Math.abs(trade.pnl || 0),
    screenshot: trade.screenshot || "",
    mistakes: [...(trade.mistakes || [])]
  });

  const handleMistakeToggle = (mistake: TradeMistake) => {
    setFormData(prev => ({
      ...prev,
      mistakes: prev.mistakes.includes(mistake)
        ? prev.mistakes.filter(m => m !== mistake)
        : [...prev.mistakes, mistake]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
         alert("Image too large (max 2MB to save browser storage space).");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, screenshot: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    let finalPnl = formData.pnl || 0;
    if (formData.result === "Win") {
      finalPnl = Math.abs(finalPnl);
    } else if (formData.result === "Loss") {
      finalPnl = -Math.abs(finalPnl);
    } else if (formData.result === "Break Even") {
      finalPnl = 0;
    }

    updateTrade(trade.id, { ...formData, pnl: finalPnl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#181b22] border border-slate-200 dark:border-[#2a2f3a] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b dark:border-[#2a2f3a] border-slate-200 dark:bg-[#181b22] bg-white shrink-0">
          <div className="flex flex-col">
             <h2 className="text-xl font-black tracking-tight dark:text-white text-slate-900">Edit Execution</h2>
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">
               {trade.pair} • {trade.direction}
             </span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full dark:bg-[#0f1115] bg-slate-100 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-slate-200 dark:border-white/5">
             <X className="w-5 h-5 dark:text-white text-slate-900" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0f1115]">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             
             {/* Left Column: Form */}
             <div className="flex flex-col gap-6">
                
                {/* Result Block */}
                <div className="bg-white dark:bg-[#181b22] p-6 rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mb-4 block">Trade Outcome</h3>
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {["Pending", "Win", "Loss", "Break Even"].map(r => (
                      <button
                        key={r}
                        onClick={() => setFormData(prev => ({ ...prev, result: r as any }))}
                        className={cn(
                          "py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                          formData.result === r 
                            ? r === "Win" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" :
                              r === "Loss" ? "bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]" :
                              r === "Break Even" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]" :
                              "bg-slate-200 dark:bg-[#2a2f3a] border-slate-300 dark:border-zinc-500 text-slate-900 dark:text-white"
                            : "bg-slate-50 dark:bg-[#0f1115] border-slate-200 dark:border-white/5 text-slate-500 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                      >
                        {r === "Break Even" ? "BE" : r}
                      </button>
                    ))}
                  </div>
                  {formData.result !== "Pending" && formData.result !== "Break Even" && (
                    <div className="relative group/input">
                       <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-zinc-500 z-10">Net P/L ($)</label>
                       <input 
                          type="number" 
                          placeholder="e.g. 50"
                          value={formData.pnl || ""}
                          onChange={e => setFormData(prev => ({...prev, pnl: Number(e.target.value)}))}
                          className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2f3a] rounded-xl px-4 py-4 text-base font-mono font-bold focus:border-cyan-500 focus:outline-none transition-colors"
                       />
                    </div>
                  )}
                </div>

                {/* Setup Details */}
                <div className="bg-white dark:bg-[#181b22] p-6 rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm flex flex-col gap-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 block mb-1">Execution Details</span>
                  
                  <div className="flex gap-4">
                    <div className="relative group/input flex-1">
                      <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-zinc-500 z-10">Entry</label>
                      <input 
                        type="number" 
                        value={formData.entryPrice}
                        onChange={e => setFormData(prev => ({...prev, entryPrice: Number(e.target.value)}))}
                        className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2f3a] rounded-xl px-3 py-3 text-sm font-mono focus:border-cyan-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="relative group/input flex-1">
                      <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-rose-500 z-10">SL</label>
                      <input 
                        type="number" 
                        value={formData.stopLoss}
                        onChange={e => setFormData(prev => ({...prev, stopLoss: Number(e.target.value)}))}
                        className="w-full bg-slate-50 dark:bg-[#0f1115] border border-rose-500/30 rounded-xl px-3 py-3 text-sm font-mono focus:border-rose-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="relative group/input flex-1">
                      <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-emerald-500 z-10">TP</label>
                      <input 
                        type="number" 
                        value={formData.takeProfit}
                        onChange={e => setFormData(prev => ({...prev, takeProfit: Number(e.target.value)}))}
                        className="w-full bg-slate-50 dark:bg-[#0f1115] border border-emerald-500/30 rounded-xl px-3 py-3 text-sm font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="relative group/input mt-2">
                    <label className="absolute -top-2 left-3 px-1 dark:bg-[#181b22] bg-white text-[10px] uppercase font-bold tracking-widest text-zinc-500 z-10">Strategy Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. London Breakout, SMT"
                      value={formData.strategyName}
                      onChange={e => setFormData(prev => ({...prev, strategyName: e.target.value}))}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2f3a] rounded-xl px-4 py-4 text-sm font-bold focus:border-cyan-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 block mb-3">Mistakes / Errors Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {MISTAKES_LIST.map(mistake => {
                        const isActive = formData.mistakes.includes(mistake);
                        return (
                          <button
                            key={mistake}
                            onClick={() => handleMistakeToggle(mistake)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer",
                              isActive 
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400" 
                                : "bg-slate-50 dark:bg-[#0f1115] border-slate-200 dark:border-[#2a2f3a] text-slate-500 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-600"
                            )}
                          >
                            {mistake}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white dark:bg-[#181b22] p-6 rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mb-4 block">Trade Notes</h3>
                  <textarea 
                    rows={4}
                    placeholder="Why did you enter? Market conditions? Emotions?"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))}
                    className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2f3a] rounded-xl p-4 text-sm focus:border-cyan-500 focus:outline-none transition-colors resize-none font-serif leading-relaxed"
                  />
                </div>
             </div>

             {/* Right Column: Screenshot */}
             <div className="flex flex-col gap-6">
                <div className="bg-white dark:bg-[#181b22] p-6 rounded-3xl border border-slate-200 dark:border-[#2a2f3a] shadow-sm flex flex-col h-full min-h-[400px]">
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 block">Chart Evidence</span>
                     {formData.screenshot && (
                       <div className="flex items-center gap-3">
                         <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400 cursor-pointer">Replace</button>
                         <button onClick={() => setFormData(prev => ({...prev, screenshot: ""}))} className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-400 cursor-pointer">Remove</button>
                       </div>
                     )}
                   </div>

                   <div className={cn(
                     "flex-1 relative border-2 border-dashed rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all bg-slate-50 dark:bg-[#0f1115]",
                     formData.screenshot ? "border-transparent" : "border-slate-200 dark:border-[#2a2f3a] hover:border-cyan-500/50 cursor-pointer"
                   )}
                   onClick={() => !formData.screenshot && fileInputRef.current?.click()}
                   >
                     {formData.screenshot ? (
                       <img src={formData.screenshot} alt="Trade chart" className="absolute inset-0 w-full h-full object-contain" />
                     ) : (
                       <div className="text-center p-6 flex flex-col items-center">
                         <div className="w-16 h-16 dark:bg-[#181b22] bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200 dark:border-[#2a2f3a]">
                           <ImageIcon className="w-8 h-8 dark:text-zinc-600 text-slate-400" />
                         </div>
                         <p className="text-sm font-bold uppercase tracking-widest dark:text-white text-slate-900 mb-2">Upload Screenshot</p>
                         <p className="text-xs font-medium dark:text-zinc-500 text-slate-500 max-w-[200px] mb-6 line-clamp-2">Attach visual proof of your execution.</p>
                         <button className="px-5 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-colors cursor-pointer border border-cyan-500/20">
                           Browse Files
                         </button>
                       </div>
                     )}
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       accept="image/*"
                       onChange={handleImageUpload}
                     />
                   </div>
                </div>
             </div>

           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-[#2a2f3a] border-slate-200 dark:bg-[#181b22] bg-white flex justify-end gap-4 shrink-0">
           <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-100 transition-colors cursor-pointer">
             Cancel
           </button>
           <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all cursor-pointer">
             Save Changes
           </button>
        </div>

      </div>
    </div>
  );
}
