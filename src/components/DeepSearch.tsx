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
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';
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

  // Chart Data: Daily Trends & Net Cash Flow
  const dailyChartData = useMemo(() => {
    const map: Record<string, { date: string; Sales: number; Expenses: number; NetCashFlow: number }> = {};

    filteredTransactions.forEach(t => {
      if (!map[t.date]) {
        map[t.date] = { date: t.date, Sales: 0, Expenses: 0, NetCashFlow: 0 };
      }
      if (t.type === 'sales') map[t.date].Sales += t.amount;
      else map[t.date].Expenses += t.amount;
    });

    return Object.values(map)
      .map(item => ({
        ...item,
        NetCashFlow: item.Sales - item.Expenses,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

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
              Deep Search & Date Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Search & calculate totals for specific dates, custom date ranges, specific months, or categories.
            </p>
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
        <div className="mt-4 space-y-4">
          
          {/* 1. Date Range Selector Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Date Period
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'specific_month', label: 'Specific Month' },
                { id: 'custom', label: 'Custom Range' },
                { id: 'all', label: 'All Time' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    datePreset === p.id
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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

          {/* 2. Type Filter & Keyword Search Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
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
                  placeholder="e.g. Cash out, GCash, Smart, Meralco, Food..."
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

          {/* 3. Category Tags Picker */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Filter By Specific Category
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {allCategories.map(cat => {
                const isSelected = selectedCategories.includes(cat.name);
                return (
                  <button
                    key={`${cat.type}-${cat.name}`}
                    onClick={() => toggleCategory(cat.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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

        </div>
      </div>

      {/* 3 Summary Cards: Total Daily Sales, Total Daily Expenses, Net Cash Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Daily Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Total Daily Sales
            </span>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
              Inflow
            </span>
          </div>
          <div className="font-extrabold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400 truncate">
            {formatCurrency(totalDailySales)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Total sales registered in filtered period
          </p>
        </div>

        {/* Card 2: Total Daily Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Total Daily Expenses
            </span>
            <span className="text-[10px] bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded font-bold">
              Outflow
            </span>
          </div>
          <div className="font-extrabold text-2xl sm:text-3xl text-rose-600 dark:text-rose-400 truncate">
            {formatCurrency(totalDailyExpenses)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Total expenses registered in filtered period
          </p>
        </div>

        {/* Card 3: Net Cash Flow */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" />
              Net Cash Flow
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              netCashFlow >= 0
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
            }`}>
              {netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <div className={`font-extrabold text-2xl sm:text-3xl truncate ${
            netCashFlow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(netCashFlow)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Daily Sales minus Daily Expenses
          </p>
        </div>
      </div>

      {/* Visual Charts Section: Daily Cash Flow & Sales Trend */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Daily Cash Flow & Sales Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visual comparison of Daily Sales, Daily Expenses, and Net Cash Flow trajectory over time.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
            {dailyChartData.length} Active Days
          </span>
        </div>

        {dailyChartData.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No daily transaction data found for the current filter criteria. Try adjusting the date range or search parameters above.
          </div>
        ) : (
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₱${val}`} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `₱${Number(value).toLocaleString()}`,
                    name === 'Sales' ? 'Daily Sales' : name === 'Expenses' ? 'Daily Expenses' : 'Net Cash Flow',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                />
                <Legend formatter={(value) => (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {value === 'Sales' ? 'Daily Sales (Inflow)' : value === 'Expenses' ? 'Daily Expenses (Outflow)' : 'Net Cash Flow'}
                  </span>
                )} />
                <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} name="Sales" />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
                <Line type="monotone" dataKey="NetCashFlow" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} name="NetCashFlow" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
};

