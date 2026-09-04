import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Calendar,
  Clock,
  FileText,
  Tag,
  Edit2,
  Info,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/storage';

interface UnclaimedCashOutsCardProps {
  transactions: Transaction[];
  onClaimCashOut: (id: string, customerName: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const UnclaimedCashOutsCard: React.FC<UnclaimedCashOutsCardProps> = ({
  transactions,
  onClaimCashOut,
  onEditTransaction,
}) => {
  // Filter for category === 'Cash Out' AND status === 'UNCLAIMED' (or missing customerName)
  const unclaimedTxs = transactions.filter(
    (t) => t.category === 'Cash Out' && (t.status === 'UNCLAIMED' || (!t.customerName && t.status !== 'CLAIMED'))
  );

  // Local state for customer name inputs per transaction ID
  const [nameInputs, setNameInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const allExpanded = filteredUnclaimed.every((tx) => expandedIds[tx.id]);
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredUnclaimed.forEach((tx) => {
        next[tx.id] = true;
      });
      setExpandedIds(next);
    }
  };

  const handleCopyRef = (refText: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!refText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(refText).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNameChange = (id: string, value: string) => {
    setNameInputs((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleClaim = (txId: string) => {
    const inputVal = nameInputs[txId] || '';
    if (!inputVal.trim()) {
      setErrors((prev) => ({ ...prev, [txId]: 'Please enter customer name first' }));
      return;
    }
    setErrors((prev) => ({ ...prev, [txId]: '' }));
    onClaimCashOut(txId, inputVal.trim());
    setNameInputs((prev) => {
      const copy = { ...prev };
      delete copy[txId];
      return copy;
    });
  };

  const totalUnclaimedAmount = unclaimedTxs.reduce((sum, t) => sum + t.amount, 0);

  const filteredUnclaimed = unclaimedTxs.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (tx.referenceNumber && tx.referenceNumber.toLowerCase().includes(q)) ||
      (tx.description && tx.description.toLowerCase().includes(q)) ||
      tx.date.includes(q) ||
      tx.amount.toString().includes(q)
    );
  });

  const areAllExpanded =
    filteredUnclaimed.length > 0 && filteredUnclaimed.every((tx) => expandedIds[tx.id]);

  if (unclaimedTxs.length === 0) {
    return (
      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
              <span>Unclaimed Cash-Outs Tracker</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                All Settled
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              All cash-outs have customer names logged.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/80 rounded-xl p-2.5 sm:p-4 shadow-2xs space-y-2 sm:space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-900/40 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 shrink-0">
            <AlertCircle className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                Unclaimed Cash-Outs
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white shrink-0">
                {unclaimedTxs.length} Pending
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-amber-900/80 dark:text-amber-300/80 font-medium truncate">
              Click any cash-out to view full transaction details, or enter customer name to claim.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {filteredUnclaimed.length > 1 && (
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 bg-amber-100/80 dark:bg-amber-900/50 px-2 py-1 rounded-lg transition-colors cursor-pointer hidden sm:inline-flex items-center gap-1"
            >
              {areAllExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{areAllExpanded ? 'Collapse All' : 'Expand All Details'}</span>
            </button>
          )}

          <div className="text-right shrink-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 block">
              Total Pending
            </span>
            <span className="text-sm sm:text-lg font-black text-amber-600 dark:text-amber-300">
              {formatCurrency(totalUnclaimedAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search if multiple items */}
      {unclaimedTxs.length > 2 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Ref #, amount, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 text-[11px] rounded-lg border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}

      {/* List of Unclaimed Cash-Outs */}
      <div className="space-y-2">
        {filteredUnclaimed.map((tx) => {
          const nameVal = nameInputs[tx.id] ?? '';
          const isExpanded = !!expandedIds[tx.id];
          const isCopied = copiedId === tx.id;

          return (
            <div
              key={tx.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-2xs transition-all duration-200 ${
                isExpanded
                  ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20 shadow-xs'
                  : 'border-amber-200 dark:border-amber-800/80 hover:border-amber-300'
              }`}
            >
              {/* Clickable Header Row: Click to toggle all details */}
              <div
                onClick={() => toggleExpand(tx.id)}
                className="p-2 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 cursor-pointer hover:bg-amber-50/40 dark:hover:bg-slate-800/40 transition-colors select-none"
                title="Click to view all details"
              >
                {/* Left Details: Badges & Summary */}
                <div className="flex-1 min-w-0 flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] flex items-center gap-0.5 shrink-0">
                      <ArrowUpRight className="w-3 h-3 text-amber-600" />
                      Cash Out
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-extrabold text-[9px] uppercase tracking-wider shrink-0">
                      UNCLAIMED
                    </span>
                    {tx.referenceNumber && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] truncate max-w-[130px] sm:max-w-none">
                        Ref: {tx.referenceNumber}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {tx.date} ({tx.time || '12:00 PM'})
                    </span>
                  </div>

                  {/* Amount on Mobile (right aligned on mobile top row) */}
                  <div className="sm:hidden text-right shrink-0 flex items-center gap-1.5">
                    <span className="font-black text-xs text-rose-600 dark:text-rose-400">
                      {formatCurrency(tx.amount)}
                    </span>
                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Amount (desktop) & Quick Claim Action */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800"
                >
                  <div className="hidden sm:block text-right pr-1">
                    <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleClaim(tx.id);
                    }}
                    className="flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    <div className="flex items-center gap-1 flex-1 sm:w-auto">
                      <input
                        type="text"
                        placeholder="Enter Customer Name"
                        value={nameVal}
                        onChange={(e) => handleNameChange(tx.id, e.target.value)}
                        className={`flex-1 sm:w-36 px-2.5 py-1 rounded-md border bg-amber-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] font-medium focus:outline-none focus:ring-1 placeholder:text-slate-400 ${
                          errors[tx.id]
                            ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                            : 'border-amber-300 dark:border-amber-700 focus:ring-amber-500'
                        }`}
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
                        title="Save Customer Name & Mark as CLAIMED"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Claim</span>
                      </button>
                    </div>
                  </form>

                  {/* Expand Chevron Icon (Desktop) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(tx.id);
                    }}
                    className="hidden sm:flex p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isExpanded ? 'Hide details' : 'Show full details'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errors[tx.id] && (
                <div className="px-3 pb-2">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    ⚠️ {errors[tx.id]}
                  </span>
                </div>
              )}

              {/* EXPANDED FULL DETAILS SECTION */}
              {isExpanded && (
                <div className="border-t border-amber-200/80 dark:border-slate-800 bg-gradient-to-b from-amber-50/30 to-white dark:from-slate-900/90 dark:to-slate-900 p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Full Cash-Out Details
                      </h4>
                    </div>
                    {onEditTransaction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTransaction(tx);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Open in full edit modal"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Transaction</span>
                      </button>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    {/* Amount */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Cash-Out Amount:</span>
                      <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>

                    {/* Reference Number */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Ref Number:</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                          {tx.referenceNumber || 'None'}
                        </span>
                        {tx.referenceNumber && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyRef(tx.referenceNumber!, tx.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
                            title="Copy Reference Number"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Date & Time:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {tx.date} at {tx.time || '12:00 PM'}
                      </span>
                    </div>

                    {/* Category / Type */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" /> Category:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {tx.category} (Sales)
                      </span>
                    </div>

                    {/* Current Status */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        {tx.status || 'UNCLAIMED'}
                      </span>
                    </div>

                    {/* Customer Name */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Customer:</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400 italic">
                        {tx.customerName ? tx.customerName : 'Pending Claim'}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Description */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                      <FileText className="w-3 h-3 text-slate-400" /> Description / Memo:
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 pl-4 font-normal">
                      {tx.description && tx.description.trim() ? (
                        tx.description
                      ) : (
                        <span className="italic text-slate-400">No additional memo logged for this cash-out.</span>
                      )}
                    </p>
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10px] text-slate-400 pt-1">
                    <span className="font-mono truncate">ID: {tx.id}</span>
                    {tx.createdAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Logged on {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

