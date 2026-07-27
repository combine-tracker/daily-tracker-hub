import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  PlusCircle,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Info,
  Building,
  Smartphone,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CreditAccount } from '../types';
import { loadStoredCreditAccounts, saveStoredCreditAccounts, formatCurrency } from '../utils/storage';

interface CreditMonitoringViewProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CreditMonitoringView: React.FC<CreditMonitoringViewProps> = ({ onShowToast }) => {
  const [accounts, setAccounts] = useState<CreditAccount[]>(() => loadStoredCreditAccounts());

  // Collapsible Section States
  const [isOverviewOpen, setIsOverviewOpen] = useState(true);
  const [isLedgerOpen, setIsLedgerOpen] = useState(true);

  // Save to localStorage on change
  useEffect(() => {
    saveStoredCreditAccounts(accounts);
  }, [accounts]);

  // Modal State
  const [editingAccount, setEditingAccount] = useState<CreditAccount | null>(null);
  const [isNewAccount, setIsNewAccount] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Atome');
  const [formLimit, setFormLimit] = useState<number | ''>(0);
  const [formPayable, setFormPayable] = useState<number | ''>(0);
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Open Edit Modal
  const handleOpenEdit = (acc: CreditAccount) => {
    setEditingAccount(acc);
    setIsNewAccount(false);
    setFormName(acc.name);
    setFormCategory(acc.category);
    setFormLimit(acc.creditLimit);
    setFormPayable(acc.payableAmount);
    setFormDueDate(acc.dueDate || '');
    setFormNotes(acc.notes || '');
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAccount({
      id: `custom-${Date.now()}`,
      name: '',
      category: 'Atome',
      creditLimit: 10000,
      payableAmount: 0,
      dueDate: '',
      notes: '',
    });
    setIsNewAccount(true);
    setFormName('');
    setFormCategory('Atome');
    setFormLimit(10000);
    setFormPayable(0);
    setFormDueDate('');
    setFormNotes('');
  };

  // Save Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const nameToUse = formName.trim() || `${formCategory} Credit`;
    const limitVal = typeof formLimit === 'number' ? formLimit : Number(formLimit) || 0;
    const payableVal = typeof formPayable === 'number' ? formPayable : Number(formPayable) || 0;

    const updatedAcc: CreditAccount = {
      ...editingAccount,
      name: nameToUse,
      category: formCategory,
      creditLimit: Math.max(0, limitVal),
      payableAmount: Math.max(0, payableVal),
      dueDate: formDueDate,
      notes: formNotes,
      lastUpdated: new Date().toISOString(),
    };

    if (isNewAccount) {
      setAccounts((prev) => [...prev, updatedAcc]);
      onShowToast?.(`Added new credit facility "${updatedAcc.name}"`, 'success');
    } else {
      setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
      onShowToast?.(`Updated "${updatedAcc.name}" details`, 'success');
    }

