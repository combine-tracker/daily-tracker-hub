import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, ChevronDown, ChevronUp, PlusCircle, ArrowDownLeft, ArrowUpRight, Receipt, Smartphone, Edit2, Trash2, Clock, Sparkles } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { DEFAULT_SALES_CATEGORIES } from '../constants';
import { formatCurrency } from '../utils/storage';

interface SalesViewProps {
  transactions: Transaction[];
  onOpenAddModal: (type?: TransactionType, category?: string, date?: string, isLocked?: boolean) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteDayTransactions?: (dateStr: string, type?: TransactionType) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  transactions,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onDeleteDayTransactions,
}) => {
  // Filter sales only
  const salesTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'sales');
  }, [transactions]);

  // Overall Total Sales
  const totalSalesAllTime = useMemo(() => {
    return salesTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [salesTransactions]);

  // Group by Month (YYYY-MM)
  const monthlyGroups = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    salesTransactions.forEach(tx => {
      const monthKey = tx.date.substring(0, 7); // "2026-07"
      if (!map[monthKey]) map[monthKey] = [];
      map[monthKey].push(tx);
    });

    // Sort months descending
    const sortedMonthKeys = Object.keys(map).sort((a, b) => b.localeCompare(a));

    return sortedMonthKeys.map(monthKey => {
      const monthTxs = map[monthKey];
      const monthTotal = monthTxs.reduce((sum, t) => sum + t.amount, 0);

      // Group days inside month
      const dayMap: Record<string, Transaction[]> = {};
      monthTxs.forEach(t => {
        if (!dayMap[t.date]) dayMap[t.date] = [];
        dayMap[t.date].push(t);
      });

      const sortedDates = Object.keys(dayMap).sort((a, b) => b.localeCompare(a));

      const days = sortedDates.map(dateStr => {
        const dayTxs = dayMap[dateStr];
        const dayTotal = dayTxs.reduce((sum, t) => sum + t.amount, 0);

        // Group categories inside day
        const catMap: Record<string, number> = {};
        dayTxs.forEach(t => {
          catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        });

        // Formatted summary text e.g. "Cash out 300, Cash in 100, Load 10 — total is 410"
        const summaryParts: string[] = [];
        Object.entries(catMap).forEach(([cat, amt]) => {
          summaryParts.push(`${cat} ${amt}`);
        });
        const formulaText = `${summaryParts.join(', ')} — total is ${dayTotal}`;

        return {
          date: dateStr,
          dayTotal,
          txs: dayTxs,
          catMap,
          formulaText,
        };
      });

      return {
        monthKey,
        monthTotal,
        txCount: monthTxs.length,
        days,
      };
    });
  }, [salesTransactions]);

  // State for collapsible months (default expand latest month)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => {
    if (monthlyGroups.length > 0) {
      return { [monthlyGroups[0].monthKey]: true };
    }
    return {};
  });

  // State for collapsible days (default expand first day)
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (monthlyGroups.length > 0 && monthlyGroups[0].days.length > 0) {
      initial[monthlyGroups[0].days[0].date] = true;
    }
    return initial;
  });

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const toggleDay = (dateStr: string) => {
    setExpandedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  // Format month title
  const formatMonthTitle = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  // Format date header
  const formatDateTitle = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sales Overview Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                Daily Sales Log & Monthly Hierarchy
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Cash In, Cash Out, Billing Payments, and Load sales breakdown
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
          <div className="text-left sm:text-right">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Sales</span>
            <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSalesAllTime)}
            </span>
          </div>

          <button
            onClick={() => onOpenAddModal('sales', 'Cash In')}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Log Sales</span>
          </button>
        </div>
      </div>

      {/* Category Quick Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {DEFAULT_SALES_CATEGORIES.map(cat => {
          const catTotal = salesTransactions
            .filter(t => t.category === cat.name)
            .reduce((sum, t) => sum + t.amount, 0);

          return (
            <div
              key={cat.name}
              onClick={() => onOpenAddModal('sales', cat.name, undefined, true)}
              className="bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500">
                <span className="truncate">{cat.name}</span>
                <PlusCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
              <div className="mt-1 font-bold text-sm sm:text-lg text-emerald-600 dark:text-emerald-400 truncate">
                {formatCurrency(catTotal)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Month -> Day Collapsible List */}
      {monthlyGroups.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 text-sm mb-3">No sales transactions recorded yet.</p>
          <button
            onClick={() => onOpenAddModal('sales', 'Cash In')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add First Sales Entry</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {monthlyGroups.map((monthGroup) => {
            const isMonthOpen = !!expandedMonths[monthGroup.monthKey];

            return (
              <div
                key={monthGroup.monthKey}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                {/* Month Collapsible Header */}
                <div
                  onClick={() => toggleMonth(monthGroup.monthKey)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                        {formatMonthTitle(monthGroup.monthKey)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {monthGroup.days.length} days logged • {monthGroup.txCount} transactions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                        Monthly Sales
                      </span>
                      <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(monthGroup.monthTotal)}
                      </span>
                    </div>

                    <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {isMonthOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Days inside Month */}
                {isMonthOpen && (
                  <div className="p-4 space-y-3 bg-slate-50/30 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800">
                    {monthGroup.days.map((dayGroup) => {
                      const isDayOpen = !!expandedDays[dayGroup.date];

                      return (
                        <div
                          key={dayGroup.date}
                          className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden shadow-2xs"
                        >
                          {/* Day Collapsible Toggle Header */}
                          <div
                            onClick={() => toggleDay(dayGroup.date)}
                            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {formatDateTitle(dayGroup.date)}
                              </span>

                              {/* Daily Category Quick Chips */}
                              <div className="hidden md:flex items-center gap-1.5">
                                {Object.entries(dayGroup.catMap).map(([cat, val]) => (
                                  <span
                                    key={cat}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px]"
                                  >
                                    {cat}: ₱{val.toLocaleString()}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                Total: {formatCurrency(dayGroup.dayTotal)}
                              </span>

                              <button className="p-1 text-slate-400">
                                {isDayOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Quick Formula Summary Banner */}
                          <div className="px-4 py-1.5 bg-emerald-50/60 dark:bg-emerald-950/30 border-t border-b border-emerald-100 dark:border-emerald-900/50 text-[11px] text-emerald-900 dark:text-emerald-300 font-medium flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <strong>Summary:</strong> {dayGroup.formulaText}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {onDeleteDayTransactions && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDeleteDayTransactions(dayGroup.date, 'sales');
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1 transition-colors active:scale-95"
                                  title={`Delete all sales for ${dayGroup.date}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  <span>Delete Day</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOpenAddModal('sales', 'Cash In', dayGroup.date);
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] transition-colors active:scale-95"
                              >
                                + Add to date
                              </button>
                            </div>
                          </div>

                          {/* Detailed Items list for this day */}
                          {isDayOpen && (
                            <div className="p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                              {dayGroup.txs.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                                      {tx.category}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                                        {tx.description || tx.category}
                                      </div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {tx.time || '12:00 PM'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(tx.amount)}
                                    </span>
                                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                                      <button
                                        onClick={() => onEditTransaction(tx)}
                                        className="p-1 rounded text-slate-400 hover:text-indigo-600"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => onDeleteTransaction(tx.id)}
                                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
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
};
