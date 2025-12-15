import React, { useState } from 'react';
import { RiskLevel, GameState } from '../types';
import { Button } from './ui/Button';
import { MIN_BET, MAX_BET, MIN_ROWS, MAX_ROWS } from '../constants';
import { Minus, Plus, Zap } from 'lucide-react';

interface GameControlsProps {
  balance: number;
  betAmount: number;
  rows: number;
  risk: RiskLevel;
  gameState: GameState;
  onBetChange: (val: number) => void;
  onRowsChange: (val: number) => void;
  onRiskChange: (val: RiskLevel) => void;
  onDrop: () => void;
  autoPlay: boolean;
  onToggleAuto: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  balance,
  betAmount,
  rows,
  risk,
  gameState,
  onBetChange,
  onRowsChange,
  onRiskChange,
  onDrop,
  autoPlay,
  onToggleAuto
}) => {
  const isPlaying = gameState !== GameState.IDLE && gameState !== GameState.COMPLETED;

  const handleBetInput = (val: number) => {
    if (val < MIN_BET) val = MIN_BET;
    if (val > MAX_BET) val = MAX_BET;
    onBetChange(val);
  };

  return (
    <div className="bg-surface p-4 rounded-t-3xl shadow-2xl border-t border-white/10 shrink-0 z-20 pb-20 md:pb-4">
      
      {/* Risk and Rows */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-background p-2 rounded-xl border border-white/5">
          <label className="text-xs text-gray-400 mb-1 block uppercase font-bold tracking-wider">Risk</label>
          <select 
            className="w-full bg-transparent text-white font-bold outline-none"
            value={risk}
            onChange={(e) => onRiskChange(e.target.value as RiskLevel)}
            disabled={isPlaying}
          >
            <option value={RiskLevel.LOW}>Low</option>
            <option value={RiskLevel.MEDIUM}>Medium</option>
            <option value={RiskLevel.HIGH}>High</option>
          </select>
        </div>
        
        <div className="bg-background p-2 rounded-xl border border-white/5">
          <label className="text-xs text-gray-400 mb-1 block uppercase font-bold tracking-wider">Rows</label>
          <div className="flex items-center justify-between">
            <button 
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              onClick={() => onRowsChange(Math.max(MIN_ROWS, rows - 1))}
              disabled={isPlaying || rows <= MIN_ROWS}
            >
              <Minus size={16} />
            </button>
            <span className="font-bold">{rows}</span>
            <button 
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              onClick={() => onRowsChange(Math.min(MAX_ROWS, rows + 1))}
              disabled={isPlaying || rows >= MAX_ROWS}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="bg-background p-3 rounded-xl border border-white/5 mb-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase font-bold">Bet Amount</span>
          <div className="flex items-center gap-1">
             <span className="text-primary font-bold">Rs</span>
             <input 
               type="number"
               value={betAmount}
               onChange={(e) => handleBetInput(parseInt(e.target.value) || 0)}
               className="bg-transparent text-xl font-mono font-bold w-24 outline-none"
               disabled={isPlaying}
             />
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             className="px-2 py-1 bg-surface rounded text-xs font-bold text-gray-400 hover:text-white"
             onClick={() => handleBetInput(Math.floor(betAmount / 2))}
             disabled={isPlaying}
            >½</button>
           <button 
             className="px-2 py-1 bg-surface rounded text-xs font-bold text-gray-400 hover:text-white"
             onClick={() => handleBetInput(betAmount * 2)}
             disabled={isPlaying}
           >2×</button>
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex gap-4">
        <Button 
          variant="secondary" 
          fullWidth 
          size="lg"
          onClick={onDrop}
          disabled={isPlaying || balance < betAmount}
          className="relative overflow-hidden"
        >
          {isPlaying ? 'Dropping...' : 'BET'}
        </Button>
      </div>
      
      {/* Auto Play Toggle */}
      <div className="mt-4 flex items-center justify-center gap-2">
         <span className={`text-xs font-bold ${autoPlay ? 'text-green-400' : 'text-gray-500'}`}>AUTO PLAY</span>
         <button 
           onClick={onToggleAuto}
           className={`w-10 h-5 rounded-full relative transition-colors ${autoPlay ? 'bg-green-500' : 'bg-gray-700'}`}
         >
           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoPlay ? 'left-6' : 'left-1'}`} />
         </button>
      </div>

    </div>
  );
};
