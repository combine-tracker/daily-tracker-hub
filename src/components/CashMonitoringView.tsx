import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart as PieChartIcon,
  Wallet, 
  Building2, 
  Smartphone, 
  Landmark, 
  DollarSign, 
  CreditCard, 
  PlusCircle, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  HelpCircle, 
  Edit3, 
  Save, 
  Sparkles, 
  Trash2, 
  CalendarCheck,
  PiggyBank,
  RefreshCw,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, CashMonitoringState, EWalletBankBalances, LoanRecord } from '../types';
import { formatCurrency, saveCashMonitoringState, loadCashMonitoringState } from '../utils/storage';

interface CashMonitoringViewProps {
  transactions: Transaction[];
  loans?: LoanRecord[];
  onNavigateToLoans?: () => void;
  onShowToast: (msg: string) => void;
}

export const CashMonitoringView: React.FC<CashMonitoringViewProps> = ({
  transactions,
  loans = [],
  onNavigateToLoans,
  onShowToast,
}) => {
  // Load initial state from storage
  const [cashState, setCashState] = useState<CashMonitoringState>(() => loadCashMonitoringState());

  // Current year string e.g. "2026"
  const currentYear = useMemo(() => new Date().getFullYear().toString(), []);

  // Compute Auto-Calculated Sales for current year (Jan 1 to present)
  const autoAccumulatedSales = useMemo(() => {
    return transactions
      .filter(t => t.type === 'sales' && t.date.startsWith(currentYear))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentYear]);

  // Compute Auto-Calculated Expenses for current year (Jan 1 to present)
  const autoAccumulatedExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentYear))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentYear]);

  // Determine effective values (Override vs Auto)
  const effectiveSales = cashState.accumulatedSalesOverride !== null && cashState.accumulatedSalesOverride !== undefined
    ? cashState.accumulatedSalesOverride
    : autoAccumulatedSales;

  const effectiveExpenses = cashState.accumulatedExpensesOverride !== null && cashState.accumulatedExpensesOverride !== undefined
    ? cashState.accumulatedExpensesOverride
    : autoAccumulatedExpenses;

  // Expected Book Cash Balance = Beginning Cash + Sales - Expenses
  const expectedBookBalance = useMemo(() => {
    return (cashState.beginningCashThisYear || 0) + effectiveSales - effectiveExpenses;
  }, [cashState.beginningCashThisYear, effectiveSales, effectiveExpenses]);

  // Custom accounts sum
  const customAccountsTotal = useMemo(() => {
    if (!cashState.balances.customAccounts) return 0;
    return Object.values(cashState.balances.customAccounts).reduce((sum: number, val: number) => sum + (val || 0), 0);
  }, [cashState.balances.customAccounts]);

  // Total Actual Remaining Cash across all accounts
  const actualRemainingCash = useMemo(() => {
    const b = cashState.balances;
    return (
      (b.gcash || 0) +
      (b.maya || 0) +
      (b.palawanPay || 0) +
      (b.goTyme || 0) +
      (b.seaBank || 0) +
      (b.savings || 0) +
      (b.cashOnHand || 0) +
      customAccountsTotal
    );
  }, [cashState.balances, customAccountsTotal]);

  // Discrepancy = Actual - Expected
  const difference = actualRemainingCash - expectedBookBalance;

  // Active Loan Totals for Reconciliation context
  const activeLoansOutTotal = useMemo(() => {
    return loans
      .filter(l => l.type === 'loan_out' && l.status !== 'fully_paid')
      .reduce((sum, l) => sum + l.remainingAmount, 0);
  }, [loans]);

  const activeLoansInTotal = useMemo(() => {
    return loans
      .filter(l => l.type === 'loan_in' && l.status !== 'fully_paid')
      .reduce((sum, l) => sum + l.remainingAmount, 0);
  }, [loans]);

  // Breakdown distribution between Physical Cash, E-Wallets, Banks & Custom
  const breakdownData = useMemo(() => {
    const b = cashState.balances;
    const physical = b.cashOnHand || 0;
    const eWallets = (b.gcash || 0) + (b.maya || 0) + (b.palawanPay || 0);
    const banks = (b.goTyme || 0) + (b.seaBank || 0) + (b.savings || 0);
    const custom = customAccountsTotal;

    const total = physical + eWallets + banks + custom;

    const items = [
      {
        name: 'Physical Cash',
        value: physical,
        color: '#10B981', // Emerald
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800/60',
        icon: CreditCard,
        subtext: 'Cash drawer & physical vault',
      },
      {
        name: 'E-Wallets',
        value: eWallets,
        color: '#3B82F6', // Blue
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-800/60',
        icon: Smartphone,
        subtext: 'GCash, Maya, Palawan Pay',
      },
      {
        name: 'Bank Accounts',
        value: banks,
        color: '#8B5CF6', // Purple
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
        textColor: 'text-purple-600 dark:text-purple-400',
        borderColor: 'border-purple-200 dark:border-purple-800/60',
        icon: Landmark,
        subtext: 'GoTyme, SeaBank, Bank Savings',
      },
    ];

    if (custom > 0) {
      items.push({
        name: 'Custom Accounts',
        value: custom,
        color: '#F59E0B', // Amber
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
        textColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800/60',
        icon: Wallet,
        subtext: 'User-defined custom accounts',
      });
    }

    return {
      total,
      items: items.map(item => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0,
      })),
    };
  }, [cashState.balances, customAccountsTotal]);

  // State for new custom account modal/input
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');

  // Section collapse state
  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);

  // Auto-save changes to localStorage whenever cashState updates
  const handleUpdateField = (updater: (prev: CashMonitoringState) => CashMonitoringState) => {
    setCashState(prev => {
      const next = updater(prev);
      saveCashMonitoringState(next);
      return next;
    });
  };

  const handleBalanceChange = (field: keyof EWalletBankBalances, value: number) => {
    handleUpdateField(prev => ({
      ...prev,
      balances: {
        ...prev.balances,
        [field]: value < 0 ? 0 : value,
      },
    }));
  };

  const handleCustomAccountChange = (name: string, value: number) => {
    handleUpdateField(prev => ({
      ...prev,
      balances: {
        ...prev.balances,
        customAccounts: {
          ...(prev.balances.customAccounts || {}),
          [name]: value < 0 ? 0 : value,
        },
      },
    }));
  };

  const handleDeleteCustomAccount = (name: string) => {
    handleUpdateField(prev => {
      const copy = { ...(prev.balances.customAccounts || {}) };
      delete copy[name];
      return {
        ...prev,
        balances: {
          ...prev.balances,
          customAccounts: copy,
        },
      };
    });
    onShowToast(`Removed ${name} account.`);
  };

  const handleAddCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const name = customName.trim();
    const amt = typeof customAmount === 'number' ? customAmount : 0;

    handleCustomAccountChange(name, amt);
    setCustomName('');
    setCustomAmount('');
    setShowAddCustom(false);
    onShowToast(`Added custom account "${name}"`);
  };

  const handleResetOverridesToAuto = () => {
    handleUpdateField(prev => ({
      ...prev,
      accumulatedSalesOverride: null,
      accumulatedExpensesOverride: null,
    }));
    onShowToast('Resynced accumulated sales & expenses to logged transactions.');
  };

  // Preset predefined accounts list
  const accountCards: {
    key: keyof EWalletBankBalances;
    label: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
  }[] = [
    {
      key: 'gcash',
      label: 'GCash',
      icon: <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    },
    {
      key: 'maya',
      label: 'Maya',
      icon: <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    },
    {
      key: 'palawanPay',
      label: 'Palawan Pay',
      icon: <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    },
    {
      key: 'goTyme',
      label: 'GoTyme Bank',
      icon: <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      colorClass: 'text-cyan-600 dark:text-cyan-400',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    },
    {
      key: 'seaBank',
      label: 'SeaBank',
      icon: <PiggyBank className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      colorClass: 'text-orange-600 dark:text-orange-400',
      bgClass: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    },
    {
      key: 'savings',
      label: 'Savings / Bank',
      icon: <Landmark className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      colorClass: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    },
    {
      key: 'cashOnHand',
      label: 'Cash on Hand',
      icon: <CreditCard className="w-5 h-5 text-slate-700 dark:text-slate-300" />,
      colorClass: 'text-slate-700 dark:text-slate-300',
      bgClass: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 font-sans">

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5">
              Cash Monitoring & Reconciliation
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                {currentYear}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
          <button
            onClick={handleResetOverridesToAuto}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            title="Resync Sales & Expenses from logged transactions"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Recalculate Log</span>
          </button>
        </div>
      </div>

      {/* Equal-Sized Summary Cards Container: Book Balance & Reconciliation Summary + Actual Cash Distribution Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch">

        {/* CARD 1: BOOK BALANCE & RECONCILIATION SUMMARY */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Book Balance & Reconciliation Summary
                </h3>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider shrink-0">
              Summary
            </span>
          </div>

          {/* LIST TYPE CONTAINER FOR CARD 1 */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-1 flex flex-col justify-between">
            
            {/* Item 1: Expected Book Balance */}
            <div className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors flex-1">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    Expected Book Balance
                  </span>
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Calculated
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {formatCurrency(expectedBookBalance)}
              </div>
            </div>

            {/* Item 2: Actual Remaining Cash */}
            <div className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors flex-1">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    Actual Remaining Cash
                  </span>
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Imputed
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 font-bold text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                {formatCurrency(actualRemainingCash)}
              </div>
            </div>

            {/* Item 3: Settlement Difference */}
            <div className={`p-3 sm:p-4 flex items-center justify-between gap-3 transition-colors flex-1 ${
              difference === 0
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                : difference > 0
                ? 'bg-blue-50/40 dark:bg-blue-950/20'
                : 'bg-rose-50/40 dark:bg-rose-950/20'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${
                  difference === 0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : difference > 0
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                }`}>
                  <Scale className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    Settlement Difference
                  </span>
                  {difference === 0 ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-1 uppercase shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Match
                    </span>
                  ) : difference > 0 ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold flex items-center gap-1 uppercase shrink-0">
                      <TrendingUp className="w-2.5 h-2.5" /> Surplus
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-1 uppercase shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5" /> Shortage
                    </span>
                  )}
                </div>
              </div>
              <div className={`text-right shrink-0 font-bold text-base sm:text-lg ${
                difference === 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : difference > 0
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-rose-700 dark:text-rose-300'
              }`}>
                {difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)}
              </div>
            </div>

          </div>
        </div>

        {/* CARD 2: ACTUAL CASH DISTRIBUTION RATIO (LIST TYPE) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Actual Cash Distribution Ratio
                </h3>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Actual</span>
              <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(breakdownData.total)}
              </span>
            </div>
          </div>

          {/* LIST TYPE CONTAINER FOR CARD 2 */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-1 flex flex-col justify-between">
            {breakdownData.items.map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.name} className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors flex-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${item.bgColor} ${item.textColor}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${item.badgeBg}`}>
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-24 sm:w-36 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(item.percentage, 100)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CARD 3: EDITABLE BOOK LEDGER INPUTS & BASELINE (LIST TYPE) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
        <div 
          onClick={() => setIsSection1Open(!isSection1Open)}
          className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Edit3 className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-1.5">
                Book Ledger ({currentYear})
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isSection1Open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isSection1Open && (
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            
            {/* 1. Beginning Cash Input Row */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Beginning Cash ({currentYear})
                </label>
              </div>
              <div className="relative w-full sm:w-56 shrink-0">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs sm:text-sm">₱</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cashState.beginningCashThisYear || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleUpdateField(prev => ({ ...prev, beginningCashThisYear: val }));
                  }}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm font-sans focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="50000"
                />
              </div>
            </div>

            {/* 2. Accumulated Sales Input/Auto Row */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Accumulated Sales (Jan-Now)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (cashState.accumulatedSalesOverride !== null) {
                        handleUpdateField(prev => ({ ...prev, accumulatedSalesOverride: null }));
                      } else {
                        handleUpdateField(prev => ({ ...prev, accumulatedSalesOverride: autoAccumulatedSales }));
                      }
                    }}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    {cashState.accumulatedSalesOverride !== null ? 'Reset Auto' : 'Manual Edit'}
                  </button>
                </div>
              </div>
              <div className="relative w-full sm:w-56 shrink-0">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs sm:text-sm">₱</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={effectiveSales}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleUpdateField(prev => ({ ...prev, accumulatedSalesOverride: val }));
                  }}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm font-sans focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Accumulated Expenses Input/Auto Row */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Accumulated Expenses (Jan-Now)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (cashState.accumulatedExpensesOverride !== null) {
                        handleUpdateField(prev => ({ ...prev, accumulatedExpensesOverride: null }));
                      } else {
                        handleUpdateField(prev => ({ ...prev, accumulatedExpensesOverride: autoAccumulatedExpenses }));
                      }
                    }}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    {cashState.accumulatedExpensesOverride !== null ? 'Reset Auto' : 'Manual Edit'}
                  </button>
                </div>
              </div>
              <div className="relative w-full sm:w-56 shrink-0">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs sm:text-sm">₱</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={effectiveExpenses}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleUpdateField(prev => ({ ...prev, accumulatedExpensesOverride: val }));
                  }}
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm font-sans focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* CARD 4: EDITABLE MONEY FROM E-WALLETS & BANKS (LIST TYPE) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div 
            onClick={() => setIsSection2Open(!isSection2Open)}
            className="flex items-center gap-2.5 cursor-pointer select-none group flex-1 min-w-0"
          >
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Wallet className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                Money from E-Wallets & Banks
              </h3>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
            >
              {isSection2Open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isSection2Open) setIsSection2Open(true);
              setShowAddCustom(!showAddCustom);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold text-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Account</span>
          </button>
        </div>

        {isSection2Open && (
          <>
            {/* Add Custom Account Inline Form */}
            {showAddCustom && (
              <form onSubmit={handleAddCustomAccountSubmit} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2 mb-3">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                  Add Bank / Wallet Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Account Name</label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. UnionBank, GrabPay, Tonik"
                      className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-sans font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Current Balance (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(parseFloat(e.target.value) || '')}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-sans font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            )}

            {/* LIST TYPE CONTAINER FOR CARD 4 */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              {accountCards.map(acc => {
                const currentVal = cashState.balances[acc.key] || 0;

                return (
                  <div
                    key={acc.key}
                    className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs shrink-0">
                        {acc.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {acc.label}
                        </h4>
                      </div>
                    </div>

                    <div className="relative w-full sm:w-56 shrink-0">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs sm:text-sm">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={currentVal || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleBalanceChange(acc.key, val);
                        }}
                        className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm font-sans text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Custom Accounts List Rows */}
              {cashState.balances.customAccounts && Object.entries(cashState.balances.customAccounts).map(([name, amt]) => (
                <div
                  key={name}
                  className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors bg-indigo-50/30 dark:bg-indigo-950/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs shrink-0">
                      <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {name}
                        </h4>
                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">
                          Custom
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-56 shrink-0">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs sm:text-sm">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={amt || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleCustomAccountChange(name, val);
                        }}
                        className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm font-sans text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomAccount(name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors shrink-0"
                      title="Remove account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* NOTES & RECONCILIATION AUDIT LOG */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Reconciliation Notes & Remarks
        </label>
        <textarea
          rows={2}
          value={cashState.notes || ''}
          onChange={(e) => {
            const val = e.target.value;
            handleUpdateField(prev => ({ ...prev, notes: val }));
          }}
          placeholder=""
          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-sans font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        {cashState.lastUpdated && (
          <p className="text-[9px] text-slate-400 text-right font-sans">
            Last saved: {new Date(cashState.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

    </div>
  );
};
