import React, { useState, useMemo } from 'react';
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
  CheckCircle2,
  ListOrdered,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Transaction, LoanRecord } from '../types';

interface MonthlySoaViewProps {
  transactions: Transaction[];
  loans: LoanRecord[];
}

export const MonthlySoaView: React.FC<MonthlySoaViewProps> = ({ transactions, loans }) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0 - 11

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

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    years.add(currentDate.getFullYear());
    transactions.forEach((t) => {
      const y = new Date(t.date).getFullYear();
      if (!isNaN(y)) years.add(y);
    });
    loans.forEach((l) => {
      const y = new Date(l.date).getFullYear();
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, loans]);

  // Filter transactions for selected year and month
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, selectedYear, selectedMonth]);

  // Calculations
  const salesTransactions = useMemo(() => monthTransactions.filter((t) => t.type === 'sales'), [monthTransactions]);
  const expenseTransactions = useMemo(() => monthTransactions.filter((t) => t.type === 'expense'), [monthTransactions]);

  const totalSales = useMemo(() => salesTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0), [salesTransactions]);
  const totalExpenses = useMemo(() => expenseTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0), [expenseTransactions]);
  const netIncome = totalSales - totalExpenses;

  // Sales Breakdown by Category
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

  // Expense Breakdown by Category
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
        const pd = new Date(p.date);
        if (pd.getFullYear() === selectedYear && pd.getMonth() === selectedMonth) {
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
                  End of Month Report
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate, review, and print formal monthly statements for sales, expenses & loans.
              </p>
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

        {/* Month Selector Controls */}
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
            <p className="text-xs text-slate-500 dark:text-slate-400 print:text-gray-600">
              Monthly Financial Summary, Cash Reconciliation & Activity Ledger
            </p>
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

        {/* Top Financial Highlights Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Total Sales */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5 uppercase">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Monthly Sales / Cash In
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded font-bold">
                {salesTransactions.length} txns
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 truncate">
              {formatCurrency(totalSales)}
            </div>
          </div>

          {/* Card 2: Total Expenses */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
              <span className="flex items-center gap-1.5 uppercase">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                Monthly Expenses / Outflow
              </span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded font-bold">
                {expenseTransactions.length} txns
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 truncate">
              {formatCurrency(totalExpenses)}
            </div>
          </div>

          {/* Card 3: Net Operating Position */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl border space-y-1 ${
              netIncome >= 0
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5 uppercase">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                Net Operating Income
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  netIncome >= 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {netIncome >= 0 ? 'Net Surplus' : 'Deficit'}
              </span>
            </div>
            <div
              className={`text-xl sm:text-2xl font-black truncate ${
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

        {/* Loan & Utang Monthly Activity Summary */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <HandCoins className="w-4 h-4 text-amber-600" />
              Monthly Loan & Debt Repayments Activity
            </h3>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
              {monthLoanPayments.collected.length + monthLoanPayments.paid.length} Repayments Recorded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200/60 dark:border-slate-800 text-xs">
              <span className="text-slate-500 block font-medium">Collected from Borrowers:</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalLoanCollected)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200/60 dark:border-slate-800 text-xs">
              <span className="text-slate-500 block font-medium">Repaid to Lenders:</span>
              <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalLoanPaid)}
              </span>
            </div>
          </div>
        </div>

        {/* Full Itemized Ledger Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-indigo-500" />
              Itemized Transaction Ledger ({monthTransactions.length})
            </h3>
            <span className="text-xs font-medium text-slate-400">
              {monthsList[selectedMonth]} {selectedYear}
            </span>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500">No transactions found for {monthsList[selectedMonth]} {selectedYear}.</p>
              <p className="text-[11px] text-slate-400 mt-1">Logged sales or expenses for this month will automatically reflect here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Date & Time</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {monthTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="font-bold">{t.date}</div>
                        {t.time && <div className="text-[10px] text-slate-400">{t.time}</div>}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            t.type === 'sales'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {t.type === 'sales' ? 'Sales' : 'Expense'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {t.category}
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
                        {t.type === 'sales' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
