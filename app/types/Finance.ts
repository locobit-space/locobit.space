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
}

export interface UserSettings {
  default_currency: string;
  display_unit: "fiat" | "sats";
}

export interface Totals {
  income: number;
  expenses: number;
  balance: number;
  incomeSats: number;
  expensesSats: number;
  balanceSats: number;
}