    setEditingAccount(null);
  };

  // Delete Account
  const handleDeleteAccount = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from your credit monitoring list?`)) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      onShowToast?.(`Removed "${name}" from credit monitoring`, 'info');
    }
  };

  // Quick Inline Payable Adjustment
  const handleInlinePayableChange = (id: string, newPayable: number) => {
    const val = Math.max(0, newPayable);
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, payableAmount: val, lastUpdated: new Date().toISOString() } : a))
    );
  };

  // Calculations
  const totalCreditLimit = useMemo(() => accounts.reduce((sum, a) => sum + (a.creditLimit || 0), 0), [accounts]);
  const totalPayables = useMemo(() => accounts.reduce((sum, a) => sum + (a.payableAmount || 0), 0), [accounts]);
  const totalAvailable = totalCreditLimit - totalPayables;
  const overallUtilization = totalCreditLimit > 0 ? (totalPayables / totalCreditLimit) * 100 : 0;

  // Preset Provider Colors & Badge styling
  const getProviderTheme = (category: string) => {
    const catLower = category.toLowerCase();
    if (catLower.includes('atome')) {
      return {
        badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
        border: 'border-emerald-200 dark:border-emerald-900/50',
        bar: 'bg-emerald-500',
      };
    }
    if (catLower.includes('maya')) {
      return {
        badge: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300',
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50/50 dark:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-900/50',
        bar: 'bg-blue-500',
      };
    }
    if (catLower.includes('cimb')) {
      return {
        badge: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300',
        text: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50/50 dark:bg-rose-950/20',
        border: 'border-rose-200 dark:border-rose-900/50',
        bar: 'bg-rose-500',
      };
    }
    if (catLower.includes('gcash')) {
      return {
        badge: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300',
        text: 'text-cyan-600 dark:text-cyan-400',
        bg: 'bg-cyan-50/50 dark:bg-cyan-950/20',
        border: 'border-cyan-200 dark:border-cyan-900/50',
        bar: 'bg-cyan-500',
      };
    }
    return {
      badge: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300',
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50/50 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-900/50',
      bar: 'bg-purple-500',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Credit Line Monitoring
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                Standalone Tracker
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor credit limits, current payables, and remaining available balances for Atome, PayMaya, CIMB, GCash & Custom credit facilities. Note: This credit line tab is standalone; any data encoded here will not affect other tabs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Credit Line</span>
          </button>
        </div>
      </div>

      {/* Top Summary Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Total Credit Limit */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              Total Credit Limit
            </span>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">
              {accounts.length} Accounts
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">
            {formatCurrency(totalCreditLimit)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Combined maximum credit line granted
          </p>
        </div>

        {/* Card 2: Total Payables / Used Credit */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Total Payables (Used)
            </span>
            <span className="text-[10px] bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded font-bold">
              Debt Owed
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 truncate">
            {formatCurrency(totalPayables)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Current outstanding credit balance to pay
          </p>
        </div>

        {/* Card 3: Total Available Balance */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Available Credit Balance
            </span>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
              Remaining
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatCurrency(Math.max(0, totalAvailable))}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Limit minus payables (Ready to use)
          </p>
        </div>

        {/* Card 4: Utilization Rate */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-amber-500" />
              Credit Utilization
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                overallUtilization > 70
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : overallUtilization > 30
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {overallUtilization.toFixed(1)}% Used
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallUtilization > 70 ? 'bg-rose-500' : overallUtilization > 30 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {overallUtilization > 70
              ? 'High utilization (>70%). Consider settling payments.'
              : overallUtilization > 30
              ? 'Moderate utilization (30%-70%).'
              : 'Healthy utilization (<30%).'}
          </p>
        </div>
      </div>

      {/* Credit Facilities Grid */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setIsOverviewOpen(!isOverviewOpen)}
          className="w-full flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Credit Facilities Overview ({accounts.length})</span>
            </h3>
            <span className="text-xs text-slate-400 hidden sm:inline">
              — Click edit or adjust payables directly per facility
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
            <span>{isOverviewOpen ? 'Hide' : 'Show'} Overview</span>
            {isOverviewOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {isOverviewOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => {
              const theme = getProviderTheme(acc.category);
              const available = acc.creditLimit - acc.payableAmount;
              const utilPct = acc.creditLimit > 0 ? (acc.payableAmount / acc.creditLimit) * 100 : 0;

              return (
                <div
                  key={acc.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border ${theme.border} p-4 sm:p-5 shadow-xs space-y-4 relative overflow-hidden transition-all hover:shadow-md`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${theme.badge}`}>
                          {acc.category}
                        </span>
                        {acc.dueDate && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            Due: {acc.dueDate}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {acc.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(acc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all cursor-pointer"
                        title="Edit facility details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id, acc.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                        title="Delete credit line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit Limit</span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block">
                        {formatCurrency(acc.creditLimit)}
                      </span>
                    </div>

                    <div className="border-x border-slate-200 dark:border-slate-700 px-1">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Payable</span>
                      <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 truncate block">
                        {formatCurrency(acc.payableAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Balance</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 truncate block">
                        {formatCurrency(Math.max(0, available))}
                      </span>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Credit Limit Utilized</span>
                      <span className={`font-bold ${utilPct > 80 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {utilPct.toFixed(1)}% ({formatCurrency(acc.payableAmount)} / {formatCurrency(acc.creditLimit)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          utilPct > 80 ? 'bg-rose-500' : utilPct > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, utilPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Notes & Quick Payable Edit */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="text-slate-500 dark:text-slate-400 truncate max-w-xs italic text-[11px]">
                      {acc.notes || 'No extra notes specified'}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <span className="text-[10px] text-slate-400 font-medium">Update Payable:</span>
                      <input
                        type="number"
                        value={acc.payableAmount}
                        onChange={(e) => handleInlinePayableChange(acc.id, Number(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-extrabold text-rose-600 dark:text-rose-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Itemized Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsLedgerOpen(!isLedgerOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <span>Credit Facilities Summary Ledger</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              — Atome, PayMaya, CIMB, GCash Breakdown
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
            <span>{isLedgerOpen ? 'Hide' : 'Show'} Summary Ledger</span>
            {isLedgerOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {isLedgerOpen && (
          <div className="p-4 sm:p-5 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3.5 py-2.5">Credit Facility</th>
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5 text-right">Credit Limit</th>
                    <th className="px-3.5 py-2.5 text-right">Current Payable</th>
                    <th className="px-3.5 py-2.5 text-right">Available Balance</th>
                    <th className="px-3.5 py-2.5 text-center">Utilization</th>
                    <th className="px-3.5 py-2.5 text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {accounts.map((acc) => {
                    const avail = acc.creditLimit - acc.payableAmount;
                    const util = acc.creditLimit > 0 ? (acc.payableAmount / acc.creditLimit) * 100 : 0;
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-3.5 py-2.5 font-extrabold text-slate-900 dark:text-white">
                          {acc.name}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {acc.category}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(acc.creditLimit)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-black text-rose-600 dark:text-rose-400">
                          {formatCurrency(acc.payableAmount)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Math.max(0, avail))}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              util > 70
                                ? 'bg-rose-100 text-rose-800'
                                : util > 30
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {util.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-slate-500 font-semibold">
                          {acc.dueDate || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-black text-xs border-t border-slate-200 dark:border-slate-700">
                  <tr>
                    <td className="px-3.5 py-3 text-slate-900 dark:text-white" colSpan={2}>
                      TOTAL OVERALL
                    </td>
                    <td className="px-3.5 py-3 text-right text-slate-900 dark:text-white">
                      {formatCurrency(totalCreditLimit)}
                    </td>
                    <td className="px-3.5 py-3 text-right text-rose-600 dark:text-rose-400">
                      {formatCurrency(totalPayables)}
                    </td>
                    <td className="px-3.5 py-3 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Math.max(0, totalAvailable))}
                    </td>
                    <td className="px-3.5 py-3 text-center text-slate-700 dark:text-slate-300">
                      {overallUtilization.toFixed(1)}%
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EDIT / ADD CREDIT FACILITY MODAL */}
      {editingAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>{isNewAccount ? 'Add New Credit Facility' : 'Edit Credit Line Details'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category / Provider
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    setFormCategory(e.target.value);
                    if (!formName || formName === `${formCategory} Credit`) {
                      setFormName(`${e.target.value} Credit`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Atome">Atome</option>
                  <option value="PayMaya">PayMaya / Maya Credit</option>
                  <option value="CIMB">CIMB Bank Credit</option>
                  <option value="GCash">GCash (GGives / GCredit)</option>
                  <option value="Other / Bank Credit">Other / Custom Bank Credit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atome Installment Line, Maya Credit, CIMB Revolve"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formLimit}
                    onChange={(e) => setFormLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Payable / Used (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPayable}
                    onChange={(e) => setFormPayable(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date / Statement Cycle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 15th of every month, 2026-08-20"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Interest / Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 0% interest if paid on time, 3 months installment"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs active:scale-95"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
