import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  HandCoins,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Building2,
  FolderOpen,
  CalendarDays,
  ChevronsUpDown,
} from 'lucide-react';
import { Transaction, LoanRecord } from '../types';

interface MonthlySoaViewProps {
  transactions: Transaction[];
  loans: LoanRecord[];
}

interface CategorySummary {
  [category: string]: number;
}

interface NodeTotals {
  totalSales: number;
  totalExpenses: number;
  net: number;
  count: number;
  salesCategories: CategorySummary;
  expenseCategories: CategorySummary;
}

interface DayGroup {
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  dayLabel: string;
  transactions: Transaction[];
  totals: NodeTotals;
}

interface MonthGroup {
  monthKey: string; // YYYY-MM
  year: number;
  monthIndex: number; // 0-11
  monthName: string;
  days: DayGroup[];
  totals: NodeTotals;
}

interface YearGroup {
  year: number;
  months: MonthGroup[];
  totals: NodeTotals;
}

const parseTxDate = (dateStr: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return { year, month, day, dateObj: new Date(year, month, day) };
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), dateObj: d };
  }
  return null;
};

const calculateTotals = (txs: Transaction[]): NodeTotals => {
  let totalSales = 0;
  let totalExpenses = 0;
  const salesCategories: CategorySummary = {};
  const expenseCategories: CategorySummary = {};

  txs.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const cat = (t.category || 'Uncategorized').trim();
    if (t.type === 'sales') {
      totalSales += amt;
      salesCategories[cat] = (salesCategories[cat] || 0) + amt;
    } else {
      totalExpenses += amt;
      expenseCategories[cat] = (expenseCategories[cat] || 0) + amt;
    }
  });

  return {
    totalSales,
    totalExpenses,
    net: totalSales - totalExpenses,
    count: txs.length,
    salesCategories,
    expenseCategories,
  };
};

