export type TransactionType = 'sales' | 'expense';

export type SalesCategory = 'Cash In' | 'Cash Out' | 'Billing Payments' | 'Load';

export type ExpenseCategory = 'Load' | 'Food' | 'Online' | 'Family' | 'Others';

export type CategoryName = SalesCategory | ExpenseCategory | string;

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: CategoryName;
  amount: number;
  description: string;
  time: string; // e.g. "09:30 AM"
  createdAt: string; // ISO string
}

export interface CategorySummary {
  category: CategoryName;
  type: TransactionType;
  total: number;
  count: number;
  items: Transaction[];
}

export interface DailySummaryData {
  date: string;
  totalSales: number;
  totalExpenses: number;
  netCashFlow: number;
  salesBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  transactions: Transaction[];
}

export type DateFilterPreset = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom';

export interface DeepSearchFilter {
  datePreset: DateFilterPreset;
  startDate: string;
  endDate: string;
  selectedMonth: string; // YYYY-MM
  type: 'all' | 'sales' | 'expense';
  categories: CategoryName[];
  query: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface EWalletBankBalances {
  gcash: number;
  maya: number;
  palawanPay: number;
  goTyme: number;
  seaBank: number;
  savings: number;
  cashOnHand: number;
  customAccounts?: Record<string, number>;
}

export interface CashMonitoringState {
  beginningCashThisYear: number;
  accumulatedSalesOverride?: number | null;
  accumulatedExpensesOverride?: number | null;
  balances: EWalletBankBalances;
  notes?: string;
  lastUpdated?: string;
}

export type LoanType = 'loan_out' | 'loan_in'; // loan_out = Lent out (Receivable); loan_in = Borrowed (Payable)
export type LoanStatus = 'active' | 'partially_paid' | 'fully_paid';

export interface LoanPayment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface LoanRecord {
  id: string;
  type: LoanType;
  counterparty: string; // Borrower or Lender / Bank name
  originalAmount: number;
  remainingAmount: number;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  status: LoanStatus;
  description?: string;
  payments: LoanPayment[];
  createdAt: string;
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  version: string;
  itemCount: number;
  data: Transaction[];
}

export interface BackupFileStructure {
  app: string;
  version: string;
  exportDate: string;
  totalTransactions: number;
  transactions: Transaction[];
}

// --- Fish Harvest Monitor Types ---
export type FishSizeCode = 'OS (Oversized >500g)' | '2-1' | '5-2' | '3-1' | '4-1' | 'Daing / Rejects';

export interface RawBoxEntry {
  id: string;
  size: FishSizeCode | string;
  boxes: number;
  kgPerBox: number;
  looseKg: number;
  totalKg: number;
  timestamp: string;
  date: string; // YYYY-MM-DD
}

export interface BatchOutRecord {
  id: string;
  batchName: string;
  size: FishSizeCode | string;
  boxesOut: number;
  kgPerBox: number;
  totalKgOut: number;
  timestamp: string;
  date: string;
}

export interface SalesSlipRecord {
  id: string;
  sizeGroup: FishSizeCode | string;
  classification: string; // e.g. "Main broker / buyer bulk"
  totalBoxes: number;
  looseKg?: number;
  acknowledgedNetKg: number;
  pricePerKg: number;
  totalAmount: number;
  includeInTotalKg: boolean;
  timestamp: string;
  date: string;
}

export interface WalkInSaleRecord {
  id: string;
  size: FishSizeCode | string;
  kgSold: number;
  amount: number;
  includeInTotalKg: boolean;
  timestamp: string;
  date: string;
}

export interface HarvestDeductionRecord {
  id: string;
  category: 'Labor / Harvesters Fee' | 'Ice & Milling' | 'Trucking & Freight' | 'Cash Advance' | 'Food & Supplies' | 'Others';
  description: string;
  amount: number;
  date: string;
  timestamp: string;
}

export interface FishHarvestBackupFile {
  app: 'Fish Harvest Monitor';
  version: string;
  exportDate: string;
  rawBoxes: RawBoxEntry[];
  batchOuts: BatchOutRecord[];
  salesSlips: SalesSlipRecord[];
  walkInSales: WalkInSaleRecord[];
  deductions?: HarvestDeductionRecord[];
}

// --- Credit Lines Monitoring Types ---
export interface CreditAccount {
  id: string;
  name: string; // e.g., 'Atome', 'PayMaya', 'CIMB', 'GCash (GGives/GCredit)'
  category: 'Atome' | 'PayMaya' | 'CIMB' | 'GCash' | string;
  creditLimit: number;
  payableAmount: number; // Used credit / amount owed
  dueDate?: string; // e.g. YYYY-MM-DD or 'Every 15th'
  billingCycle?: string;
  notes?: string;
  color?: string;
  lastUpdated?: string;
}

export interface CreditMonitoringState {
  accounts: CreditAccount[];
  lastUpdated?: string;
}



