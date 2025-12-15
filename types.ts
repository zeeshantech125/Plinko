export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum GameState {
  IDLE = 'IDLE',
  DROPPING = 'DROPPING',
  COMPLETED = 'COMPLETED',
}

export interface PlinkoSettings {
  rowCount: number; // 8 to 12
  risk: RiskLevel;
}

export interface BetState {
  amount: number;
  autoPlay: boolean;
  remainingAutoRounds: number;
}

export interface UserState {
  id: string;
  username: string;
  balance: number;
  isAuthenticated: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  bet: number;
  multiplier: number;
  payout: number;
  rows: number;
  risk: RiskLevel;
}

export interface MultiplierMap {
  [rowCount: number]: {
    [risk in RiskLevel]: number[];
  };
}

export type PageView = 'GAME' | 'WALLET' | 'HISTORY' | 'SETTINGS' | 'AUTH';

// --- Payment Types ---
export type TransactionType = 'DEPOSIT' | 'WITHDRAW';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';
export type PaymentMethod = 'EASYPAISA' | 'JAZZCASH';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  account_number: string;
  transaction_id?: string; // Proof for deposits
  created_at: string;
}