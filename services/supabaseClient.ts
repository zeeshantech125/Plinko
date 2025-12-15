import { createClient } from '@supabase/supabase-js';

// 1. Try LocalStorage (User entered via Setup Wizard)
const storedUrl = localStorage.getItem('supabase_url');
const storedKey = localStorage.getItem('supabase_key');

// 2. Try Environment Variables (Vercel/Build settings)
// Supporting Vite, Create React App, and Next.js naming conventions
const envUrl = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  process.env.REACT_APP_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const envKey = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  process.env.REACT_APP_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 3. Fallback (Placeholder to prevent crash, will trigger Setup Wizard)
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder';

const supabaseUrl = storedUrl || envUrl || FALLBACK_URL;
const supabaseKey = storedKey || envKey || FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isConfigured = () => {
  return (storedUrl && storedKey) || (envUrl && envKey);
};

export const clearConfig = () => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
  window.location.reload();
};