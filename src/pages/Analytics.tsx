import React, { useState, useMemo } from "react";
import { useVaultStore } from "../store/vaultStore";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  AlertOctagon, 
  Award,
  Zap,
  CalendarDays,
  Flame,
  FlameKindling,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BrainCircuit,
  Wallet
} from "lucide-react";
import { cn } from "../lib/utils";
import AICoachChat from "../components/AICoachChat";
import { isAfter, subDays, subYears, parseISO, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, getMonth, getYear } from "date-fns";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from "recharts";

type TimeFilter = "Today" | "7 Days" | "30 Days" | "90 Days" | "Year" | "All Time";

export default function Analytics() {
  const { trades } = useVaultStore();
  const [filter, setFilter] = useState<TimeFilter>("All Time");

  const stats = useMemo(() => {
    // Filter by time
    const now = new Date();
    const filteredTrades = trades.filter(t => {
      const tDate = parseISO(t.date);
      if (filter === "Today") return tDate.toDateString() === now.toDateString();
      if (filter === "7 Days") return isAfter(tDate, subDays(now, 7));
      if (filter === "30 Days") return isAfter(tDate, subDays(now, 30));
      if (filter === "90 Days") return isAfter(tDate, subDays(now, 90));
      if (filter === "Year") return isAfter(tDate, subYears(now, 1));
      return true;
    });

    const totalTradesCount = filteredTrades.length;
    if (totalTradesCount === 0) return null;

    const completedTrades = filteredTrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).filter(t => t.result && t.result !== "Pending");
    const wins = completedTrades.filter(t => t.result === "Win");
    const losses = completedTrades.filter(t => t.result === "Loss");
    
    const winCount = wins.length;
    const lossCount = losses.length;
    const winRate = completedTrades.length > 0 ? (winCount / completedTrades.length) * 100 : 0;

    const totalProfit = completedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const grossProfit = wins.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + (t.pnl || 0), 0));
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    const rrSum = completedTrades.reduce((acc, t) => acc + (t.rrRatio || 0), 0);
    const avgRR = completedTrades.length > 0 ? rrSum / completedTrades.length : 0;

    const riskSum = completedTrades.reduce((acc, t) => acc + (t.riskAmount || 0), 0);
    const uniqueDays = new Set(completedTrades.map(t => format(parseISO(t.date), "yyyy-MM-dd"))).size;
    const avgDailyRisk = uniqueDays > 0 ? riskSum / uniqueDays : 0;

    // Pairs
    const pairStats: Record<string, { pnl: number, total: number }> = {};
    completedTrades.forEach(t => {
      if (!pairStats[t.pair]) pairStats[t.pair] = { pnl: 0, total: 0 };
      pairStats[t.pair].total += 1;
      pairStats[t.pair].pnl += (t.pnl || 0);
    });
    
    let mostProfitablePair = { name: "N/A", pnl: -Infinity };
    Object.entries(pairStats).forEach(([name, data]) => {
      if (data.pnl > mostProfitablePair.pnl) {
        mostProfitablePair = { name, pnl: data.pnl };
      }
    });

    // Strategy
    const strategyStats: Record<string, { wins: number, losses: number, total: number, pnl: number }> = {};
    completedTrades.forEach(t => {
      if (!t.strategyName) return;
      if (!strategyStats[t.strategyName]) strategyStats[t.strategyName] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      strategyStats[t.strategyName].total += 1;
      strategyStats[t.strategyName].pnl += (t.pnl || 0);
      if (t.result === "Win") strategyStats[t.strategyName].wins += 1;
      else if (t.result === "Loss") strategyStats[t.strategyName].losses += 1;
    });

    let bestStrategy = { name: "N/A", pnl: -Infinity };
    const strategyChartData = Object.entries(strategyStats).map(([name, data]) => ({
      name,
      pnl: data.pnl,
      winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0
    })).sort((a, b) => b.pnl - a.pnl);

    if (strategyChartData.length > 0 && strategyChartData[0].pnl > 0) {
      bestStrategy = { name: strategyChartData[0].name, pnl: strategyChartData[0].pnl };
    }

    // Mistakes
    const mistakesCount: Record<string, number> = {};
    filteredTrades.forEach(t => {
      t.mistakes?.forEach(m => {
        mistakesCount[m] = (mistakesCount[m] || 0) + 1;
      });
    });
    let mostCommonMistake = "None";
    let maxMistakeCount = 0;
    Object.entries(mistakesCount).forEach(([m, count]) => {
      if (count > maxMistakeCount) {
        maxMistakeCount = count;
        mostCommonMistake = m;
      }
    });

    // Streaks
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let wStreak = 0;
    let lStreak = 0;
    completedTrades.forEach(t => {
      if (t.result === "Win") {
        wStreak++;
        lStreak = 0;
        if (wStreak > maxWinStreak) maxWinStreak = wStreak;
      } else if (t.result === "Loss") {
        lStreak++;
        wStreak = 0;
        if (lStreak > maxLossStreak) maxLossStreak = lStreak;
      } else {
        wStreak = 0;
        lStreak = 0;
      }
    });
    currentWinStreak = wStreak;
    currentLossStreak = lStreak;

    // Day of the week performance
    const dayStats: Record<string, { pnl: number, total: number }> = {};
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    dayNames.forEach(d => dayStats[d] = { pnl: 0, total: 0 });

    completedTrades.forEach(t => {
      const dayName = format(parseISO(t.date), "EEEE");
      if (dayStats[dayName]) {
        dayStats[dayName].pnl += (t.pnl || 0);
        dayStats[dayName].total += 1;
      }
    });

    const heatmapData = dayNames.map(day => ({
      name: day.substring(0, 3),
      day,
      pnl: dayStats[day].pnl,
      total: dayStats[day].total
    }));

    let bestDay = { name: "N/A", pnl: -Infinity };
    let worstDay = { name: "N/A", pnl: Infinity };
    Object.entries(dayStats).forEach(([name, data]) => {
      if (data.total > 0) {
        if (data.pnl > bestDay.pnl) bestDay = { name, pnl: data.pnl };
        if (data.pnl < worstDay.pnl) worstDay = { name, pnl: data.pnl };
      }
    });

    // Calendar Data
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const calendarStart = startOfWeek(currentMonthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(currentMonthEnd, { weekStartsOn: 0 });
    
    const calendarDaysArray = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    const calendarData = calendarDaysArray.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayTrades = completedTrades.filter(t => format(parseISO(t.date), "yyyy-MM-dd") === dateStr);
      
      const count = dayTrades.length;
      const pnl = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const wins = dayTrades.filter(t => t.result === "Win").length;
      const winRate = count > 0 ? (wins / count) * 100 : 0;
      
      const rrSumD = dayTrades.reduce((sum, t) => sum + (t.rrRatio || 0), 0);
      const avgRR = count > 0 ? (rrSumD / count).toFixed(2) : "0";
      
      const isCurrentMonth = isSameMonth(date, now);
      
      let status = "No Activity";
      if (count > 0) {
        if (isSameDay(date, now)) status = "Pending";
        else status = "Counted";
      }

      return {
        date,
        dateStr,
        isCurrentMonth,
        count,
        pnl,
        winRate,
        avgRR,
        status,
        dayNumber: format(date, "d"),
        dayNameFull: format(date, "EEEE")
      };
    });

    const activeDaysThisMonth = calendarData.filter(d => d.isCurrentMonth && d.count > 0).reverse();

    // Best / Worst Trades
    let bestTrade = null;
    let worstTrade = null;
    if (completedTrades.length > 0) {
      bestTrade = [...completedTrades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0))[0];
      worstTrade = [...completedTrades].sort((a, b) => (a.pnl || 0) - (b.pnl || 0))[0];
    }

    // Equity curve
    let cumPnl = 0;
    const equityData = completedTrades.map(t => {
      cumPnl += (t.pnl || 0);
      return {
        date: format(parseISO(t.date), "MMM dd"),
        fullDate: format(parseISO(t.date), "MMM dd, yyyy"),
        pnl: t.pnl || 0,
        equity: cumPnl
      };
    });

    const renderInsights = () => {
      const insights = [];
      if (bestStrategy.name !== "N/A") {
        insights.push({ icon: Award, color: "text-emerald-400", bg: "bg-emerald-500/10", text: `Your best performance comes from the ${bestStrategy.name} strategy.` });
      }
      if (bestDay.name !== "N/A" && bestDay.pnl > 0) {
        insights.push({ icon: CalendarDays, color: "text-blue-400", bg: "bg-blue-500/10", text: `${bestDay.name} is your most profitable trading day.` });
      }
      if (mostCommonMistake !== "None") {
        insights.push({ icon: AlertOctagon, color: "text-rose-400", bg: "bg-rose-500/10", text: `Most losses involve "${mostCommonMistake}". Focus on eliminating this error.` });
      }
      if (currentLossStreak > 2) {
        insights.push({ icon: Activity, color: "text-orange-400", bg: "bg-orange-500/10", text: `You are on a ${currentLossStreak} trade losing streak. Consider reducing risk or stepping away.` });
      } else if (currentWinStreak > 2) {
        insights.push({ icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10", text: `You are hot! ${currentWinStreak} win streak. Stick to your rules and don't get overconfident.` });
      }
      return insights;
    };

    return {
      totalTradesCount,
      completedTradesCount: completedTrades.length,
      winRate,
      winCount,
      lossCount,
      totalProfit,
      profitFactor,
      avgRR,
      avgDailyRisk,
      bestTrade,
      worstTrade,
      mostProfitablePair: mostProfitablePair.name !== "N/A" && mostProfitablePair.pnl !== -Infinity ? mostProfitablePair : null,
      bestStrategy: bestStrategy.name !== "N/A" ? bestStrategy : null,
      strategyChartData,
      heatmapData,
      mostCommonMistake: maxMistakeCount > 0 ? `${mostCommonMistake} (${maxMistakeCount} times)` : "None yet",
      currentWinStreak,
      currentLossStreak,
      bestDay: bestDay.name !== "N/A" && bestDay.pnl > -Infinity ? bestDay : null,
      worstDay: worstDay.name !== "N/A" && worstDay.pnl < Infinity ? worstDay : null,
      equityData,
      insights: renderInsights(),
      calendarData,
      activeDaysThisMonth,
      currentMonthStart
    };
  }, [trades, filter]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto flex flex-col gap-8 py-8 px-4 sm:px-6 pb-10">
      
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 dark:bg-[#111111] bg-white p-6 rounded-2xl border dark:border-[#2a2a2a] border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none rounded-full"></div>

        <div className="flex items-center gap-4 relative z-10">
           <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
             <BrainCircuit className="w-8 h-8 text-indigo-400" />
           </div>
           <div>
             <h1 className="text-3xl font-black dark:text-white text-slate-900 tracking-tight">Performance Intelligence</h1>
             <p className="dark:text-zinc-400 text-slate-600 mt-1 text-sm font-medium">AI-powered trader tracking and deep analytics.</p>
           </div>
        </div>
        
        <div className="flex flex-wrap dark:bg-[#0c0c0c] bg-[#F8FAFC] border dark:border-[#2a2a2a] border-slate-200 rounded-lg p-1.5 relative z-10 gap-1">
          {(["Today", "7 Days", "30 Days", "90 Days", "Year", "All Time"] as TimeFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 border",
                filter === f 
                  ? "dark:bg-cyan-500/10 bg-cyan-50 dark:border-cyan-500/30 border-cyan-300 dark:text-cyan-400 text-cyan-600 dark:drop-shadow-[0_0_10px_rgba(6,182,212,0.4)] drop-shadow-sm shadow-sm scale-[1.02]" 
                  : "border-transparent dark:text-zinc-500 text-slate-500 dark:hover:text-cyan-400 hover:text-cyan-600 dark:hover:border-cyan-500/20 hover:border-cyan-200 dark:hover:bg-cyan-500/5 hover:bg-cyan-50 hover:-translate-y-0.5"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {!stats ? (
        <div className="flex flex-col items-center justify-center p-32 text-center dark:bg-[#111111] dark:bg-white/5 bg-black/50 border dark:border-[#2a2a2a] border-slate-200 rounded-2xl backdrop-blur-sm">
          <div className="w-20 h-20 dark:bg-[#161616] bg-slate-100 border dark:border-[#2a2a2a] border-slate-200 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <Activity className="w-10 h-10 dark:text-zinc-600 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-3 tracking-tight">System Awaiting Data</h2>
          <p className="dark:text-zinc-500 text-slate-500 max-w-sm text-sm leading-relaxed">
            Execute and record trades in the Vault to unlock performance intelligence and AI insights.
          </p>
        </div>
      ) : (
        <>
          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              label="Net PnL" 
              value={`${stats.totalProfit > 0 ? "+" : stats.totalProfit < 0 ? "-" : ""}$${Math.abs(stats.totalProfit).toFixed(2)}`}
              trend={stats.totalProfit > 0 ? "up" : stats.totalProfit < 0 ? "down" : "neutral"}
              icon={Wallet}
              isMoney
            />
            <MetricCard 
              label="Win Rate" 
              value={`${stats.winRate.toFixed(1)}%`}
              trend={stats.winRate > 50 ? "up" : "down"}
              icon={Target}
            />
            <MetricCard 
              label="Profit Factor" 
              value={stats.profitFactor === Infinity ? "MAX" : stats.profitFactor.toFixed(2)}
              trend={stats.profitFactor > 1.5 ? "up" : stats.profitFactor < 1 ? "down" : "neutral"}
              subVal={stats.profitFactor > 1.5 ? "Excellent" : stats.profitFactor > 1 ? "Profitable" : "Losing"}
              icon={TrendingUp}
            />
            <MetricCard 
              label="Total Executions" 
              value={stats.completedTradesCount}
              trend="neutral"
              icon={Activity}
            />
          </div>

          <div className="grid lg:grid-cols-[1fr] xl:grid-cols-[1fr_350px] gap-6 items-start">
            
            {/* Left Column - Main Charts */}
            <div className="flex flex-col gap-6 w-full">
              
              {/* Equity Curve Chart */}
              <div className="dark:bg-[#111111] bg-white border dark:border-[#2a2a2a] border-slate-200 p-6 rounded-2xl relative overflow-hidden group premium-hover">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-sm font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-600 flex items-center gap-2">
                     {stats.totalProfit >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />} Balance Growth
                   </h3>
                   <div className={cn("text-xs font-mono font-bold px-2 py-1 rounded border", stats.totalProfit >= 0 ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-rose-500 bg-rose-500/10 border-rose-500/20")}>
                     Latest: ${stats.equityData[stats.equityData.length - 1]?.equity.toFixed(2) || "0.00"}
                   </div>
                 </div>
                 
                 <div className="h-[300px] w-full">
                  {stats.equityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.equityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={stats.totalProfit >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={stats.totalProfit >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke="#52525b" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#71717a' }}
                          minTickGap={30}
                        />
                        <YAxis 
                          stroke="#52525b" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `$${value}`}
                          tick={{ fill: '#71717a' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '13px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                          itemStyle={{ color: stats.totalProfit >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
                          labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="equity" 
                          stroke={stats.totalProfit >= 0 ? "#10b981" : "#ef4444"} 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorEquity)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center dark:text-zinc-600 text-slate-400 italic text-sm">
                      No completed trades to chart equity.
                    </div>
                  )}
                 </div>
              </div>

              {/* Advanced Dual Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                 {/* Win/Loss Pie */}
                 <div className="dark:bg-[#111111] bg-white border dark:border-[#2a2a2a] border-slate-200 p-6 rounded-2xl flex flex-col h-[350px] group premium-hover">
                   <h3 className="text-sm font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-600 mb-2 flex items-center gap-2">
                     <PieChartIcon className="w-4 h-4 text-blue-400" /> Win / Loss Distribution
                   </h3>
                   <div className="flex-1 min-h-0 relative">
                     {stats.completedTradesCount > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={[
                               { name: 'Wins', value: stats.winCount },
                               { name: 'Losses', value: stats.lossCount },
                             ]}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={100}
                             paddingAngle={5}
                             dataKey="value"
                             stroke="none"
                             animationDuration={1000}
                           >
                             <Cell key="cell-wins" fill="#10b981" />
                             <Cell key="cell-losses" fill="#ef4444" />
                           </Pie>
                           <Tooltip 
                             contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                             itemStyle={{ fontWeight: 700, color: '#fff' }}
                           />
                           <Legend 
                             verticalAlign="bottom" 
                             height={36} 
                             iconType="circle"
                             formatter={(value) => <span className="dark:text-zinc-300 text-slate-700 font-medium ml-1">{value}</span>}
                           />
                         </PieChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="h-full w-full flex items-center justify-center dark:text-zinc-600 text-slate-400 italic text-sm">
                         Not enough data
                       </div>
                     )}
                     {stats.completedTradesCount > 0 && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 text-center">
                         <span className="text-2xl font-bold dark:text-white text-slate-900">{stats.winRate.toFixed(0)}%</span>
                         <span className="text-[10px] font-mono dark:text-zinc-500 text-slate-500 uppercase tracking-widest mt-0.5">Win Rate</span>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Strategy Performance */}
                 <div className="dark:bg-[#111111] bg-white border dark:border-[#2a2a2a] border-slate-200 p-6 rounded-2xl flex flex-col h-[350px] group premium-hover">
                   <h3 className="text-sm font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-600 mb-2 flex items-center gap-2">
                     <Target className="w-4 h-4 text-purple-400" /> Strategy P/L Comparison
                   </h3>
                   <div className="flex-1 min-h-0">
                     {stats.strategyChartData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={stats.strategyChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} layout="vertical">
                           <XAxis type="number" hide />
                           <YAxis 
                             dataKey="name" 
                             type="category" 
                             axisLine={false} 
                             tickLine={false} 
                             fontSize={11} 
                             width={100}
                             tick={{ fill: '#a1a1aa' }}
                           />
                           <Tooltip 
                             cursor={{ fill: '#1a1a1a' }}
                             contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                             formatter={(value: number) => [
                               <span className={cn(value > 0 ? "text-emerald-400" : "text-rose-400")}>
                                 {value > 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}
                               </span>, 
                               'Net P/L'
                             ]}
                           />
                           <Bar dataKey="pnl" radius={[0, 4, 4, 0]} animationDuration={1000} barSize={24}>
                             {stats.strategyChartData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="h-full w-full flex items-center justify-center dark:text-zinc-600 text-slate-400 italic text-sm">
                         Tag strategies in vault to see comparison.
                       </div>
                     )}
                   </div>
                 </div>
              </div>

               {/* Day Performance Heatmap Calendar */}
               <div className="dark:bg-[#111111] bg-white border dark:border-[#2a2a2a] border-slate-200 p-6 rounded-2xl group premium-hover">
                 <h3 className="text-sm font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-600 mb-6 flex items-center gap-2">
                   <CalendarDays className="w-4 h-4 text-cyan-400" /> Day of Week Performance
                 </h3>
                 
                 <div className="w-full">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest dark:text-zinc-500 text-slate-400 pb-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 relative z-10 w-full min-w-0">
                      {stats.calendarData.map((day, idx) => {
                         const isProfit = day.pnl > 0;
                         const isLoss = day.pnl < 0;
                         const isLargeProfit = day.pnl >= 200; // Mock threshold for large
                         const isLargeLoss = day.pnl <= -200;
                         const hasTrades = day.count > 0;

                         let bgColor = "dark:bg-[#16161a] bg-slate-50";
                         if (hasTrades) {
                           if (isLargeProfit) bgColor = "bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                           else if (isProfit) bgColor = "bg-emerald-500/10 border-emerald-500/20";
                           else if (isLargeLoss) bgColor = "bg-rose-500/20 border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.2)]";
                           else if (isLoss) bgColor = "bg-rose-500/10 border-rose-500/20";
                           else bgColor = "bg-slate-200/50 dark:bg-white/5 border-slate-300 dark:border-white/10";
                         }

                         return (
                           <div 
                             key={idx} 
                             className={cn(
                               "relative w-full aspect-square rounded-lg sm:rounded-xl border border-transparent transition-all duration-300 group/day",
                               !day.isCurrentMonth && "opacity-20 pointer-events-none",
                               hasTrades ? "cursor-pointer hover:scale-[1.05] hover:z-10" : "",
                               bgColor
                             )}
                           >
                             <div className="absolute inset-0 flex flex-col items-center justify-center p-1 sm:p-2">
                               <div className={cn(
                                 "text-[10px] sm:text-xs font-bold absolute top-1 sm:top-2 left-1.5 sm:left-2",
                                 hasTrades ? (isProfit ? "text-emerald-500" : isLoss ? "text-rose-500" : "text-slate-500 dark:text-zinc-400") : "text-slate-400 dark:text-zinc-600"
                               )}>{day.dayNumber}</div>
                               
                               {hasTrades && (
                                 <div className={cn(
                                   "text-[8px] sm:text-xs font-black font-mono tracking-tighter mt-3 sm:mt-4 text-center w-full truncate",
                                   isProfit ? "text-emerald-600 dark:text-emerald-400" : isLoss ? "text-rose-600 dark:text-rose-400" : "dark:text-white text-slate-900"
                                 )}>
                                   {isProfit ? '+' : isLoss ? '-' : ''}${Math.abs(day.pnl).toFixed(0)}
                                 </div>
                               )}
                             </div>

                             {/* Tooltip */}
                             {hasTrades && (
                               <div className="fixed sm:absolute bottom-4 sm:bottom-full sm:left-1/2 sm:-translate-x-1/2 left-4 right-4 sm:mb-2 sm:w-48 p-4 sm:p-3 dark:bg-[#1a1a24] bg-white border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all duration-300 z-[100] pointer-events-none translate-y-4 sm:translate-y-2 group-hover/day:translate-y-0 backdrop-blur-xl">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                    {day.dayNameFull}
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <div className={cn("text-lg font-black font-mono tracking-tight", isProfit ? "text-emerald-500" : isLoss ? "text-rose-500" : "dark:text-white text-slate-900")}>
                                      {isProfit ? '+' : isLoss ? '-' : ''}${Math.abs(day.pnl).toFixed(2)}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-[10px] font-bold dark:text-zinc-400 text-slate-500 uppercase">{day.count} Trade{day.count !== 1 ? 's' : ''}</span>
                                      <span className="text-[10px] font-bold dark:text-white text-slate-900 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">{day.status}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold dark:text-zinc-400 text-slate-500 uppercase">Win Rate</span>
                                      <span className="text-[10px] font-bold dark:text-white text-slate-900">{day.winRate.toFixed(0)}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold dark:text-zinc-400 text-slate-500 uppercase">RR</span>
                                      <span className="text-[10px] font-bold dark:text-white text-slate-900">1:{day.avgRR}</span>
                                    </div>
                                  </div>
                               </div>
                             )}
                           </div>
                         );
                      })}
                    </div>
                 </div>
                 
                 {/* Daily Breakdown Table */}
                 <div className="mt-8 border-t dark:border-[#2a2a2a] border-slate-200 pt-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-600 mb-4">
                      Daily Breakdown — {format(stats.currentMonthStart, "MMMM yyyy")}
                    </h3>
                    
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[300px]">
                        <thead>
                          <tr className="border-b dark:border-[#2a2a2a] border-slate-200 dark:text-zinc-500 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <th className="pb-3 font-medium whitespace-nowrap min-w-[120px]">Date</th>
                            <th className="pb-3 font-medium">Result</th>
                            <th className="pb-3 font-medium text-right">Net P&L</th>
                            <th className="pb-3 font-medium text-right pl-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.activeDaysThisMonth.map((day, i) => {
                             const isProfit = day.pnl > 0;
                             const isLoss = day.pnl < 0;
                             return (
                               <tr key={i} className="border-b dark:border-[#2a2a2a]/50 border-slate-100 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                 <td className="py-3 text-xs font-bold dark:text-white text-slate-900 font-mono">
                                   {format(day.date, "EEE MMM d")}
                                 </td>
                                 <td className="py-3">
                                   <div className={cn(
                                     "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                                     isProfit ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : 
                                     isLoss ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" : 
                                     "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/10"
                                   )}>
                                     {isProfit ? 'Profit' : isLoss ? 'Loss' : 'Neutral'}
                                   </div>
                                 </td>
                                 <td className={cn(
                                   "py-3 text-xs font-black font-mono text-right",
                                   isProfit ? "text-emerald-600 dark:text-emerald-400" : 
                                   isLoss ? "text-rose-600 dark:text-rose-400" : 
                                   "dark:text-white text-slate-900"
                                 )}>
                                   {isProfit ? '+' : isLoss ? '-' : ''}${Math.abs(day.pnl).toFixed(2)}
                                 </td>
                                 <td className="py-3 text-right">
                                   <span className={cn(
                                     "text-[10px] font-bold uppercase tracking-widest",
                                     day.status === 'Pending' ? "text-amber-500" : "dark:text-zinc-500 text-slate-400"
                                   )}>
                                     {day.status}
                                   </span>
                                 </td>
                               </tr>
                             );
                          })}
                          {stats.activeDaysThisMonth.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-xs dark:text-zinc-500 text-slate-400 italic font-medium">
                                No trading activity this month.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                 </div>
               </div>

            </div>

            {/* Right Column - Deep Insights & Stats */}
            <div className="flex flex-col gap-6">
              
              {/* Trading Habits (Beginner-Friendly Psychology Cards) */}
              <div className="dark:bg-[#111111] bg-white border dark:border-[#2a2a2a] border-slate-200 p-6 rounded-2xl relative overflow-hidden group premium-hover">
                 <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                   <BrainCircuit className="w-32 h-32 text-cyan-400" />
                 </div>
                 <h3 className="text-sm font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-600 mb-5 flex items-center gap-2 relative z-10">
                   <Target className="w-4 h-4 text-cyan-400" /> Trading Habits
                 </h3>
                 
                 <div className="flex flex-col gap-3 relative z-10">
                   {stats.insights.length > 0 ? (
                     stats.insights.map((insight, i) => {
                       const Icon = insight.icon;
                       return (
                         <div key={i} className="flex gap-3 items-start dark:bg-[#16161a] bg-slate-100/80 backdrop-blur-sm p-4 rounded-xl border dark:border-[#2a2a2a] border-slate-200 group transition-colors">
                           <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", insight.bg)}>
                             <Icon className={cn("w-4 h-4", insight.color)} />
                           </div>
                           <p className="text-sm dark:text-zinc-300 text-slate-700 leading-relaxed font-medium">{insight.text}</p>
                         </div>
                       );
                     })
                   ) : (
                     <div className="text-sm dark:text-zinc-500 text-slate-500 italic p-6 text-center border border-dashed dark:border-[#2a2a2a] border-slate-200/50 rounded-xl bg-black/20">
                       Record more trades to unlock personalized psychological insights and habit analysis.
                     </div>
                   )}
                 </div>
              </div>

              {/* Best & Worst Trades */}
              {(stats.bestTrade || stats.worstTrade) && (
                <div className="dark:bg-[#111111] bg-white border dark:border-[#2a2a2a] border-slate-200 p-6 rounded-2xl flex flex-col gap-4 group premium-hover">
                   <h3 className="text-sm font-bold uppercase tracking-widest dark:text-zinc-400 text-slate-600 mb-1 flex items-center gap-2">
                     <Award className="w-4 h-4 text-cyan-400" /> Notable Executions
                   </h3>
                   
                   {stats.bestTrade && stats.bestTrade.pnl && stats.bestTrade.pnl > 0 && (
                     <div className="dark:bg-[#161616] bg-slate-100 border border-emerald-500/20 p-4 rounded-xl flex flex-col hover:border-emerald-500/40 transition-colors">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Best Trade</span>
                         <span className="text-xs dark:text-zinc-500 text-slate-500 font-mono">{format(parseISO(stats.bestTrade.date), "MMM dd")}</span>
                       </div>
                       <div className="flex justify-between items-end">
                         <div>
                           <div className="text-lg font-bold dark:text-white text-slate-900">{stats.bestTrade.pair}</div>
                           <div className="text-xs dark:text-zinc-400 text-slate-600 mt-0.5">{stats.bestTrade.strategyName || "No Strategy"}</div>
                         </div>
                         <div className="text-xl font-black text-emerald-400">
                           +${stats.bestTrade.pnl.toFixed(2)}
                         </div>
                       </div>
                     </div>
                   )}

                   {stats.worstTrade && stats.worstTrade.pnl && stats.worstTrade.pnl < 0 && (
                     <div className="dark:bg-[#161616] bg-slate-100 border border-rose-500/20 p-4 rounded-xl flex flex-col hover:border-rose-500/40 transition-colors">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">Worst Trade</span>
                         <span className="text-xs dark:text-zinc-500 text-slate-500 font-mono">{format(parseISO(stats.worstTrade.date), "MMM dd")}</span>
                       </div>
                       <div className="flex justify-between items-end">
                         <div>
                           <div className="text-lg font-bold dark:text-white text-slate-900">{stats.worstTrade.pair}</div>
                           <div className="text-xs dark:text-zinc-400 text-slate-600 mt-0.5">{stats.worstTrade.strategyName || "No Strategy"}</div>
                         </div>
                         <div className="text-xl font-black text-rose-400">
                           -${Math.abs(stats.worstTrade.pnl).toFixed(2)}
                         </div>
                       </div>
                     </div>
                   )}
                </div>
              )}

            </div>
          </div>

          {/* AI ASSISTANT PANEL */}
          <div className="mt-8">
            <AICoachChat trades={trades} />
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, trend, subVal, icon: Icon, isMoney }: any) {
  return (
    <div className="dark:bg-[#111111] bg-white border dark:border-[#2a2a2a] border-slate-200 p-5 rounded-2xl flex flex-col justify-between group hover:border-[#4a4a4a] transition-all relative overflow-hidden">
      <div className={cn(
        "absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity",
        trend === "up" ? "bg-emerald-500" : trend === "down" ? "bg-rose-500" : "bg-blue-500"
      )}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="text-[10px] font-mono dark:text-zinc-400 text-slate-600 font-bold uppercase tracking-widest">{label}</div>
        <Icon className={cn("w-4 h-4", trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "dark:text-zinc-500 text-slate-500")} />
      </div>
      
      <div className="relative z-10 flex items-end justify-between">
        <div className={cn(
          "text-2xl font-black tracking-tight font-mono",
          trend === "up" && isMoney ? "text-emerald-400" : 
          trend === "down" && isMoney ? "text-rose-400" : "dark:text-white text-slate-900"
        )}>
          {value}
        </div>
        
        {subVal && (
           <div className={cn("text-xs font-semibold px-2 py-1 rounded dark:bg-[#1a1a1a] bg-slate-200", trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "dark:text-zinc-400 text-slate-600")}>
             {subVal}
           </div>
        )}
      </div>
    </div>
  );
}

function BehaviorRow({ label, value, sub, color }: any) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-sm font-medium dark:text-zinc-400 text-slate-600">{label}</span>
        {sub && <span className="text-[10px] uppercase tracking-wider dark:text-zinc-600 text-slate-400 font-mono mt-0.5">{sub}</span>}
      </div>
      <div className={cn("text-lg font-bold font-mono tracking-tight", color)}>{value}</div>
    </div>
  );
}
