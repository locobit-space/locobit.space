// types/finance.ts
export type EntryType = 'income' | 'expense';
export type CurrencyUnit = 'fiat' | 'sats';
export type VisibilityType = 'private' | 'public';

export interface FinanceEntry {
  id: string;
  user_id: string;
  type: EntryType;
  amount_fiat: number;
  amount_sats: number;
  fiat_currency: string;
  sats_per_fiat: number;
  unit_input: CurrencyUnit;
  note: string;
  tags: string[];
  visibility: VisibilityType;
  created_at: string;
}

export interface UserSettings {
  default_currency: string;
  display_unit: CurrencyUnit;
}