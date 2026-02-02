export interface FinanceEntry {
  id: string;
  user_id: string;
  type: "income" | "expense";
  category: string;
  amount_fiat: number;
  amount_sats: number;
  fiat_currency: string;
  sats_per_fiat: number;
  unit_input: "fiat" | "sats";
  note: string;
  tags: string[];
  visibility: "public" | "private";
  created_at: string;
  attachments?: string[];
  location?: string;
  is_recurring?: boolean;
  recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  synced?: boolean;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  alert_threshold: number; // percentage (e.g., 80 means alert at 80%)
  created_at: string;
}

export interface UserSettings {
  default_currency: string;
  display_unit: "fiat" | "sats";
  budgets?: Budget[];
  categories?: string[];
  theme?: 'light' | 'dark' | 'auto';
  auto_sync?: boolean;
  show_balance_on_tab?: boolean;
}

export interface Totals {
  income: number;
  expenses: number;
  balance: number;
  incomeSats: number;
  expensesSats: number;
  balanceSats: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSync: string | null;
  pendingCount: number;
  hasError: boolean;
  errorMessage?: string;
}