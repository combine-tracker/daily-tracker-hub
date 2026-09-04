import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  X,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Transaction, CategoryName, TransactionType } from '../types';
import { DEFAULT_SALES_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../constants';
import { formatCurrency, exportToCSV } from '../utils/storage';

interface DeepSearchProps {
  transactions: Transaction[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteMultipleTransactions?: (ids: string[]) => void;
}

export const DeepSearch: React.FC<DeepSearchProps> = ({
  transactions,
}) => {
  // Filter States
  const [datePreset, setDatePreset] = useState<'all' | '7days' | '30days' | 'this_month' | 'last_month' | 'specific_month' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().substring(0, 7)); // YYYY-MM

  const [typeFilter, setTypeFilter] = useState<'all' | 'sales' | 'expense'>('all');
  const [selectedCategories, setSelectedCategories] = useState<CategoryName[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collapsible toggle states for compact mobile & desktop view
  const [isDatePeriodOpen, setIsDatePeriodOpen] = useState<boolean>(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState<boolean>(false);

  const DATE_PRESETS: { id: typeof datePreset; label: string }[] = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'specific_month', label: 'Specific Month' },
    { id: 'custom', label: 'Custom Range' },
    { id: 'all', label: 'All Time' },
  ];

  const activeDatePresetLabel = useMemo(() => {
    if (datePreset === 'specific_month' && selectedMonth) {
      return `Month: ${selectedMonth}`;
    }
    if (datePreset === 'custom') {
      if (startDate && endDate) return `${startDate} to ${endDate}`;
      if (startDate) return `From ${startDate}`;
      if (endDate) return `Until ${endDate}`;
      return 'Custom Range';
    }
    const found = DATE_PRESETS.find(p => p.id === datePreset);
    return found ? found.label : 'This Month';
  }, [datePreset, selectedMonth, startDate, endDate]);

  // All available categories
  const allCategories = useMemo(() => {
    return [
      ...DEFAULT_SALES_CATEGORIES.map(c => ({ name: c.name, type: 'sales' as TransactionType })),
      ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({ name: c.name, type: 'expense' as TransactionType })),
    ];
  }, []);

  // Update dates when preset changes
  const handlePresetChange = (preset: typeof datePreset) => {
    setDatePreset(preset);
    const today = new Date();

    if (preset === '7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === '30days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 29);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'last_month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(last.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered transactions calculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Date filter
      if (datePreset === 'specific_month' && selectedMonth) {
        if (!tx.date.startsWith(selectedMonth)) return false;
      } else if (datePreset !== 'all') {
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(tx.category)) return false;

      // Search keyword query
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(queryLower);
        const catMatch = tx.category.toLowerCase().includes(queryLower);
        const dateMatch = tx.date.includes(queryLower);
        const amountMatch = tx.amount.toString().includes(queryLower);
        if (!descMatch && !catMatch && !dateMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [transactions, datePreset, selectedMonth, startDate, endDate, typeFilter, selectedCategories, searchQuery]);

  // Total Daily Metrics
  const totalDailySales = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'sales').reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalDailyExpenses = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const netCashFlow = totalDailySales - totalDailyExpenses;

  // Toggle Category selection
  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const handleClearFilters = () => {
    setDatePreset('this_month');
    handlePresetChange('this_month');
    setTypeFilter('all');
    setSelectedCategories([]);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Deep Search
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCSV(filteredTransactions, 'deep_search_results')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Bar Controls */}
        <div className="mt-4 space-y-3">
          
          {/* 1. Collapsible Date Period */}
          <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-800/40 transition-all">
            <button
              type="button"
              onClick={() => setIsDatePeriodOpen(!isDatePeriodOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Date Period
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  {activeDatePresetLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <span className="text-[11px] font-medium hidden sm:inline">
                  {isDatePeriodOpen ? 'Hide' : 'Change'}
                </span>
                {isDatePeriodOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {isDatePeriodOpen && (
              <div className="p-3 pt-1 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {DATE_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePresetChange(p.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        datePreset === p.id
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom or Specific Month Pickers */}
                {datePreset === 'specific_month' && (
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">Select Month:</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>
                )}

                {datePreset === 'custom' && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">From:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">To:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Type Filter & Keyword Search Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Transaction Type
              </label>
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    typeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter('sales')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    typeFilter === 'sales' ? 'bg-emerald-600 text-white shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Sales
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    typeFilter === 'expense' ? 'bg-rose-600 text-white shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Expenses
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Search Notes / Description / Amount
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder=""
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Collapsible Category Tags Picker */}
          <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-800/40 transition-all">
            <button
              type="button"
              onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-500" />
                  Filter By Specific Category
                </span>
                {selectedCategories.length > 0 ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-2xs">
                    {selectedCategories.length} selected
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    All Categories
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedCategories.length > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategories([]);
                    }}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-medium cursor-pointer mr-1"
                  >
                    Clear
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <span className="text-[11px] font-medium hidden sm:inline">
                    {isCategoryFilterOpen ? 'Hide' : 'Select'}
                  </span>
                  {isCategoryFilterOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {isCategoryFilterOpen && (
              <div className="p-3 pt-1 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {allCategories.map(cat => {
                    const isSelected = selectedCategories.includes(cat.name);
                    return (
                      <button
                        key={`${cat.type}-${cat.name}`}
                        onClick={() => toggleCategory(cat.name)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] opacity-75">({cat.type === 'sales' ? 'Sales' : 'Exp'})</span>
                        {isSelected && <X className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3 Summary Cards: Sales, Expenses, Net Cash (3-column row grid) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
        {/* Card 1: Sales */}
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs space-y-1 sm:space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Sales
            </span>
          </div>
          <div className="font-extrabold text-xs sm:text-xl lg:text-2xl text-emerald-600 dark:text-emerald-400 truncate tracking-tight">
            {formatCurrency(totalDailySales)}
          </div>
        </div>

        {/* Card 2: Expenses */}
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-1 sm:space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-rose-700 dark:text-rose-400">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Expenses
            </span>
          </div>
          <div className="font-extrabold text-xs sm:text-xl lg:text-2xl text-rose-600 dark:text-rose-400 truncate tracking-tight">
            {formatCurrency(totalDailyExpenses)}
          </div>
        </div>

        {/* Card 3: Net Cash */}
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs space-y-1 sm:space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
            <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">
              Net Cash
            </span>
          </div>
          <div className={`font-extrabold text-xs sm:text-xl lg:text-2xl truncate tracking-tight ${
            netCashFlow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(netCashFlow)}
          </div>
        </div>
      </div>

    </div>
  );
};

