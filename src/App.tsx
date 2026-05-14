import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import {
  TrendingUp,
  Database,
  BarChart3,
  TerminalSquare,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "./lib/utils";
import Terminal from "./pages/Terminal";
import Analytics from "./pages/Analytics";
import TradeVault from "./pages/TradeVault";
import { useVaultStore } from "./store/vaultStore";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme === "dark";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg border dark:border-[#2a2a2a] border-slate-200 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#161616] transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function Navigation() {
  const location = useLocation();
  const navItems = [
    { name: "Terminal", path: "/", icon: <TerminalSquare className="w-4 h-4" /> },
    { name: "Trade Vault", path: "/vault", icon: <Database className="w-4 h-4" /> },
    { name: "Performance", path: "/performance", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <>
      <nav className="border-b dark:border-[#2a2a2a] border-slate-200 dark:bg-[#0c0c0c] bg-[#F8FAFC] sticky top-0 z-50">
        <div className="w-full max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-cyan-400 w-9 h-9 flex items-center justify-center rounded-lg text-black shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <TrendingUp className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono dark:text-zinc-500 text-slate-500 tracking-widest font-bold uppercase leading-none mb-[2px]">
                Risk Terminal
              </span>
              <span className="font-bold tracking-tight text-[18px] dark:text-zinc-100 text-slate-900 leading-none">
                TRADER<span className="dark:text-zinc-500 text-slate-500">.FX</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (item.path === "/" && location.pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 border",
                  location.pathname === item.path
                    ? "dark:bg-cyan-500/10 bg-cyan-50 dark:border-cyan-500/30 border-cyan-300 dark:text-cyan-400 text-cyan-600 shadow-sm dark:drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "border-transparent dark:text-zinc-400 text-slate-600 dark:hover:text-cyan-400 hover:text-cyan-600 dark:hover:border-cyan-500/20 hover:border-cyan-200 dark:hover:bg-cyan-500/5 hover:bg-cyan-50"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Added Pricing / Auth placeholder as requested: "navbar, logo, pricing, login/signup, theme toggle" */}
            <div className="hidden sm:flex items-center gap-3">
               <button onClick={() => {
                 const el = document.getElementById('pricing');
                 if(el) el.scrollIntoView({ behavior: 'smooth' });
               }} className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</button>
               <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded transition-all hover:opacity-90">Login</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t dark:border-[#2a2a2a] border-slate-200 dark:bg-[#0c0c0c]/90 bg-[#F8FAFC]/90 backdrop-blur-md z-50 flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={(e) => {
              if (item.path === "/" && location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 min-w-[70px] text-xs font-medium transition-colors",
              location.pathname === item.path
                ? "text-cyan-600 dark:text-cyan-400 dark:drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                : "dark:text-zinc-500 text-slate-500 dark:hover:text-zinc-300 hover:text-slate-700"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function AppContent() {
  return (
    <>
      <Navigation />
      <main className="w-full">
        <Routes>
          <Route path="/" element={<Terminal />} />
          <Route path="/vault" element={<TradeVault />} />
          <Route path="/performance" element={<Analytics />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  const normalizeExistingTrades = useVaultStore(state => state.normalizeExistingTrades);
  
  useEffect(() => {
    normalizeExistingTrades();
  }, [normalizeExistingTrades]);

  return (
    <BrowserRouter>
      <div className="min-h-screen dark:bg-[#0c0c0c] bg-[#F8FAFC] dark:text-zinc-100 text-slate-900 font-sans pb-24 md:pb-0">
        <AppContent />
      </div>
    </BrowserRouter>
  );
}