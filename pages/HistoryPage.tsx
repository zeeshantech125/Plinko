import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { HistoryItem, UserState, RiskLevel } from '../types';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Hash, 
  Calendar, 
  Coins, 
  ArrowUpRight 
} from 'lucide-react';

export const HistoryPage: React.FC<{ user: UserState | null }> = ({ user }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
       fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const mapped: HistoryItem[] = data.map(d => ({
            id: d.id,
            timestamp: new Date(d.created_at).getTime(),
            bet: d.bet,
            multiplier: d.multiplier,
            payout: d.payout,
            rows: d.rows,
            risk: d.risk as any
        }));
        setHistory(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Summary Stats
  const stats = useMemo(() => {
    if (!history.length) return null;
    
    const totalWagered = history.reduce((acc, curr) => acc + curr.bet, 0);
    const totalPayout = history.reduce((acc, curr) => acc + curr.payout, 0);
    const netProfit = totalPayout - totalWagered;
    const bestWin = Math.max(...history.map(h => h.payout));
    const winRate = (history.filter(h => h.multiplier >= 1).length / history.length) * 100;

    return { totalWagered, netProfit, bestWin, winRate };
  }, [history]);

  const copyHash = (id: string) => {
    navigator.clipboard.writeText(id);
    // Optional: Toast notification here
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-white pb-24 relative overflow-hidden">
       {/* Background Elements */}
       <div className="fixed top-0 left-0 w-full h-96 bg-primary/5 rounded-b-[100px] blur-3xl pointer-events-none" />

       {/* Sticky Header */}
       <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface to-black border border-white/10 flex items-center justify-center shadow-lg">
                <Clock className="text-primary" size={20} />
             </div>
             <div>
               <h1 className="text-xl font-black tracking-tight">GAME LOGS</h1>
               <p className="text-[10px] text-gray-400 font-medium tracking-wider">LAST 50 ROUNDS</p>
             </div>
          </div>
       </div>

       {/* Content */}
       <div className="px-4 pt-6 space-y-6 relative z-10">
         
         {/* Stats Dashboard */}
         {!loading && stats && (
           <div className="grid grid-cols-2 gap-3">
              {/* Net Profit Card */}
              <div className={`col-span-2 p-5 rounded-2xl border relative overflow-hidden ${stats.netProfit >= 0 ? 'bg-gradient-to-br from-emerald-900/40 to-black border-emerald-500/30' : 'bg-gradient-to-br from-red-900/40 to-black border-red-500/30'}`}>
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    {stats.netProfit >= 0 ? <TrendingUp size={80} /> : <TrendingDown size={80} />}
                 </div>
                 <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Net Profit</span>
                 <div className={`text-3xl font-mono font-black mt-1 ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.netProfit >= 0 ? '+' : ''}Rs {Math.abs(stats.netProfit).toFixed(0)}
                 </div>
              </div>

              {/* Mini Stats */}
              <div className="p-4 bg-surface/50 border border-white/5 rounded-2xl flex flex-col justify-between">
                 <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Trophy size={14} className="text-accent" />
                    <span className="text-[10px] font-bold uppercase">Best Win</span>
                 </div>
                 <span className="text-lg font-mono font-bold text-white">Rs {stats.bestWin.toFixed(0)}</span>
              </div>

              <div className="p-4 bg-surface/50 border border-white/5 rounded-2xl flex flex-col justify-between">
                 <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Coins size={14} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase">Wagered</span>
                 </div>
                 <span className="text-lg font-mono font-bold text-white">Rs {stats.totalWagered.toFixed(0)}</span>
              </div>
           </div>
         )}

         {/* List */}
         <div className="space-y-3">
           {loading ? (
               <div className="text-center py-20 animate-pulse">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
                  <span className="text-sm font-bold text-primary">SYNCING BLOCKCHAIN...</span>
               </div>
           ) : history.length === 0 ? (
             <div className="text-center py-20 opacity-50">
               <div className="inline-block p-6 rounded-full bg-surface mb-4">
                 <Clock size={32} />
               </div>
               <p className="text-lg font-bold">No history found</p>
               <p className="text-sm">Start betting to build your legacy.</p>
             </div>
           ) : (
             history.map((item, index) => {
               const isWin = item.multiplier >= 1;
               const isBigWin = item.multiplier >= 10;
               const profit = item.payout - item.bet;
               
               return (
                 <div 
                   key={item.id} 
                   className={`
                     group relative overflow-hidden rounded-2xl border transition-all duration-300
                     hover:translate-x-1 hover:shadow-xl
                     ${isBigWin 
                        ? 'bg-gradient-to-r from-purple-900/40 via-surface to-black border-purple-500/50' 
                        : 'bg-surface border-white/5 hover:border-white/10'}
                   `}
                   style={{ animationDelay: `${index * 50}ms` }}
                 >
                   {/* Left Strip Indicator */}
                   <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWin ? (isBigWin ? 'bg-purple-500' : 'bg-green-500') : 'bg-slate-700'}`} />

                   <div className="p-4 pl-5 flex items-center justify-between">
                      {/* Left Side: Multiplier & Context */}
                      <div className="flex items-center gap-4">
                         <div className={`
                            flex flex-col items-center justify-center w-14 h-14 rounded-xl font-mono leading-none border
                            ${isWin 
                               ? (isBigWin 
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                    : 'bg-green-500/10 text-green-400 border-green-500/20') 
                               : 'bg-slate-800 text-slate-500 border-slate-700'}
                         `}>
                            <span className="text-lg font-black">{item.multiplier}x</span>
                            <span className="text-[9px] opacity-70 font-bold mt-0.5">{item.rows} Rows</span>
                         </div>

                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                               <span className="text-xs text-gray-400 font-mono">
                                 {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </span>
                               <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border ${
                                 item.risk === RiskLevel.HIGH ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                 item.risk === RiskLevel.MEDIUM ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                               }`}>
                                 {item.risk}
                               </span>
                            </div>
                            <div className="flex items-center gap-2 cursor-pointer group-hover:text-primary transition-colors" onClick={() => copyHash(item.id)}>
                               <Hash size={10} className="text-gray-600" />
                               <span className="text-[10px] text-gray-600 font-mono truncate max-w-[80px]">{item.id}</span>
                            </div>
                         </div>
                      </div>

                      {/* Right Side: Money */}
                      <div className="flex flex-col items-end">
                         <div className="flex flex-col items-end">
                           <span className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Payout</span>
                           <span className={`text-xl font-mono font-bold flex items-center gap-1 ${isWin ? (isBigWin ? 'text-purple-400' : 'text-green-400') : 'text-gray-500'}`}>
                              {isWin && <ArrowUpRight size={16} />}
                              Rs {item.payout.toFixed(0)}
                           </span>
                         </div>
                         <span className="text-[10px] text-gray-500 font-mono mt-1">
                           Bet: <span className="text-gray-300">Rs {item.bet}</span>
                         </span>
                      </div>
                   </div>
                 </div>
               );
             })
           )}
         </div>

         {/* End of list padding */}
         <div className="h-10" />
       </div>
    </div>
  );
};