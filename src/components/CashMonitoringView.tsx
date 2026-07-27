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
    sublabel: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
  }[] = [
    {
      key: 'gcash',
      label: 'GCash',
      sublabel: 'E-Wallet & Cash In/Out',
      icon: <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    },
    {
      key: 'maya',
      label: 'Maya',
      sublabel: 'Wallet & Savings Account',
      icon: <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    },
    {
      key: 'palawanPay',
      label: 'Palawan Pay',
      sublabel: 'Remittance & Wallet',
      icon: <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    },
    {
      key: 'goTyme',
      label: 'GoTyme Bank',
      sublabel: 'Digital Bank & Rewards',
      icon: <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      colorClass: 'text-cyan-600 dark:text-cyan-400',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    },
    {
      key: 'seaBank',
      label: 'SeaBank',
      sublabel: 'Shopee High Yield Savings',
      icon: <PiggyBank className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      colorClass: 'text-orange-600 dark:text-orange-400',
      bgClass: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    },
    {
      key: 'savings',
      label: 'Savings / Bank',
      sublabel: 'Traditional Bank Savings (BPI/BDO/Metrobank)',
      icon: <Landmark className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      colorClass: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    },
    {
      key: 'cashOnHand',
      label: 'Cash on Hand',
      sublabel: 'Physical Cash Drawer & Vault',
      icon: <CreditCard className="w-5 h-5 text-slate-700 dark:text-slate-300" />,
      colorClass: 'text-slate-700 dark:text-slate-300',
      bgClass: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
              Cash Monitoring & Reconciliation
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                Year {currentYear}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compare your expected book balance against physical cash & e-wallet balances in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800 w-full md:w-auto justify-end">
          <button
            onClick={handleResetOverridesToAuto}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
            title="Resync Sales & Expenses from logged transactions"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate from Log</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Card 1: Expected Book Cash Balance */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
              Expected Book Balance
            </span>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded font-medium">
              Calculated
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">
            {formatCurrency(expectedBookBalance)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span>Beginning Cash ({currentYear}):</span>
              <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(cashState.beginningCashThisYear)}</strong>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>+ Accumulated Sales:</span>
              <strong>+{formatCurrency(effectiveSales)}</strong>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>- Accumulated Expenses:</span>
              <strong>-{formatCurrency(effectiveExpenses)}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Actual Remaining Cash (Sum of Wallets & Banks) */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              Actual Remaining Cash
            </span>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
              Imputed Accounts
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatCurrency(actualRemainingCash)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Sum of all e-wallets, bank balances, and physical cash on hand entered below.
          </p>
        </div>

        {/* Card 3: Settlement Difference / Discrepancy */}
        <div className={`p-3.5 sm:p-5 rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3 ${
          difference === 0
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
            : difference > 0
            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
            : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Scale className="w-4 h-4" />
              Settlement Difference
            </span>
            {difference === 0 ? (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Reconciled
              </span>
            ) : difference > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Cash Surplus
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Discrepancy
              </span>
            )}
          </div>

          <div className={`text-2xl sm:text-3xl font-black ${
            difference === 0
              ? 'text-emerald-700 dark:text-emerald-300'
              : difference > 0
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-rose-700 dark:text-rose-300'
          }`}>
            {difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)}
          </div>

          <p className="text-[11px] font-medium leading-relaxed">
            {difference === 0 && (
              <span className="text-emerald-800 dark:text-emerald-200">
                ✅ <strong>Perfect Match:</strong> Physical cash & bank balances exactly match your book calculations.
              </span>
            )}
            {difference > 0 && (
              <span className="text-blue-800 dark:text-blue-200">
                📈 <strong>Cash Overage:</strong> You have {formatCurrency(difference)} more in actual accounts than book records show.
              </span>
            )}
            {difference < 0 && (
              <span className="text-rose-800 dark:text-rose-200">
                ⚠️ <strong>Shortage Alert:</strong> You are missing {formatCurrency(Math.abs(difference))} in physical accounts compared to your expected book balance.
              </span>
            )}
          </p>
        </div>

      </div>

      {/* CASH DISTRIBUTION PIE CHART CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Actual Cash Distribution Ratio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual breakdown between Physical Cash, E-Wallets, and Bank Balances
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Actual Cash</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(breakdownData.total)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Pie Chart Display */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center min-h-[220px]">
            {breakdownData.total > 0 ? (
              <div className="w-full h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdownData.items}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {breakdownData.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Balance']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cash</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white px-2">
                    {formatCurrency(breakdownData.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <PieChartIcon className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold">No Cash Balances Recorded Yet</p>
                <p className="text-[11px]">Enter your physical cash or e-wallet amounts below to generate the chart.</p>
              </div>
            )}
          </div>

          {/* Breakdown List Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {breakdownData.items.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.name}
                  className={`p-3.5 rounded-xl border ${item.bgColor} ${item.borderColor} space-y-2 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-xs">
                        <IconComp className={`w-4 h-4 ${item.textColor}`} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${item.badgeBg}`}>
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className={`text-base font-black ${item.textColor}`}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {item.subtext}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* EDITABLE SECTION 1: YEARLY BASELINE & ACCUMULATED LOGS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div 
          onClick={() => setIsSection1Open(!isSection1Open)}
          className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-500" />
              1. Book Ledger Inputs & Baseline ({currentYear})
            </h3>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">(Editable inputs for book calculations)</span>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isSection1Open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isSection1Open && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Beginning Cash Input */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Beginning Cash ({currentYear})
              </label>
              <p className="text-[11px] text-slate-400">Starting cash balance on Jan 1, {currentYear}</p>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">₱</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cashState.beginningCashThisYear || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleUpdateField(prev => ({ ...prev, beginningCashThisYear: val }));
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Accumulated Sales Input/Auto */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Accumulated Sales (Jan - Now)
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
                  {cashState.accumulatedSalesOverride !== null ? 'Reset to Auto' : 'Manual Edit'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {cashState.accumulatedSalesOverride !== null ? '⚠️ Manual Override Mode' : `Auto-sum of logged sales in ${currentYear}`}
              </p>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">₱</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={effectiveSales}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleUpdateField(prev => ({ ...prev, accumulatedSalesOverride: val }));
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Accumulated Expenses Input/Auto */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Accumulated Expenses (Jan - Now)
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
                  {cashState.accumulatedExpensesOverride !== null ? 'Reset to Auto' : 'Manual Edit'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {cashState.accumulatedExpensesOverride !== null ? '⚠️ Manual Override Mode' : `Auto-sum of logged expenses in ${currentYear}`}
              </p>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">₱</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={effectiveExpenses}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleUpdateField(prev => ({ ...prev, accumulatedExpensesOverride: val }));
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-bold text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* EDITABLE SECTION 2: E-WALLETS, BANKS & CASH ON HAND BALANCES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div 
            onClick={() => setIsSection2Open(!isSection2Open)}
            className="flex items-center justify-between sm:justify-start gap-3 cursor-pointer select-none group flex-1"
          >
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                2. Money from E-Wallets & Banks (Imputed Balances)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter your live balances for each wallet or bank account below.
              </p>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Custom Account</span>
          </button>
        </div>

        {isSection2Open && (
          <>
            {/* Add Custom Account Inline Modal/Form */}
            {showAddCustom && (
              <form onSubmit={handleAddCustomAccountSubmit} className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                  Add Additional Bank / Wallet Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. UnionBank, GrabPay, Tonik"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Balance (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(parseFloat(e.target.value) || '')}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            )}

            {/* Standard E-Wallets & Banks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {accountCards.map(acc => {
                const currentVal = cashState.balances[acc.key] || 0;

                return (
                  <div
                    key={acc.key}
                    className={`p-4 rounded-xl border transition-all ${acc.bgClass} flex flex-col justify-between gap-3`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
                          {acc.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {acc.label}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {acc.sublabel}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Balance
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={currentVal || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleBalanceChange(acc.key, val);
                          }}
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Custom Accounts Cards */}
              {cashState.balances.customAccounts && Object.entries(cashState.balances.customAccounts).map(([name, amt]) => (
                <div
                  key={name}
                  className="p-4 rounded-xl border bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
                        <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Custom Bank / Account
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCustomAccount(name)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Balance
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={amt || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleCustomAccountChange(name, val);
                        }}
                        className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </>
        )}
      </div>

      {/* NOTES & RECONCILIATION AUDIT LOG */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
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
          placeholder="e.g. All GCash cash-in funds transferred to Seabank for interest; physical cash drawer counted by Manager on duty."
          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        {cashState.lastUpdated && (
          <p className="text-[10px] text-slate-400 text-right">
            Last saved: {new Date(cashState.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

    </div>
  );
};
