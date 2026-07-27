import React, { useState, useEffect } from 'react';
import { X, Plus, Check, ArrowDownLeft, ArrowUpRight, DollarSign, Clock, Calendar } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { DEFAULT_SALES_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../constants';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialType?: TransactionType;
  initialCategory?: string;
  initialDate?: string;
  editingTransaction?: Transaction | null;
  isCategoryLocked?: boolean;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'sales',
  initialCategory = 'Cash In',
  initialDate,
  editingTransaction = null,
  isCategoryLocked = false,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [category, setCategory] = useState<string>(initialCategory);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setAmount(editingTransaction.amount.toString());
      setDescription(editingTransaction.description || '');
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '12:00 PM');
    } else {
      setType(initialType);
      setCategory(initialCategory);
      setAmount('');
      setDescription('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [editingTransaction, initialType, initialCategory, initialDate, isOpen]);

  // Handle category fallback when switching types
  useEffect(() => {
    if (!editingTransaction) {
      if (type === 'sales') {
        if (!DEFAULT_SALES_CATEGORIES.some(c => c.name === category)) {
          setCategory('Cash In');
        }
      } else {
        if (!DEFAULT_EXPENSE_CATEGORIES.some(c => c.name === category)) {
          setCategory('Food');
        }
      }
    }
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onSave(
      {
        date,
        type,
        category,
        amount: numAmount,
        description: description.trim() || `${category} Entry`,
        time,
      },
      editingTransaction?.id
    );

    onClose();
  };

  const addQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const allCategories = type === 'sales' ? DEFAULT_SALES_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  const categoriesToDisplay = isCategoryLocked
    ? allCategories.filter((c) => c.name === category)
    : allCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            {editingTransaction ? 'Edit Transaction' : 'Log New Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Sales vs Expense Toggle */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                disabled={isCategoryLocked}
                onClick={() => setType('sales')}
                className={`py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'sales'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                } ${isCategoryLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Sales Inflow</span>
              </button>

              <button
                type="button"
                disabled={isCategoryLocked}
                onClick={() => setType('expense')}
                className={`py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                } ${isCategoryLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Expense Outflow</span>
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Category
              </label>
              {isCategoryLocked && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                  Card Specific ({category})
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categoriesToDisplay.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? type === 'sales'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 shadow-2xs'
                          : 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">{cat.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Field & Quick Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Amount (₱ PHP)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-lg">₱</span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Amount Add Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Add:</span>
              {[50, 100, 200, 300, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addQuickAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold transition-colors"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. GCash cash-in customer, Smart 100 load, Lunch..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Time
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 09:30 AM"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${
                type === 'sales'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
              }`}
            >
              {editingTransaction ? 'Update Entry' : 'Save Transaction'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
