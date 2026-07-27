import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2, ArrowUpRight, ArrowDownLeft, Receipt, Smartphone, Zap, Utensils, ShoppingBag, Home, MoreHorizontal, Clock, StickyNote } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/storage';

interface TransactionAccordionProps {
  categoryName: string;
  categoryType: TransactionType;
  description: string;
  transactions: Transaction[];
  totalAmount: number;
  overallTypeTotal: number;
  onAddForCategory: (type: TransactionType, category: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  defaultExpanded?: boolean;
}

export const TransactionAccordion: React.FC<TransactionAccordionProps> = ({
  categoryName,
  categoryType,
  description,
  transactions,
  totalAmount,
  overallTypeTotal,
  onAddForCategory,
  onEditTransaction,
  onDeleteTransaction,
  defaultExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultExpanded || transactions.length > 0);

  // Map category icons
  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'Cash In': return <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Cash Out': return <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Billing Payments': return <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Load': return categoryType === 'sales'
        ? <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        : <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'Food': return <Utensils className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'Online': return <ShoppingBag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'Family': return <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default: return <MoreHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const percentageOfTotal = overallTypeTotal > 0 ? Math.round((totalAmount / overallTypeTotal) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Accordion Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {getCategoryIcon(categoryName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                {categoryName}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px] sm:max-w-xs">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`font-bold text-sm sm:text-base ${
              categoryType === 'sales'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}>
              {formatCurrency(totalAmount)}
            </div>
            {overallTypeTotal > 0 && (
              <div className="text-[10px] text-slate-400 font-medium">
                {percentageOfTotal}% of total {categoryType}
              </div>
            )}
          </div>

          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={isOpen ? "Collapse category" : "Expand category"}
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Progress visual bar */}
      {overallTypeTotal > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className={`h-1 transition-all duration-300 ${
              categoryType === 'sales' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(percentageOfTotal, 100)}%` }}
          />
        </div>
      )}

      {/* Accordion Expanded Content */}
      {isOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-3 sm:p-4">
          {transactions.length === 0 ? (
            <div className="text-center py-6 px-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                No {categoryName} transactions logged for this date.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddForCategory(categoryType, categoryName);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {categoryName} entry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 pb-1">
                <span>Details / Notes</span>
                <span>Amount & Actions</span>
              </div>

              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {tx.description || `${tx.category} Entry`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {tx.time || '12:00 PM'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`font-bold text-xs sm:text-sm ${
                      tx.type === 'sales'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrency(tx.amount)}
                    </div>

                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onAddForCategory(categoryType, categoryName)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another {categoryName}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
