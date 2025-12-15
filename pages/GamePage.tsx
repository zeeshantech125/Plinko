import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { PlinkoBoard } from '../components/PlinkoBoard';
import { GameControls } from '../components/GameControls';
import { LiveBetsFeed } from '../components/LiveBetsFeed';
import { GameState, RiskLevel, UserState } from '../types';
import { calculateOutcome } from '../services/gameLogic';
import { audioService } from '../services/audioService';
import { Wallet, Bell, UserCircle } from 'lucide-react';

interface GamePageProps {
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void;
  user: UserState | null;
}

export const GamePage: React.FC<GamePageProps> = ({ balance, setBalance, user }) => {
  const [rows, setRows] = useState(10);
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.MEDIUM);
  const [betAmount, setBetAmount] = useState(100);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [path, setPath] = useState<number[] | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  // Core Game Loop
  const dropBall = useCallback(() => {
    if (balance < betAmount) {
      setAutoPlay(false);
      return; 
    }

    // Deduct Balance Immediately (Optimistic)
    setBalance(prev => prev - betAmount);
    
    setGameState(GameState.DROPPING);
    setLastWin(null);

    // Calculate Result
    const { multiplier, path } = calculateOutcome(rows, risk);
    setPath(path);

    // Store pending result
    (window as any).pendingResult = { multiplier, bet: betAmount };

  }, [balance, betAmount, rows, risk, setBalance]);

  const handleAnimationComplete = async () => {
    const result = (window as any).pendingResult;
    if (!result) return;

    const payout = result.bet * result.multiplier;
    
    // Update Balance (Add Payout)
    setBalance(prev => prev + payout);
    setLastWin(payout);
    audioService.playWin(result.multiplier);
    setGameState(GameState.COMPLETED);

    // Save to Database asynchronously
    if (user?.id) {
       await supabase.from('game_history').insert({
          user_id: user.id,
          bet: result.bet,
          multiplier: result.multiplier,
          payout: payout,
          rows: rows,
          risk: risk
       });
       // Balance update is handled by the setBalance prop wrapper in App.tsx
    }

    if (autoPlay) {
      setTimeout(() => {
        dropBall();
      }, 300);
    } else {
      setGameState(GameState.IDLE);
    }
  };

  useEffect(() => {
    if (autoPlay && gameState === GameState.IDLE) {
      dropBall();
    }
  }, [autoPlay, gameState, dropBall]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-white font-sans">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur-md border-b border-white/5 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-neon p-0.5">
             <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                <UserCircle size={20} className="text-gray-300"/>
             </div>
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-gray-400 leading-tight">PLAYER</span>
             <span className="text-xs font-bold leading-tight">{user?.username || 'Guest'}</span>
          </div>
        </div>

        {/* Balance Card */}
        <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-inner">
           <Wallet size={14} className="text-secondary" />
           <div className="flex flex-col items-end leading-none">
             <span className="text-[10px] text-gray-400 font-bold mb-0.5">WALLET</span>
             <span className="font-mono text-sm font-bold text-white">Rs {balance.toFixed(2)}</span>
           </div>
           <button className="bg-primary hover:bg-blue-600 text-[10px] font-bold px-2 py-1 rounded text-white ml-2 transition-colors">
             +
           </button>
        </div>
        
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
           <Bell size={20} />
           <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-surface"></span>
        </button>
      </div>

      {/* Win Notification */}
      {lastWin !== null && lastWin > 0 && (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-none">
           <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black px-6 py-2 rounded-full shadow-neon-green text-lg tracking-wider border-2 border-white/20">
             + Rs {lastWin.toFixed(2)}
           </div>
         </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative w-full overflow-hidden">
        {/* Live Bets Feed Overlay */}
        <LiveBetsFeed />
        
        <PlinkoBoard 
          rows={rows} 
          risk={risk} 
          gameState={gameState} 
          path={path}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>

      {/* Controls */}
      <GameControls 
        balance={balance}
        betAmount={betAmount}
        rows={rows}
        risk={risk}
        gameState={gameState}
        autoPlay={autoPlay}
        onBetChange={setBetAmount}
        onRiskChange={setRisk}
        onRowsChange={setRows}
        onDrop={dropBall}
        onToggleAuto={() => setAutoPlay(!autoPlay)}
      />
    </div>
  );
};