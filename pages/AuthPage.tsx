import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Button } from '../components/ui/Button';
import { Mail, Lock, User, AlertCircle, CheckCircle, Gamepad2, Dices, Coins, Trophy, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationSent, setShowVerificationSent] = useState(false);

  // Background floating elements configuration
  const [particles, setParticles] = useState<{id: number, left: number, top: number, delay: number, duration: number, icon: any}[]>([]);

  useEffect(() => {
    // Generate static random positions for background particles only once on mount
    const icons = [Dices, Coins, Trophy, Gamepad2];
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      icon: icons[i % icons.length]
    }));
    setParticles(newParticles);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
            },
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setShowVerificationSent(true);
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#050b14] overflow-hidden font-sans selection:bg-neon/30">
      
      {/* --- Dynamic Background --- */}
      <div className="absolute inset-0 z-0">
         {/* Gradients */}
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050b14] to-[#050b14]"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>

         {/* Floating Casino Icons */}
         {particles.map((p) => (
           <div 
             key={p.id}
             className="absolute text-white/5 animate-bounce"
             style={{
               left: `${p.left}%`,
               top: `${p.top}%`,
               animationDuration: `${p.duration}s`,
               animationDelay: `${p.delay}s`,
             }}
           >
             <p.icon size={Math.random() * 40 + 20} />
           </div>
         ))}

         {/* Grid Pattern Overlay */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* --- Main Card --- */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Header Graphic */}
          <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90"></div>
             
             <div className="relative z-10 text-center transform translate-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 mb-2 shadow-lg shadow-purple-500/20">
                   <Gamepad2 className="text-white" size={24} />
                </div>
                <h1 className="text-2xl font-black text-white tracking-widest uppercase drop-shadow-md">
                   Neon<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">Plinko</span>
                </h1>
             </div>
          </div>

          <div className="p-8 pt-6">
             {showVerificationSent ? (
                <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-green-500/30">
                    <CheckCircle className="text-green-400 w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Check your Inbox</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    We've sent a magic link to <strong className="text-white">{email}</strong>.<br/>
                    Verify your account to unlock the casino.
                  </p>
                  <Button 
                    variant="ghost" 
                    fullWidth 
                    onClick={() => { setShowVerificationSent(false); setIsLogin(true); }}
                  >
                    Back to Login
                  </Button>
                </div>
             ) : (
               <>
                 {/* Toggle Switch */}
                 <div className="flex bg-black/20 p-1 rounded-xl mb-6 border border-white/5 relative">
                    <div 
                       className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-700/80 rounded-lg transition-all duration-300 ease-out shadow-lg ${isLogin ? 'left-1' : 'left-[calc(50%+3px)]'}`} 
                    />
                    <button 
                      onClick={() => { setIsLogin(true); setError(null); }}
                      className={`flex-1 relative z-10 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${isLogin ? 'text-white' : 'text-gray-500'}`}
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => { setIsLogin(false); setError(null); }}
                      className={`flex-1 relative z-10 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${!isLogin ? 'text-white' : 'text-gray-500'}`}
                    >
                      Sign Up
                    </button>
                 </div>

                 {error && (
                   <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-200 text-xs font-medium">
                     <AlertCircle size={16} className="shrink-0 mt-0.5" />
                     <span>{error}</span>
                   </div>
                 )}

                 <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                       <div className="group space-y-1.5">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">Username</label>
                         <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-500 group-focus-within:text-white transition-colors">
                               <User size={18} />
                            </div>
                            <input
                              type="text"
                              required={!isLogin}
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white font-medium focus:bg-black/40 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] outline-none transition-all placeholder:text-gray-600"
                              placeholder="Choose your alias"
                            />
                         </div>
                       </div>
                    )}

                    <div className="group space-y-1.5">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">Email Address</label>
                       <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-500 group-focus-within:text-white transition-colors">
                             <Mail size={18} />
                          </div>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white font-medium focus:bg-black/40 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] outline-none transition-all placeholder:text-gray-600"
                            placeholder="name@example.com"
                          />
                       </div>
                    </div>

                    <div className="group space-y-1.5">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">Password</label>
                       <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-500 group-focus-within:text-white transition-colors">
                             <Lock size={18} />
                          </div>
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white font-medium focus:bg-black/40 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] outline-none transition-all placeholder:text-gray-600"
                            placeholder="••••••••"
                          />
                       </div>
                    </div>
                    
                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-[1px]"
                      >
                         <div className="relative bg-slate-900/50 group-hover:bg-transparent transition-colors rounded-[11px] px-6 py-3.5 flex items-center justify-center gap-2">
                            <span className="font-bold text-sm tracking-wide text-white">
                               {loading ? 'CONNECTING...' : isLogin ? 'ENTER CASINO' : 'CREATE ACCOUNT'}
                            </span>
                            {!loading && <ArrowRight size={16} className="text-blue-200 group-hover:translate-x-1 transition-transform" />}
                         </div>
                         {/* Button Glow Effect */}
                         <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
                      </button>
                    </div>
                 </form>
               </>
             )}
          </div>
          
          {/* Footer Stats / Decor */}
          <div className="bg-black/40 border-t border-white/5 p-4 flex items-center justify-between text-[10px] text-gray-500 font-mono">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span>428 PLAYERS ONLINE</span>
             </div>
             <div>v2.4.0 PRO</div>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-gray-600 mt-6 font-medium tracking-wide uppercase">
          Secure • Provably Fair • Instant Withdrawals
        </p>
      </div>
    </div>
  );
};