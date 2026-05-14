import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { cn } from "../lib/utils";
import { VaultTrade } from "../types/vault";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: "user" | "ai";
  content: string;
}

interface AICoachChatProps {
  trades: VaultTrade[];
}

export default function AICoachChat({ trades }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Connected. Ready to analyze your trading setups, execution patterns, and performance."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "Best setup?",
    "Biggest mistake?",
    "Best RR?",
    "Worst pair?",
    "Am I overtrading?"
  ];

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    if (!customInput) setInput("");
    
    setMessages(prev => [...prev, { role: "user", content: textToSend.trim() }]);
    setIsLoading(true);
    
    // Ensure scroll happens after adding user message
    setTimeout(scrollToBottom, 50);

    try {
      const summaryData = trades.map(t => ({
        pair: t.pair,
        direction: t.direction,
        pnl: t.pnl,
        rrRatio: t.rrRatio,
        strategy: t.strategyName,
        mistakes: t.mistakes,
        date: t.date,
        riskPercent: t.riskPercent
      }));

      const contextPrompt = `
        You are a smart, fast AI Trading Side-Assistant resolving queries inside a unified Assistant Center.
        You automatically figure out if the user's question relates to trades, setups, performance, discipline, or consistency.
        
        DATA AVAILABLE:
        ${JSON.stringify(summaryData)}

        User Question: ${textToSend}
        
        CRITICAL RULES:
        - EXTREMELY CONCISE. Maximum 1-2 short sentences.
        - Tone: Premium fintech, sharp, analytical, direct.
        - Answer directly based ONLY on provided data.
        - NO fluff, NO markdown code blocks, NO bold, NO lists unless requested.
        - If data is missing state: "Insufficient data."
      `;

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: contextPrompt }] }
        ]
      });

      // Turn off loading indicator, append empty msg to start streaming
      setIsLoading(false);
      setMessages(prev => [...prev, { role: "ai", content: "" }]);

      let fullText = "";
      for await (const chunk of responseStream) {
        fullText += (chunk.text || "");
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullText.replace(/\n\s*\n/g, '\n').trimStart();
          return newMessages;
        });
        scrollToBottom();
      }

    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setMessages(prev => [...prev, { role: "ai", content: "Terminal error: System connection failed." }]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#2a2f3a] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative h-[400px] group premium-hover">
       <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none opacity-50" />
       
       {/* Chat Header */}
       <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-sm font-black dark:text-white text-slate-900 leading-tight">
                AI Assistant Center
              </h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-cyan-600 dark:text-cyan-500/70">
                System Online
              </p>
            </div>
          </div>
       </div>

       {/* Chat Messages */}
       <div 
         ref={scrollRef}
         className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative z-10 custom-scrollbar scroll-smooth"
       >
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex max-w-[90%] flex-col gap-1", msg.role === "user" ? "self-end items-end" : "self-start items-start")}>
               <div className={cn(
                 "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm font-medium",
                 msg.role === "user" 
                   ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-sm" 
                   : "bg-slate-50 border border-slate-200 dark:border-[#2a2f3a] dark:bg-[#16181d] text-slate-800 dark:text-zinc-300 rounded-tl-sm tracking-tight"
               )}>
                 <span className="whitespace-pre-wrap">{msg.content}</span>
               </div>
            </div>
          ))}
          {isLoading && (
            <div className="self-start flex max-w-[85%] flex-col gap-1">
               <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#16181d] border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] rounded-tl-sm flex items-center gap-3">
                 <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                 <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">Analyzing data...</span>
               </div>
            </div>
          )}
       </div>

       {/* Quick Questions */}
       <div className="px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar relative z-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-[#111318]/50">
         {quickQuestions.map((q, idx) => (
           <button 
             key={idx}
             onClick={() => handleSend(q)}
             disabled={isLoading}
             className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-[#2a2f3a] bg-white dark:bg-[#181b22] dark:text-zinc-400 text-slate-600 hover:border-cyan-500/50 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors disabled:opacity-50"
           >
             {q}
           </button>
         ))}
       </div>

       {/* Chat Input */}
       <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#111318]/80 backdrop-blur-md relative z-10">
         <form 
           onSubmit={(e) => { e.preventDefault(); handleSend(); }}
           className="relative flex items-center group/input"
         >
           <input 
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Ask anything about your trading..."
             className="w-full bg-white dark:bg-[#181b22] border border-slate-200 dark:border-white/10 rounded-full py-3.5 pl-5 pr-14 text-sm font-medium focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 dark:text-white transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-zinc-500"
           />
           <button 
             type="submit"
             disabled={!input.trim() || isLoading}
             className="absolute right-2 w-10 h-10 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500 text-cyan-600 dark:text-cyan-400 hover:text-white rounded-full disabled:opacity-50 disabled:hover:bg-cyan-500/10 disabled:hover:text-cyan-600 dark:disabled:hover:text-cyan-400 transition-all"
           >
             <Send className="w-4 h-4 ml-0.5" />
           </button>
         </form>
       </div>
    </div>
  );
}
