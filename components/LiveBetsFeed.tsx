import React, { useState, useEffect, useMemo } from 'react';
import { User, Zap, Trophy } from 'lucide-react';
import { MULTIPLIERS } from '../constants';

interface FakeBet {
  id: number;
  username: string;
  amount: number;
  multiplier: number;
  payout: number;
  isHighRoller: boolean;
}

const USERNAMES = [
  'Ali', 'Zara', 'Khan', 'Bilal', 'User88', 'King', 'Viper', 'Ahmed', 
  'Sarah', 'Moon', 'Crypto', 'Lucky', 'Ghost', 'Master', 'Pro', 'Lion'
];

export const LiveBetsFeed: React.FC = () => {
  const [currentBet, setCurrentBet] = useState<FakeBet | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Flatten multipliers to pick realistic outcomes
  const allMultipliers = useMemo(() => {
    const list: number[] = [];
    Object.values(MULTIPLIERS).forEach((row) => {
      Object.values(row).forEach((risk) => {
        list.push(...(risk as number[]));
      });
    });
    return list;
  }, []);

  const generateBet = () => {
    const id = Date.now();
    const nameBase = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
    const suffix = Math.floor(Math.random() * 999);
    const username = `${nameBase}${suffix}`; // Shorter name format
    
    // Weighted random
    let multiplier = 0;
    const rand = Math.random();
    
    if (rand > 0.95) {
       const highMults = allMultipliers.filter(m => m > 10);
       multiplier = highMults[Math.floor(Math.random() * highMults.length)];
    } else if (rand > 0.7) {
       const midMults = allMultipliers.filter(m => m >= 2 && m <= 10);
       multiplier = midMults[Math.floor(Math.random() * midMults.length)];
    } else {
       const lowMults = allMultipliers.filter(m => m > 0.5 && m < 2);
       multiplier = lowMults[Math.floor(Math.random() * lowMults.length)] || 1.1;
    }

    const amount = [100, 200, 500, 1000, 5000][Math.floor(Math.random() * 5)];
    const payout = amount * multiplier;

    return {
      id,
      username,
      amount,
      multiplier,
      payout,
      isHighRoller: amount >= 1000 || multiplier >= 10
    };
  };

  useEffect(() => {
    const runCycle = () => {
      // 1. Exit Animation
      setIsVisible(false);
      
      // 2. Wait for exit, then update and Enter
      setTimeout(() => {
        setCurrentBet(generateBet());
        setIsVisible(true);
      }, 600); // 600ms exit delay
    };

    // Initial
    setCurrentBet(generateBet());
    setIsVisible(true);

    const interval = setInterval(runCycle, 4000); // New bet every 4 seconds

    return () => clearInterval(interval);
  }, [allMultipliers]);

  if (!currentBet) return null;

  const isWin = currentBet.multiplier >= 1;

  return (
    <div className="absolute top-3 right-3 z-20 pointer-events-none perspective-500">
      <div 
        className={`
          relative overflow-hidden
          flex items-center gap-2.5 p-1.5 pl-2 pr-4 rounded-full
          border backdrop-blur-xl shadow-2xl
          transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) origin-right
          ${isVisible 
            ? 'opacity-100 translate-x-0 scale-100' 
            : 'opacity-0 translate-x-4 scale-95'}
          ${currentBet.isHighRoller 
            ? 'bg-gradient-to-r from-purple-900/95 via-indigo-900/95 to-slate-900/95 border-purple-400/50 shadow-[0_4px_20px_rgba(168,85,247,0.4)]' 
            : 'bg-gradient-to-br from-slate-800/90 to-black/90 border-white/10 shadow-lg'}
        `}
      >
        {/* Shimmer Effect for entry focus */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 w-full h-full ${isVisible ? 'animate-shimmer' : ''}`} />

        {/* Avatar / Icon Section */}
        <div className="relative shrink-0">
           <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-inner ${
              currentBet.isHighRoller 
                ? 'bg-gradient-to-tr from-purple-500 to-pink-500 border-purple-300 text-white' 
                : 'bg-slate-700 border-slate-600 text-gray-400'
           }`}>
             {currentBet.isHighRoller ? <Zap size={12} fill="currentColor" /> : <User size={12} />}
           </div>
           {/* Online Status Dot */}
           <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-slate-900 rounded-full animate-pulse" />
        </div>

        {/* Text Content */}
        <div className="flex flex-col min-w-[70px]">
           {/* Top Row: User & Multiplier */}
           <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-gray-100 tracking-tight truncate max-w-[60px]">
                {currentBet.username}
              </span>
              <span className={`text-[10px] font-black font-mono flex items-center gap-0.5 ${
                 isWin ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-gray-500'
              }`}>
                 {currentBet.multiplier.toFixed(2)}x
              </span>
           </div>

           {/* Bottom Row: Bet & Win */}
           <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="text-[8px] font-medium text-gray-400">
                Rs {currentBet.amount}
              </span>
              {isWin && (
                 <span className={`text-[8px] font-bold font-mono px-1.5 py-[1px] rounded-[3px] ${
                    currentBet.isHighRoller 
                      ? 'bg-gradient-to-r from-amber-300 to-orange-500 text-black shadow-sm'
                      : 'bg-green-500/10 text-green-300 border border-green-500/20'
                 }`}>
                   +{currentBet.payout.toFixed(0)}
                 </span>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};