export const MonthlySoaView: React.FC<MonthlySoaViewProps> = ({ transactions, loans }) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0 - 11
  const [viewScope, setViewScope] = useState<'selected' | 'all'>('all');

  // Collapse / Expand state maps - Start with Year expanded, but Months & Days collapsed
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({ [currentDate.getFullYear()]: true });
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({}); // key: "2026-07"
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({}); // key: "2026-08-05"

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    years.add(currentDate.getFullYear());
    transactions.forEach((t) => {
      const parsed = parseTxDate(t.date);
      if (parsed) years.add(parsed.year);
    });
    loans.forEach((l) => {
      const parsed = parseTxDate(l.date);
      if (parsed) years.add(parsed.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, loans]);

  // Filter transactions for selected year and month (for summary cards & header)
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const parsed = parseTxDate(t.date);
      if (!parsed) return false;
      return parsed.year === selectedYear && parsed.month === selectedMonth;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, selectedYear, selectedMonth]);

  // Calculations for current period summary header
  const salesTransactions = useMemo(() => monthTransactions.filter((t) => t.type === 'sales'), [monthTransactions]);
  const expenseTransactions = useMemo(() => monthTransactions.filter((t) => t.type === 'expense'), [monthTransactions]);

  const totalSales = useMemo(() => salesTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0), [salesTransactions]);
  const totalExpenses = useMemo(() => expenseTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0), [expenseTransactions]);
  const netIncome = totalSales - totalExpenses;

  // Sales Breakdown by Category for monthly summary
  const salesByCategory = useMemo<Record<string, { total: number; count: number }>>(() => {
    const map: Record<string, { total: number; count: number }> = {};
    salesTransactions.forEach((t) => {
      const cat = t.category || 'Uncategorized';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += Number(t.amount) || 0;
      map[cat].count += 1;
    });
    return map;
  }, [salesTransactions]);

  // Expense Breakdown by Category for monthly summary
  const expensesByCategory = useMemo<Record<string, { total: number; count: number }>>(() => {
    const map: Record<string, { total: number; count: number }> = {};
    expenseTransactions.forEach((t) => {
      const cat = t.category || 'Uncategorized';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += Number(t.amount) || 0;
      map[cat].count += 1;
    });
    return map;
  }, [expenseTransactions]);

  // Loan Repayment activity during this month
  const monthLoanPayments = useMemo(() => {
    const collected: { counterparty: string; amount: number; date: string }[] = [];
    const paid: { counterparty: string; amount: number; date: string }[] = [];

    loans.forEach((loan) => {
      loan.payments?.forEach((p) => {
        const pd = parseTxDate(p.date);
        if (pd && pd.year === selectedYear && pd.month === selectedMonth) {
          if (loan.type === 'loan_out') {
            collected.push({ counterparty: loan.counterparty, amount: p.amount, date: p.date });
          } else {
            paid.push({ counterparty: loan.counterparty, amount: p.amount, date: p.date });
          }
        }
      });
    });

    return { collected, paid };
  }, [loans, selectedYear, selectedMonth]);

  const totalLoanCollected = monthLoanPayments.collected.reduce((acc, p) => acc + p.amount, 0);
  const totalLoanPaid = monthLoanPayments.paid.reduce((acc, p) => acc + p.amount, 0);

  // BUILD COLLAPSIBLE HIERARCHY TREE: Year -> Month -> Day -> Transactions
  const hierarchyTree = useMemo<YearGroup[]>(() => {
    const sourceTransactions = viewScope === 'selected'
      ? transactions.filter((t) => {
          const p = parseTxDate(t.date);
          return p && p.year === selectedYear && p.month === selectedMonth;
        })
      : transactions;

    // Year -> Month -> Day maps
    const yearMap = new Map<number, Map<number, Map<string, Transaction[]>>>();

    sourceTransactions.forEach((t) => {
      const parsed = parseTxDate(t.date);
      if (!parsed) return;

      const { year, month, day } = parsed;
      const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (!yearMap.has(year)) yearMap.set(year, new Map());
      const monthMap = yearMap.get(year)!;

      if (!monthMap.has(month)) monthMap.set(month, new Map());
      const dayMap = monthMap.get(month)!;

      if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
      dayMap.get(dayKey)!.push(t);
    });

    const yearsList: YearGroup[] = [];

    // Sort Years descending
    Array.from(yearMap.keys()).sort((a, b) => b - a).forEach((yr) => {
      const monthMap = yearMap.get(yr)!;
      const monthsInYear: MonthGroup[] = [];

      // Sort Months descending
      Array.from(monthMap.keys()).sort((a, b) => b - a).forEach((mo) => {
        const dayMap = monthMap.get(mo)!;
        const daysInMonth: DayGroup[] = [];

        // Sort Days descending
        Array.from(dayMap.keys()).sort((a, b) => b.localeCompare(a)).forEach((dKey) => {
          const txs = dayMap.get(dKey)!;

          // Parse day details
          const parts = dKey.split('-');
          const dayNum = parseInt(parts[2], 10);
          const dtObj = new Date(yr, mo, dayNum);
          const dayOfWeek = !isNaN(dtObj.getTime()) ? dayNames[dtObj.getDay()] : '';
          const dayLabel = `${monthsList[mo]} ${dayNum}, ${yr} (${dayOfWeek})`;

          daysInMonth.push({
            dateStr: dKey,
            dayNum,
            dayLabel,
            transactions: txs,
            totals: calculateTotals(txs),
          });
        });

        // Combine month's transactions for month totals
        const allMonthTxs = daysInMonth.flatMap((d) => d.transactions);
        monthsInYear.push({
          monthKey: `${yr}-${mo}`,
          year: yr,
          monthIndex: mo,
          monthName: monthsList[mo],
          days: daysInMonth,
          totals: calculateTotals(allMonthTxs),
        });
      });

      // Combine year's transactions for year totals
      const allYearTxs = monthsInYear.flatMap((m) => m.days.flatMap((d) => d.transactions));
      yearsList.push({
        year: yr,
        months: monthsInYear,
        totals: calculateTotals(allYearTxs),
      });
    });

    return yearsList;
  }, [transactions, viewScope, selectedYear, selectedMonth]);

  // Keep current year expanded by default when selectedYear changes, keeping months and days collapsed for easy navigation
  useEffect(() => {
    setExpandedYears((prev) => ({
      ...prev,
      [selectedYear]: true,
    }));
  }, [selectedYear]);

  // Toggle Handlers
  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const toggleDay = (dateStr: string) => {
    setExpandedDays((prev) => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const handleExpandAll = () => {
    const eYears: Record<number, boolean> = {};
    const eMonths: Record<string, boolean> = {};
    const eDays: Record<string, boolean> = {};

    hierarchyTree.forEach((yG) => {
      eYears[yG.year] = true;
      yG.months.forEach((mG) => {
        eMonths[mG.monthKey] = true;
        mG.days.forEach((dG) => {
          eDays[dG.dateStr] = true;
        });
      });
    });

    setExpandedYears(eYears);
    setExpandedMonths(eMonths);
    setExpandedDays(eDays);
  };

  const handleCollapseAll = () => {
    setExpandedYears({});
    setExpandedMonths({});
    setExpandedDays({});
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Print SOA handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const period = `${monthsList[selectedMonth]}_${selectedYear}`;
    const filename = `Statement_of_Account_${period}.csv`;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `STATEMENT OF ACCOUNT (SOA) - ${monthsList[selectedMonth].toUpperCase()} ${selectedYear}\n`;
    csvContent += `Generated On,${new Date().toLocaleDateString()}\n\n`;

    csvContent += `SUMMARY\n`;
    csvContent += `Total Sales / Income,${totalSales.toFixed(2)}\n`;
    csvContent += `Total Expenses,${totalExpenses.toFixed(2)}\n`;
    csvContent += `Net Monthly Operating Income,${netIncome.toFixed(2)}\n`;
    csvContent += `Loan Repayments Collected,${totalLoanCollected.toFixed(2)}\n`;
    csvContent += `Loan Repayments Paid,${totalLoanPaid.toFixed(2)}\n\n`;

    csvContent += `SALES BREAKDOWN BY CATEGORY\nCategory,Transaction Count,Total Amount\n`;
    Object.entries(salesByCategory).forEach(([cat, rawVal]) => {
      const val = rawVal as { total: number; count: number };
      csvContent += `"${cat}",${val.count},${val.total.toFixed(2)}\n`;
    });
    csvContent += `\n`;

    csvContent += `EXPENSE BREAKDOWN BY CATEGORY\nCategory,Transaction Count,Total Amount\n`;
    Object.entries(expensesByCategory).forEach(([cat, rawVal]) => {
      const val = rawVal as { total: number; count: number };
      csvContent += `"${cat}",${val.count},${val.total.toFixed(2)}\n`;
    });
    csvContent += `\n`;

    csvContent += `ITEMIZED TRANSACTION LEDGER\nDate,Time,Type,Category,Description,Amount (PHP)\n`;
    monthTransactions.forEach((t) => {
      const desc = (t.description || '').replace(/"/g, '""');
      csvContent += `"${t.date}","${t.time || ''}","${t.type.toUpperCase()}","${t.category}","${desc}",${t.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const periodRangeStr = `${monthsList[selectedMonth]} 1, ${selectedYear} – ${monthsList[selectedMonth]} ${daysInMonth}, ${selectedYear}`;

  // Category breakdown pills renderer helper
  const renderCategoryPills = (totals: NodeTotals) => {
    const salesCats = Object.entries(totals.salesCategories).filter(([_, val]) => val > 0);
    const expCats = Object.entries(totals.expenseCategories).filter(([_, val]) => val > 0);

    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
        {/* Sales Categories */}
        {salesCats.map(([cat, val]) => (
          <span
            key={`s-${cat}`}
            className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 font-semibold"
          >
            <span className="opacity-75">{cat}:</span>{' '}
            <span className="font-bold">{formatCurrency(val)}</span>
          </span>
        ))}

        {/* Expense Categories */}
        {expCats.map(([cat, val]) => (
          <span
            key={`e-${cat}`}
            className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 font-semibold"
          >
            <span className="opacity-75">{cat}:</span>{' '}
            <span className="font-bold">{formatCurrency(val)}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Non-printable Controls & Header */}
      <div className="print:hidden space-y-4">
        {/* Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Monthly Statement of Account (SOA)
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                  Collapsible SOA Reports
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              title="Download CSV report for this month"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save SOA PDF</span>
            </button>
          </div>
        </div>

        {/* Month Selector & Filter Controls */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {monthsList.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Period:</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {periodRangeStr}
            </span>
          </div>
        </div>
      </div>

      {/* Official Printable Statement Document Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        
        {/* SOA Formal Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600 print:text-black" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                DAILY TRACKER - STATEMENT OF ACCOUNT
              </h1>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 print:border-gray-300 print:bg-transparent">
            <div>
              <span className="text-slate-400 print:text-gray-600 font-semibold">Statement Period: </span>
              <span className="font-bold text-slate-900 dark:text-white print:text-black">
                {monthsList[selectedMonth]} {selectedYear}
              </span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 font-semibold">Date Range: </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 print:text-black">
                {periodRangeStr}
              </span>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-600 font-semibold">Total Recorded Entries: </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 print:text-black">
                {monthTransactions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Top Financial Highlights Cards - Compact size */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Card 1: Total Sales */}
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-0.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Monthly Sales
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded font-bold">
                {salesTransactions.length} txns
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 truncate">
              {formatCurrency(totalSales)}
            </div>
          </div>

          {/* Card 2: Total Expenses */}
          <div className="px-3.5 py-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-0.5">
            <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                Monthly Expenses
              </span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.2 rounded font-bold">
                {expenseTransactions.length} txns
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-400 truncate">
              {formatCurrency(totalExpenses)}
            </div>
          </div>

          {/* Card 3: Net Operating Position */}
          <div
            className={`px-3.5 py-2.5 rounded-xl border space-y-0.5 ${
              netIncome >= 0
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Net Operating Income
              </span>
            </div>
            <div
              className={`text-lg sm:text-xl font-black truncate ${
                netIncome >= 0
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {netIncome >= 0 ? `+${formatCurrency(netIncome)}` : formatCurrency(netIncome)}
            </div>
          </div>
        </div>

        {/* Category Breakdown Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sales Breakdown Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Sales & Income Breakdown</span>
              <span>{formatCurrency(totalSales)}</span>
            </h3>

            {Object.keys(salesByCategory).length === 0 ? (
              <p className="text-xs text-slate-400 py-2 italic">No sales recorded for this month.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(salesByCategory).map(([cat, rawVal]) => {
                  const val = rawVal as { total: number; count: number };
                  const pct = totalSales > 0 ? (val.total / totalSales) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">{cat} ({val.count})</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(val.total)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expenses Breakdown Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center justify-between">
              <span>Expenses & Outflow Breakdown</span>
              <span>{formatCurrency(totalExpenses)}</span>
            </h3>

            {Object.keys(expensesByCategory).length === 0 ? (
              <p className="text-xs text-slate-400 py-2 italic">No expenses recorded for this month.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(expensesByCategory).map(([cat, rawVal]) => {
                  const val = rawVal as { total: number; count: number };
                  const pct = totalExpenses > 0 ? (val.total / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">{cat} ({val.count})</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(val.total)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Loan & Utang Monthly Activity Summary - Compact Size */}
        <div className="bg-amber-50/40 dark:bg-amber-950/20 px-3.5 py-2.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <HandCoins className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Monthly Loan & Debt Repayments Activity
              </span>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                {monthLoanPayments.collected.length + monthLoanPayments.paid.length} recorded
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs divide-x divide-amber-200 dark:divide-amber-800/60">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Collected:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                {formatCurrency(totalLoanCollected)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 pl-3">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Repaid:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                {formatCurrency(totalLoanPaid)}
              </span>
            </div>
          </div>
        </div>

        {/* TRANSACTION LEDGER BY YEAR -> MONTH -> DAY */}
        <div className="space-y-4 pt-2">
          {/* Header & Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ChevronsUpDown className="w-4 h-4 text-indigo-500" />
                <span>Statement of Account Ledger</span>
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden w-full sm:w-auto justify-between sm:justify-end">
              {/* Scope filter: Selected Month vs All History */}
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewScope('selected')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewScope === 'selected'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {monthsList[selectedMonth]} {selectedYear}
                </button>
                <button
                  type="button"
                  onClick={() => setViewScope('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    viewScope === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Recorded History
                </button>
              </div>

              {/* Expand / Collapse All */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          {/* TREE NODES */}
          {hierarchyTree.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                No recorded transactions found for {viewScope === 'selected' ? `${monthsList[selectedMonth]} ${selectedYear}` : 'any date'}.
              </p>
              <p className="text-[11px] text-slate-400">
                Use "+ Log Tx" to add new sales or expense entries.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchyTree.map((yearGroup) => {
                const isYearExpanded = !!expandedYears[yearGroup.year];

                return (
                  <div
                    key={yearGroup.year}
                    className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-slate-900 overflow-hidden shadow-xs"
                  >
                    {/* LEVEL 1: YEAR HEADER */}
                    <button
                      type="button"
                      onClick={() => toggleYear(yearGroup.year)}
                      className="w-full text-left p-3.5 sm:p-4 bg-indigo-100/60 dark:bg-slate-800/80 hover:bg-indigo-100 dark:hover:bg-slate-800 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-indigo-200/50 dark:border-slate-700/60 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                          {isYearExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                        <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              Year {yearGroup.year}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200">
                              {yearGroup.totals.count} txns ({yearGroup.months.length} months)
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                              {isYearExpanded ? '▼ Click to Collapse Months' : '▶ Click to Expand Months'}
                            </span>
                          </div>
                          {renderCategoryPills(yearGroup.totals)}
                        </div>
                      </div>

                      {/* Year Totals Summary */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold self-end md:self-auto pt-1 md:pt-0">
                        <div className="text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                          Sales: {formatCurrency(yearGroup.totals.totalSales)}
                        </div>
                        <div className="text-rose-700 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60">
                          Expenses: {formatCurrency(yearGroup.totals.totalExpenses)}
                        </div>
                        <div
                          className={`px-2.5 py-1 rounded-lg border ${
                            yearGroup.totals.net >= 0
                              ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
                              : 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          Net: {yearGroup.totals.net >= 0 ? '+' : ''}
                          {formatCurrency(yearGroup.totals.net)}
                        </div>
                      </div>
                    </button>

                    {/* LEVEL 1 BODY: MONTHS */}
                    {isYearExpanded && (
                      <div className="p-2 sm:p-4 space-y-3">
                        {yearGroup.months.map((monthGroup) => {
                          const isMonthExpanded = !!expandedMonths[monthGroup.monthKey];

                          return (
                            <div
                              key={monthGroup.monthKey}
                              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                            >
                              {/* LEVEL 2: MONTH HEADER */}
                              <button
                                type="button"
                                onClick={() => toggleMonth(monthGroup.monthKey)}
                                className="w-full text-left p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                    {isMonthExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>
                                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {monthGroup.monthName} {monthGroup.year}
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        {monthGroup.totals.count} txns ({monthGroup.days.length} days)
                                      </span>
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                        {isMonthExpanded ? '▼ Click to Collapse Days' : '▶ Click to Expand Days'}
                                      </span>
                                    </div>
                                    {renderCategoryPills(monthGroup.totals)}
                                  </div>
                                </div>

                                {/* Month Totals Summary */}
                                <div className="flex flex-wrap items-center gap-2 text-xs font-bold self-end md:self-auto pt-1 md:pt-0">
                                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                                    + {formatCurrency(monthGroup.totals.totalSales)}
                                  </span>
                                  <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                                    - {formatCurrency(monthGroup.totals.totalExpenses)}
                                  </span>
                                  <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                                    = {monthGroup.totals.net >= 0 ? '+' : ''}
                                    {formatCurrency(monthGroup.totals.net)}
                                  </span>
                                </div>
                              </button>

                              {/* LEVEL 2 BODY: DAYS */}
                              {isMonthExpanded && (
                                <div className="p-2 sm:p-3 space-y-2.5">
                                  {monthGroup.days.map((dayGroup) => {
                                    const isDayExpanded = !!expandedDays[dayGroup.dateStr];

                                    return (
                                      <div
                                        key={dayGroup.dateStr}
                                        className="rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/60 overflow-hidden"
                                      >
                                        {/* LEVEL 3: DAY HEADER */}
                                        <button
                                          type="button"
                                          onClick={() => toggleDay(dayGroup.dateStr)}
                                          className="w-full text-left p-2.5 bg-slate-100/70 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="p-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                              {isDayExpanded ? (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                              ) : (
                                                <ChevronRight className="w-3.5 h-3.5" />
                                              )}
                                            </div>
                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                                  {dayGroup.dayLabel}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                  {dayGroup.totals.count} txns
                                                </span>
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                  {isDayExpanded ? '▼ Collapse Table' : '▶ Expand Table'}
                                                </span>
                                              </div>
                                              {renderCategoryPills(dayGroup.totals)}
                                            </div>
                                          </div>

                                          {/* Day Totals */}
                                          <div className="flex items-center gap-2 text-[11px] font-bold self-end md:self-auto">
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                              Sales: {formatCurrency(dayGroup.totals.totalSales)}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                            <span className="text-rose-600 dark:text-rose-400">
                                              Exp: {formatCurrency(dayGroup.totals.totalExpenses)}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                                              Net: {dayGroup.totals.net >= 0 ? '+' : ''}
                                              {formatCurrency(dayGroup.totals.net)}
                                            </span>
                                          </div>
                                        </button>

                                        {/* LEVEL 3 BODY: ITEMIZED TRANSACTIONS TABLE FOR THIS DAY */}
                                        {isDayExpanded && (
                                          <div className="overflow-x-auto bg-white dark:bg-slate-900">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                                                <tr>
                                                  <th className="px-3 py-2">Time</th>
                                                  <th className="px-3 py-2">Type</th>
                                                  <th className="px-3 py-2">Category</th>
                                                  <th className="px-3 py-2">Customer / Ref</th>
                                                  <th className="px-3 py-2">Description</th>
                                                  <th className="px-3 py-2 text-right">Amount</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                                {dayGroup.transactions.map((t) => (
                                                  <tr
                                                    key={t.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                                  >
                                                    <td className="px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                      {t.time || '—'}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                      <span
                                                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                          t.type === 'sales'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                        }`}
                                                      >
                                                        {t.type === 'sales' ? 'Sales' : 'Expense'}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                      {t.category}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                      {t.customerName ? (
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                          {t.customerName}
                                                        </span>
                                                      ) : t.referenceNumber ? (
                                                        <span className="font-mono text-[11px] text-slate-500">
                                                          Ref: {t.referenceNumber}
                                                        </span>
                                                      ) : (
                                                        '—'
                                                      )}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                      {t.description || '—'}
                                                    </td>
                                                    <td
                                                      className={`px-3 py-2 text-right font-black whitespace-nowrap ${
                                                        t.type === 'sales'
                                                          ? 'text-emerald-600 dark:text-emerald-400'
                                                          : 'text-rose-600 dark:text-rose-400'
                                                      }`}
                                                    >
                                                      {t.type === 'sales' ? '+' : '-'}
                                                      {formatCurrency(t.amount)}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Statement Authorization & Verification Footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-2 print:text-gray-600">
          <div className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Official Daily Tracker SOA Report • Verified Reconciliation Data</span>
          </div>
          <div>
            Generated on {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

      </div>
    </div>
  );
};
