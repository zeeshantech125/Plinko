import React from 'react';
import { PageView } from '../types';
import { Gamepad2, Wallet, History, Settings, User } from 'lucide-react';
import { audioService } from '../services/audioService';

interface NavigationProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'GAME', icon: Gamepad2, label: 'Game' },
    { id: 'WALLET', icon: Wallet, label: 'Wallet' },
    { id: 'HISTORY', icon: History, label: 'History' },
    { id: 'SETTINGS', icon: Settings, label: 'Settings' },
  ];

  const handleNav = (id: string) => {
    audioService.playClick();
    onNavigate(id as PageView);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md border-t border-white/5 pb-safe pt-2 px-4 flex justify-around items-end z-50 h-[70px]">
      {navItems.map((item) => {
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${isActive ? 'text-primary -translate-y-2' : 'text-gray-500'}`}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
            {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-1" />}
          </button>
        );
      })}
    </div>
  );
};
