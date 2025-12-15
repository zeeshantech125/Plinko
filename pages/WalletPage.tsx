import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowDownCircle, ArrowUpCircle, CreditCard, History, Copy, Smartphone, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { UserState, PaymentMethod, Transaction } from '../types';
import { supabase } from '../services/supabaseClient';

// --- Configuration ---
const ADMIN_ACCOUNTS = {
  EASYPAISA: { name: 'Admin EasyPaisa', number: '0345-1234567' },
  JAZZCASH: { name: 'Admin JazzCash', number: '0300-7654321' }
};

export const WalletPage: React.FC<{ balance: number; onDeposit: (amount: number | ((prev: number) => number)) => void; user: UserState | null }> = ({ balance, onDeposit, user }) => {
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW' | 'HISTORY'>('DEPOSIT');
  const [method, setMethod] = useState<PaymentMethod>('EASYPAISA');
  
  // Form State
  const [amount, setAmount] = useState<string>('');
  const [userAccount, setUserAccount] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // History State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Real-time Subscriptions & Initial Fetch
  useEffect(() => {
    if (!user?.id) return;

    // Initial Fetch
    fetchTransactions();

    // Realtime Subscription
    const channel = supabase
      .channel('wallet_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Refresh list on any change (new deposit, status update by admin)
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTransactions = async () => {
    // Silent fetch if not first time
    if (transactions.length === 0) setLoadingHistory(true);
    
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (data) setTransactions(data as Transaction[]);
    setLoadingHistory(false);
  };

  const resetForm = () => {
    setAmount('');
    setUserAccount('');
    setTrxId('');
    setMessage(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Visual feedback handled by user logic usually, but here we can just do a quick alert or toast if we had one.
    // We'll rely on the button visual state if needed, or just let it copy silently.
  };

  const handleSubmit = async () => {
    if (!user || !method) return;
    setMessage(null);
    
    const numAmount = parseInt(amount);
    
    if (isNaN(numAmount) || numAmount < 100) {
      setMessage({ type: 'error', text: 'Minimum amount is Rs 100' });
      return;
    }

    if (!userAccount || userAccount.length < 10) {
       setMessage({ type: 'error', text: 'Please enter a valid account number' });
       return;
    }

    if (activeTab === 'DEPOSIT' && !trxId) {
       setMessage({ type: 'error', text: 'Transaction ID is required for deposits' });
       return;
    }

    if (activeTab === 'WITHDRAW' && numAmount > balance) {
       setMessage({ type: 'error', text: 'Insufficient balance' });
       return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === 'WITHDRAW') {
        // 1. Deduct balance first
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: balance - numAmount })
          .eq('id', user.id);

        if (balanceError) throw balanceError;
        
        // Update local state
        onDeposit((prev) => prev - numAmount);
      }

      // 2. Create Transaction Record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: activeTab,
          amount: numAmount,
          method: method,
          status: 'PENDING',
          account_number: userAccount,
          transaction_id: activeTab === 'DEPOSIT' ? trxId : null,
        });

      if (txError) throw txError;

      setMessage({ 
        type: 'success', 
        text: activeTab === 'DEPOSIT' 
          ? 'Deposit request submitted! Admin will verify shortly.' 
          : 'Withdrawal requested successfully.' 
      });
      
      resetForm();

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Transaction failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-white pb-24 overflow-y-auto">
      
      {/* Header */}
      <div className="p-6 pb-2 bg-surface/50 sticky top-0 z-10 backdrop-blur-lg border-b border-white/5">
        <h1 className="text-2xl font-bold mb-4">Wallet</h1>
        
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden mb-6">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <CreditCard size={100} />
           </div>
           <span className="text-gray-400 text-sm font-bold tracking-wider">TOTAL BALANCE</span>
           <div className="text-4xl font-mono font-bold mt-2 text-white flex items-baseline gap-1">
             <span className="text-2xl text-primary">Rs</span>
             {balance.toFixed(2)}
           </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/40 p-1 rounded-xl">
           <button 
             onClick={() => { setActiveTab('DEPOSIT'); resetForm(); }}
             className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'DEPOSIT' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
           >
             <ArrowDownCircle size={16} /> Deposit
           </button>
           <button 
             onClick={() => { setActiveTab('WITHDRAW'); resetForm(); }}
             className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'WITHDRAW' ? 'bg-secondary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
           >
             <ArrowUpCircle size={16} /> Withdraw
           </button>
           <button 
             onClick={() => setActiveTab('HISTORY')}
             className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'HISTORY' ? 'bg-surface border border-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
           >
             <History size={16} /> History
           </button>
        </div>
      </div>

      <div className="p-6 pt-2">
        {activeTab !== 'HISTORY' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setMethod('EASYPAISA')}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'EASYPAISA' ? 'border-green-500 bg-green-500/10 shadow-neon-green' : 'border-white/5 bg-surface hover:bg-white/5'}`}
                >
                   <Smartphone className={method === 'EASYPAISA' ? 'text-green-500' : 'text-gray-500'} />
                   <span className="font-bold text-sm">EasyPaisa</span>
                   {method === 'EASYPAISA' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />}
                </button>
                <button 
                  onClick={() => setMethod('JAZZCASH')}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'JAZZCASH' ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/5 bg-surface hover:bg-white/5'}`}
                >
                   <Smartphone className={method === 'JAZZCASH' ? 'text-red-500' : 'text-gray-500'} />
                   <span className="font-bold text-sm">JazzCash</span>
                   {method === 'JAZZCASH' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />}
                </button>
              </div>
            </div>

            {/* Deposit Instructions */}
            {activeTab === 'DEPOSIT' && (
               <div className="bg-surface p-4 rounded-xl border border-white/10 relative overflow-hidden">
                 <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-gray-400">SEND MONEY TO</span>
                      <div className="font-bold text-lg text-primary">{ADMIN_ACCOUNTS[method].name}</div>
                    </div>
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Smartphone size={20} className="text-primary" />
                    </div>
                 </div>
                 <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between border border-white/5">
                    <span className="font-mono text-xl tracking-wider">{ADMIN_ACCOUNTS[method].number}</span>
                    <button 
                      onClick={() => handleCopy(ADMIN_ACCOUNTS[method].number)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                 </div>
                 <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                   1. Open your {method === 'EASYPAISA' ? 'EasyPaisa' : 'JazzCash'} App.<br/>
                   2. Send amount to the number above.<br/>
                   3. Copy the <strong className="text-white">Transaction ID (Trx ID)</strong> from the SMS.<br/>
                   4. Enter details below to confirm.
                 </p>
               </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Amount (PKR)</label>
                 <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white font-bold text-lg focus:border-primary focus:shadow-neon-blue outline-none transition-all placeholder:text-gray-600"
                   placeholder="e.g. 500"
                 />
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Your Account Number</label>
                 <input 
                   type="tel" 
                   value={userAccount}
                   onChange={(e) => setUserAccount(e.target.value)}
                   className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white font-mono focus:border-primary outline-none transition-all placeholder:text-gray-600"
                   placeholder="03XXXXXXXXX"
                 />
              </div>

              {activeTab === 'DEPOSIT' && (
                <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase ml-1">Transaction ID (Trx ID)</label>
                   <input 
                     type="text" 
                     value={trxId}
                     onChange={(e) => setTrxId(e.target.value)}
                     className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white font-mono focus:border-primary outline-none transition-all placeholder:text-gray-600"
                     placeholder="e.g. 18273645"
                   />
                </div>
              )}
            </div>

            {/* Message Alert */}
            {message && (
               <div className={`p-3 rounded-lg flex items-center gap-3 text-sm font-bold ${message.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-green-500/20 text-green-200 border border-green-500/30'}`}>
                  {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                  {message.text}
               </div>
            )}

            <Button 
              variant={activeTab === 'DEPOSIT' ? 'primary' : 'secondary'} 
              fullWidth 
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Processing...' 
                : activeTab === 'DEPOSIT' ? 'CONFIRM DEPOSIT' : 'REQUEST WITHDRAWAL'}
            </Button>
          </div>
        ) : (
          /* History View */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {loadingHistory && transactions.length === 0 ? (
               <div className="text-center text-gray-500 py-10">Loading history...</div>
             ) : transactions.length === 0 ? (
               <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                 <History size={48} className="opacity-20 mb-4" />
                 <p>No transactions found.</p>
               </div>
             ) : (
               transactions.map((tx) => (
                 <div key={tx.id} className="bg-surface rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                          {tx.type === 'DEPOSIT' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                       </div>
                       <div>
                          <div className="font-bold text-sm">{tx.type}</div>
                          <div className="text-xs text-gray-500 font-mono">{new Date(tx.created_at).toLocaleDateString()}</div>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="font-bold font-mono">Rs {tx.amount}</span>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 mt-1 
                         ${tx.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 
                           tx.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 
                           'bg-yellow-500/20 text-yellow-400'}`}>
                           {tx.status === 'PENDING' && <Clock size={10} />}
                           {tx.status === 'COMPLETED' && <CheckCircle size={10} />}
                           {tx.status === 'REJECTED' && <XCircle size={10} />}
                           {tx.status}
                       </span>
                    </div>
                 </div>
               ))
             )}
          </div>
        )}
      </div>
    </div>
  );
};