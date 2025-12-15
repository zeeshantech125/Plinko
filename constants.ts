import { MultiplierMap, RiskLevel } from './types';

export const MIN_BET = 10;
export const MAX_BET = 10000;
export const MIN_ROWS = 8;
export const MAX_ROWS = 12;

// Calculated symmetrical multipliers for a Plinko game
export const MULTIPLIERS: MultiplierMap = {
  8: {
    [RiskLevel.LOW]: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    [RiskLevel.MEDIUM]: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    [RiskLevel.HIGH]: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  9: {
    [RiskLevel.LOW]: [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
    [RiskLevel.MEDIUM]: [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
    [RiskLevel.HIGH]: [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43],
  },
  10: {
    [RiskLevel.LOW]: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    [RiskLevel.MEDIUM]: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    [RiskLevel.HIGH]: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
  },
  11: {
    [RiskLevel.LOW]: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
    [RiskLevel.MEDIUM]: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
    [RiskLevel.HIGH]: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120],
  },
  12: {
    [RiskLevel.LOW]: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    [RiskLevel.MEDIUM]: [33, 11, 4, 2, 1.1, 0.6, 0.4, 0.6, 1.1, 2, 4, 11, 33],
    [RiskLevel.HIGH]: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
};

export const COLORS = {
  peg: '#64748b', // Slate 500
  ball: '#ef4444', // Red 500
  text: '#ffffff',
  slotBase: '#334155', // Slate 700
  slotHover: '#475569', // Slate 600
};

export const REQUIRED_SCHEMA_SQL = `-- Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  balance double precision default 1000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Game History Table
create table if not exists public.game_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  bet double precision not null,
  multiplier double precision not null,
  payout double precision not null,
  rows integer not null,
  risk text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Transactions Table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text not null, -- 'DEPOSIT' or 'WITHDRAW'
  amount double precision not null,
  method text not null, -- 'EASYPAISA' or 'JAZZCASH'
  status text default 'PENDING' not null, -- 'PENDING', 'COMPLETED', 'REJECTED'
  account_number text not null,
  transaction_id text, -- Optional, mostly for deposits (Trx ID)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.game_history enable row level security;
alter table public.transactions enable row level security;

-- Drop existing policies to prevent 42710 errors on re-run
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Users can read own history" on game_history;
drop policy if exists "Users can insert own history" on game_history;
drop policy if exists "Users can read own transactions" on transactions;
drop policy if exists "Users can insert own transactions" on transactions;

-- Profiles Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Game History Policies
create policy "Users can read own history"
  on game_history for select
  using ( auth.uid() = user_id );

create policy "Users can insert own history"
  on game_history for insert
  with check ( auth.uid() = user_id );

-- Transaction Policies
create policy "Users can read own transactions"
  on transactions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own transactions"
  on transactions for insert
  with check ( auth.uid() = user_id );

-- Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table transactions;
`;