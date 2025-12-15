import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { audioService } from '../services/audioService';
import { Volume2, VolumeX, Zap, Shield, LogOut } from 'lucide-react';
import { UserState } from '../types';

export const SettingsPage: React.FC<{ user: UserState | null }> = ({ user }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    audioService.setEnabled(newState);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-background text-white">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-surface rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {soundEnabled ? <Volume2 className="text-primary" /> : <VolumeX className="text-gray-500" />}
            <span>Sound Effects</span>
          </div>
          <button 
            onClick={toggleSound}
            className={`w-12 h-6 rounded-full relative transition-colors ${soundEnabled ? 'bg-primary' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="text-accent" />
            <span>Fast Mode</span>
          </div>
          <button className="w-12 h-6 rounded-full bg-gray-700 relative">
             <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"></div>
          </button>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-green-500" />
            <span>Provably Fair</span>
          </div>
          <div className="text-xs text-gray-500">v1.0.2</div>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full bg-surface text-danger font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5"
      >
        <LogOut size={20} />
        Log Out
      </button>
      
      <div className="mt-8 text-center text-xs text-gray-600">
        UID: {user?.id || 'Unknown'}<br/>
        NeonPlinko Pro &copy; 2024
      </div>
    </div>
  );
};
