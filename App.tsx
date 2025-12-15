import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { AuthPage } from './pages/AuthPage';
import { GamePage } from './pages/GamePage';
import { WalletPage } from './pages/WalletPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Navigation } from './components/Navigation';
import { SchemaInstaller } from './components/SchemaInstaller';
import { PageView, UserState } from './types';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserState | null>(null);
  const [currentPage, setCurrentPage] = useState<PageView>('GAME');
  const [balance, setBalance] = useState(0); 
  const [missingSchema, setMissingSchema] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    // Check active session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // If we just logged in, we might need to fetch the profile
        if (!user || user.id !== session.user.id) {
            fetchProfile(session.user.id);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch User Profile (Balance)
  const fetchProfile = async (userId: string) => {
    try {
      setMissingSchema(false);
      
      // Check for Transactions table existence first (lightweight check)
      const { error: txError } = await supabase.from('transactions').select('id').limit(1);
      if (txError && (txError.code === 'PGRST205' || txError.message?.includes('does not exist') || txError.code === '42P01')) {
          setMissingSchema(true);
          setLoading(false);
          return;
      }

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // SELF-HEALING: If profile is missing (trigger failed), create it manually now
      if (!data) {
          // If the error indicates table missing, don't try to insert, just show schema installer
          if (error && (error.code === 'PGRST205' || error.message?.includes('does not exist') || error.code === '42P01')) {
             setMissingSchema(true);
             setLoading(false);
             return;
          }

          console.log("Profile missing, creating fallback...");
          const { data: { user } } = await supabase.auth.getUser();
          const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player';
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, username, balance: 1000 }])
            .select()
            .single();
            
          if (newProfile) {
            data = newProfile;
          } else if (createError) {
            console.error("Failed to create fallback profile:", JSON.stringify(createError));
            
            // Check for missing table error (PGRST205)
            if (createError.code === 'PGRST205' || createError.message?.includes('does not exist') || createError.code === '42P01') {
                setMissingSchema(true);
            } else if (createError.code === '42501') {
                 // Permissions error often implies schema/policies haven't been run correctly
                 setMissingSchema(true); 
            }
            
            setLoading(false);
            return;
          }
      }

      if (data) {
        setUser({
          id: data.id,
          username: data.username,
          balance: data.balance,
          isAuthenticated: true,
        });
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Init Audio
  useEffect(() => {
    const initAudio = () => {
      audioService.playClick(); 
      window.removeEventListener('click', initAudio);
    };
    window.addEventListener('click', initAudio);
    return () => window.removeEventListener('click', initAudio);
  }, []);

  // Update Balance Logic (Optimistic + DB)
  const updateBalance = async (newAmount: number | ((prev: number) => number)) => {
    let finalAmount = typeof newAmount === 'function' ? newAmount(balance) : newAmount;
    
    // Optimistic Update
    setBalance(finalAmount);

    // Sync with DB
    if (user?.id) {
       await supabase
         .from('profiles')
         .update({ balance: finalAmount })
         .eq('id', user.id);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'GAME':
        return <GamePage balance={balance} setBalance={updateBalance} user={user} />;
      case 'WALLET':
        return <WalletPage balance={balance} onDeposit={updateBalance} user={user} />;
      case 'HISTORY':
        return <HistoryPage user={user} />;
      case 'SETTINGS':
        return <SettingsPage user={user} />;
      default:
        return <GamePage balance={balance} setBalance={updateBalance} user={user} />;
    }
  };

  // Schema Recovery Modal
  if (missingSchema) {
    return (
       <div className="min-h-screen bg-background relative">
          <SchemaInstaller 
            isOpen={true} 
            onRetry={() => session?.user?.id && fetchProfile(session.user.id)} 
          />
          {/* Render background vaguely so it looks like the app is there but blocked */}
          <div className="opacity-10 pointer-events-none filter blur-sm">
             <GamePage balance={0} setBalance={() => {}} user={null} />
          </div>
       </div>
    );
  }

  if (loading) {
     return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-bold animate-pulse">Loading NeonPlinko...</div>;
  }

  if (!session || !user) {
    return <AuthPage />;
  }

  return (
    <div className="w-full h-full text-white font-sans antialiased overflow-hidden selection:bg-primary/30">
      {renderPage()}
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
};

export default App;