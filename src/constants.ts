import { SalesCategory, ExpenseCategory, Transaction, LoanRecord } from './types';

export const DEFAULT_SALES_CATEGORIES: { name: SalesCategory; description: string; icon: string; color: string; bgColor: string }[] = [
  { name: 'Cash In', description: 'Gcash, Maya, Bank cash-in inflows', icon: 'ArrowDownLeft', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { name: 'Cash Out', description: 'Gcash, Maya, Bank cash-out remittances', icon: 'ArrowUpRight', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { name: 'Billing Payments', description: 'Utility, internet, credit bill collection', icon: 'Receipt', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  { name: 'Load', description: 'Globe, Smart, DITO e-load sales', icon: 'Smartphone', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
];

export const DEFAULT_EXPENSE_CATEGORIES: { name: ExpenseCategory; description: string; icon: string; color: string; bgColor: string }[] = [
  { name: 'Load', description: 'E-load dealer wallet replenishment', icon: 'Zap', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
  { name: 'Food', description: 'Meals, groceries, snacks & drinks', icon: 'Utensils', color: 'text-rose-700 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  { name: 'Online', description: 'Online shopping, digital subs, fees', icon: 'ShoppingBag', color: 'text-cyan-700 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800' },
  { name: 'Family', description: 'House allowance, family gifts & needs', icon: 'Home', color: 'text-indigo-700 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
  { name: 'Others', description: 'Miscellaneous, travel & sundries', icon: 'MoreHorizontal', color: 'text-slate-700 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800' },
];

export const STORAGE_KEY_TRANSACTIONS = 'daily_tracker_transactions_v1';
export const STORAGE_KEY_SNAPSHOTS = 'daily_tracker_snapshots_v1';
export const STORAGE_KEY_LAST_AUTOSAVE = 'daily_tracker_last_autosave_v1';
export const STORAGE_KEY_CASH_MONITORING = 'daily_tracker_cash_monitoring_v1';
export const STORAGE_KEY_LOANS = 'daily_tracker_loans_v1';
export const STORAGE_KEY_CREDITS = 'daily_tracker_credits_v1';
export const STORAGE_KEY_SUBSCRIPTIONS = 'daily_tracker_subscriptions_v1';

export const INITIAL_DEFAULT_CREDIT_ACCOUNTS = [
  {
    id: 'atome',
    name: 'Atome Credit',
    category: 'Atome',
    creditLimit: 25000,
    payableAmount: 0,
    dueDate: '',
    billingCycle: 'Monthly',
    notes: 'Buy Now Pay Later / Installments',
    color: 'emerald',
  },
  {
    id: 'paymaya',
    name: 'PayMaya / Maya Credit',
    category: 'PayMaya',
    creditLimit: 30000,
    payableAmount: 0,
    dueDate: '',
    billingCycle: 'Monthly',
    notes: 'Maya Credit & Personal Loan Line',
    color: 'blue',
  },
  {
    id: 'cimb',
    name: 'CIMB Bank Credit / Revolve',
    category: 'CIMB',
    creditLimit: 50000,
    payableAmount: 0,
    dueDate: '',
    billingCycle: 'Monthly',
    notes: 'CIMB Personal Credit Line / Revolve',
    color: 'rose',
  },
  {
    id: 'gcash',
    name: 'GCash (GGives / GCredit)',
    category: 'GCash',
    creditLimit: 35000,
    payableAmount: 0,
    dueDate: '',
    billingCycle: 'Monthly',
    notes: 'GCredit & GGives Buy Now Pay Later',
    color: 'cyan',
  },
];


export const INITIAL_SAMPLE_LOANS: LoanRecord[] = [];

export const INITIAL_CASH_MONITORING_STATE = {
  beginningCashThisYear: 0,
  accumulatedSalesOverride: null,
  accumulatedExpensesOverride: null,
  balances: {
    gcash: 0,
    maya: 0,
    palawanPay: 0,
    goTyme: 0,
    seaBank: 0,
    savings: 0,
    cashOnHand: 0,
  },
  notes: '',
  lastUpdated: new Date().toISOString(),
};

// Start with empty dataset so user encodes everything from scratch
export const INITIAL_SAMPLE_TRANSACTIONS: Transaction[] = [];
export const INITIAL_SAMPLE_SUBSCRIPTIONS: any[] = [];
