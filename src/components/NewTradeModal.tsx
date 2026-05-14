import React, { useState, useRef } from "react";
import { X, Save, Image as ImageIcon, CheckCircle2, RefreshCcw } from "lucide-react";
import { useVaultStore } from "../store/vaultStore";
import { VaultTrade, TradeMistake } from "../types/vault";
import { cn } from "../lib/utils";

const MISTAKES_LIST: TradeMistake[] = [
  "Overtrading", "Early entry", "Fear exit", "Revenge trade", 
  "No confirmation", "FOMO entry", "Other"
];

interface NewTradeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTradeModal({ onClose, onSuccess }: NewTradeModalProps) {
  const { addTrade } = useVaultStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pair, setPair] = useState("EURUSD");
  const [direction, setDirection] = useState<"Long" | "Short">("Long");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [rrRatio, setRrRatio] = useState("");
  const [pnl, setPnl] = useState("");
  const [result, setResult] = useState<VaultTrade["result"]>("Pending");
  
  const [strategyName, setStrategyName] = useState("");
  const [notes, setNotes] = useState("");
  const [mistakes, setMistakes] = useState<TradeMistake[]>([]);
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [date, setDate] = useState(new Date().toISOString().substring(0, 16)); // YYYY-MM-DDThh:mm

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateRR = () => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);

    if (entry && sl && entry !== sl) {
       const risk = Math.abs(entry - sl);
       if (tp && tp !== entry) {
          const reward = Math.abs(tp - entry);
          setRrRatio((reward / risk).toFixed(2));
       }
    }
  };

  const handleSubmit = () => {
    if (!pair || !entryPrice || !stopLoss) {
      alert("Please fill in Pair, Entry Price, and Stop Loss");
      return;
    }

    const trade: Omit<VaultTrade, 'id'> = {
      pair: pair.toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      riskAmount: 0,
      riskPercent: riskPercent ? parseFloat(riskPercent) : 1,
      lotSize: 0,
      rrRatio: rrRatio ? parseFloat(rrRatio) : 0,
      notes,
      screenshot,
      date: new Date(date).toISOString(),
      result,
      pnl: pnl ? parseFloat(pnl) : undefined,
      mistakes,
      strategyName
    };

    addTrade(trade);
    onSuccess();
  };

  const handleReset = () => {
    setPair("EURUSD");
    setDirection("Long");
    setEntryPrice("");
    setStopLoss("");
    setTakeProfit("");
    setRiskPercent("");
    setRrRatio("");
    setPnl("");
    setResult("Pending");
    setStrategyName("");
    setNotes("");
    setMistakes([]);
    setScreenshot(undefined);
    setDate(new Date().toISOString().substring(0, 16));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-[#0c0c10]/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white dark:bg-[#181b22] border border-slate-200 dark:border-[#2a2f3a] rounded-3xl w-full max-w-3xl overflow-hidden relative z-10 shadow-2xl flex flex-col h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Save className="w-5 h-5 text-cyan-500" />
             </div>
             <div>
                <h2 className="text-xl font-black dark:text-white text-slate-900 tracking-tight">New Custom Trade</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Log your execution manually</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-zinc-400 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
             {/* LEFT COLUMN */}
             <div className="flex flex-col gap-6">
                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mb-2">Trade Details</label>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Pair</span>
                        <input type="text" value={pair} onChange={e => setPair(e.target.value.toUpperCase())} className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm font-bold dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="EURUSD" />
                     </div>
                     <div className="flex border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#0f1115]">
                        <button onClick={() => setDirection("Long")} className={cn("flex-1 text-xs font-bold uppercase tracking-widest transition-colors", direction === "Long" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500" : "text-slate-500")}>Long</button>
                        <button onClick={() => setDirection("Short")} className={cn("flex-1 text-xs font-bold uppercase tracking-widest transition-colors", direction === "Short" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-b-2 border-rose-500" : "text-slate-500")}>Short</button>
                     </div>
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                     <input type="number" placeholder="Entry" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} onBlur={calculateRR} className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-3 text-xs font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors" />
                     <input type="number" placeholder="Stop Loss" value={stopLoss} onChange={e => setStopLoss(e.target.value)} onBlur={calculateRR} className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-3 text-xs font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors" />
                     <input type="number" placeholder="Target" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} onBlur={calculateRR} className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-3 text-xs font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors" />
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mb-2">Setup & Strategy</label>
                   <input type="text" value={strategyName} onChange={e => setStrategyName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors mb-3" placeholder="Strategy Name (e.g., London Breakout)" />
                   
                   <div className="grid grid-cols-2 gap-3">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</span>
                        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl pl-12 pr-4 py-3 text-xs font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors" />
                     </div>
                     <select value={result} onChange={e => setResult(e.target.value as any)} className="w-full appearance-none bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors">
                       <option value="Pending">Outcome: Pending</option>
                       <option value="Win">Outcome: Win</option>
                       <option value="Loss">Outcome: Loss</option>
                       <option value="Break Even">Outcome: Break Even</option>
                     </select>
                   </div>
                </div>

                <div>
                   <div className="grid grid-cols-3 gap-3">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input type="number" placeholder="Net PnL" value={pnl} onChange={e => setPnl(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl pl-7 pr-3 py-3 text-xs font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors" />
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">RR 1:</span>
                        <input type="number" placeholder="Ratio" value={rrRatio} onChange={e => setRrRatio(e.target.value)} step="0.1" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-3 py-3 text-xs font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors" />
                     </div>
                     <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                        <input type="number" placeholder="Risk" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} step="0.1" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl pl-3 pr-7 py-3 text-xs font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors" />
                     </div>
                   </div>
                </div>

             </div>

             {/* RIGHT COLUMN */}
             <div className="flex flex-col gap-6">
                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mb-2">Trade Notes</label>
                   <textarea 
                     value={notes} onChange={e => setNotes(e.target.value)} 
                     placeholder="Execution notes, emotions, mistakes..."
                     className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors h-28 resize-none"
                   />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-500 mb-2">Chart Screenshot</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
                      screenshot 
                        ? "border-cyan-500" 
                        : "border-slate-200 dark:border-white/10 hover:border-cyan-500 dark:hover:border-cyan-500 bg-slate-50 dark:bg-[#0f1115]"
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                    />
                    {screenshot ? (
                      <>
                        <img src={screenshot} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                           <span className="text-white text-xs font-bold uppercase tracking-widest">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">Click to upload chart</span>
                      </div>
                    )}
                  </div>
                  {screenshot && (
                    <button onClick={() => setScreenshot(undefined)} className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-2 hover:underline">
                      Remove Image
                    </button>
                  )}
                </div>

             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#121218] flex items-center justify-between">
           <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors">
              <RefreshCcw className="w-3.5 h-3.5" /> Reset
           </button>
           <div className="flex gap-3">
             <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
               Cancel
             </button>
             <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2">
               <CheckCircle2 className="w-4 h-4" /> Save Trade
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
