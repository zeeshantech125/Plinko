import React, { useState } from 'react';
import { REQUIRED_SCHEMA_SQL } from '../constants';
import { Button } from './ui/Button';
import { Copy, RefreshCw, Check, Database, Terminal } from 'lucide-react';

interface SchemaInstallerProps {
  isOpen: boolean;
  onRetry: () => void;
}

export const SchemaInstaller: React.FC<SchemaInstallerProps> = ({ isOpen, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(REQUIRED_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    // Add artificial delay to show the user something happened
    await new Promise(resolve => setTimeout(resolve, 500));
    await onRetry();
    setIsRetrying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-slate-900 w-full max-w-2xl rounded-2xl border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <Database className="text-red-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Database Setup Required</h2>
              <p className="text-sm text-gray-400">Missing tables detected in Supabase</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-auto space-y-4">
          <div className="text-sm text-gray-300">
            <p className="mb-2">The application cannot find the required tables. Please run the following SQL in your Supabase SQL Editor:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400 ml-2">
              <li>Copy the code below.</li>
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Supabase Dashboard</a> {'>'} SQL Editor.</li>
              <li>Paste and Run the script.</li>
              <li>Click <strong>Refresh App</strong> below.</li>
            </ol>
          </div>

          {/* Code Block */}
          <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-md transition-colors"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? 'COPIED' : 'COPY SQL'}
              </button>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/5">
               <Terminal size={14} className="text-gray-500" />
               <span className="text-xs text-gray-500 font-mono">schema.sql</span>
            </div>
            
            <pre className="p-4 text-xs font-mono text-blue-300 overflow-x-auto whitespace-pre-wrap max-h-[300px] scrollbar-thin scrollbar-thumb-white/20">
              <code>{REQUIRED_SCHEMA_SQL}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-900/50 flex items-center justify-end gap-3">
          <Button 
            onClick={handleRetry} 
            variant="primary" 
            size="lg"
            className="w-full md:w-auto min-w-[140px]"
            disabled={isRetrying}
          >
            {isRetrying ? (
              <span className="animate-pulse">Checking...</span>
            ) : (
              <>
                <RefreshCw size={18} className={isRetrying ? 'animate-spin' : ''} />
                Refresh App
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};