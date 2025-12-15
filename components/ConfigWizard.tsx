import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Database, Key, Globe, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export const ConfigWizard: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [step, setStep] = useState(1);

  const handleSave = () => {
    if (!url || !key) return;
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/20 shadow-xl">
               <Database className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">System Setup</h1>
            <p className="text-blue-100 text-xs font-medium mt-2">CONNECT YOUR DATABASE TO START</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6">
               <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4">
                  <HelpCircle className="text-blue-400 shrink-0" />
                  <div className="text-sm text-gray-300 space-y-2">
                     <p>This app requires a <strong className="text-white">Supabase</strong> backend to store users and game data.</p>
                     <p>It seems you haven't configured it yet.</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm uppercase flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</span>
                    Create Project
                  </h3>
                  <a 
                    href="https://supabase.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block group bg-surface hover:bg-white/5 border border-white/10 rounded-xl p-4 transition-all"
                  >
                     <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm group-hover:text-white transition-colors">Go to supabase.com</span>
                        <Globe size={16} className="text-gray-500" />
                     </div>
                  </a>
               </div>
               
               <Button fullWidth onClick={() => setStep(2)}>
                 I have my Project Keys <ArrowRight size={18} />
               </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase ml-1">Project URL</label>
                 <div className="relative">
                    <Globe className="absolute left-4 top-3.5 text-gray-500" size={18} />
                    <input 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://xyz.supabase.co"
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase ml-1">Anon / Public Key</label>
                 <div className="relative">
                    <Key className="absolute left-4 top-3.5 text-gray-500" size={18} />
                    <input 
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                 </div>
              </div>
              
              <div className="pt-2">
                <Button fullWidth onClick={handleSave} disabled={!url || !key}>
                  <ShieldCheck size={18} /> Connect System
                </Button>
                <button 
                  onClick={() => setStep(1)} 
                  className="w-full py-3 text-xs text-gray-500 hover:text-white transition-colors mt-2"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};