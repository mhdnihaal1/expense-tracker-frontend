export type TxType = 'expense' | 'income' | 'transfer';
export type AccountType = 'cash' | 'bank' | 'card' | 'wallet' | 'savings';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ThemePref = 'system' | 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  theme: ThemePref;
}

export interface Account {
  _id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  openingBalance: number;
  archived: boolean;
  balance: number;
}

export interface Category {
  _id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isDefault: boolean;
}

type Ref<T> = Pick<T, Extract<keyof T, '_id' | 'name' | 'icon' | 'color' | 'type'>>;

export interface Transaction {
  _id: string;
  type: TxType;
  amount: number;
  accountId: Ref<Account>;
  toAccountId: Ref<Account> | null;
  categoryId: Ref<Category> | null;
  date: string;
  note: string;
  tags: string[];
  recurringId: string | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  total: number;
  hasMore: boolean;
}

export interface BudgetStatus {
  _id: string;
  category: Ref<Category> | null;
  amount: number;
  alertThreshold: number;
  spent: number;
  remaining: number;
  percent: number;
  status: 'ok' | 'warning' | 'over';
}

export interface Goal {
  _id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  icon: string;
  color: string;
  contributions: { _id: string; amount: number; date: string; note?: string }[];
  createdAt: string;
}

export interface Recurring {
  _id: string;
  type: TxType;
  amount: number;
  accountId: Ref<Account>;
  toAccountId: Ref<Account> | null;
  categoryId: Ref<Category> | null;
  note: string;
  frequency: Frequency;
  startDate: string;
  nextRunDate: string;
  endDate: string | null;
  active: boolean;
}

export interface Summary {
  month: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
  totalBalance: number;
  dailyAverage: number;
  savingsRate: number | null;
  previous: { income: number; expense: number };
  change: { income: number | null; expense: number | null };
}

export interface CategoryStat {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percent: number;
}
