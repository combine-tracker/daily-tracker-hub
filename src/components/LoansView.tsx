import React, { useState, useMemo } from 'react';
import { 
  HandCoins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  History, 
  DollarSign, 
  Building2, 
  User, 
  X,
  CreditCard,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LoanRecord, LoanType, LoanStatus, LoanPayment } from '../types';
import { formatCurrency } from '../utils/storage';

interface LoansViewProps {
  loans: LoanRecord[];
  onAddLoan: (loan: Omit<LoanRecord, 'id' | 'createdAt' | 'remainingAmount' | 'status' | 'payments'>) => void;
  onEditLoan: (loan: LoanRecord) => void;
  onDeleteLoan: (id: string) => void;
  onRecordPayment: (loanId: string, payment: Omit<LoanPayment, 'id' | 'createdAt'>) => void;
  onClearAllLoans?: () => void;
  onShowToast: (msg: string) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans,
  onAddLoan,
  onEditLoan,
  onDeleteLoan,
  onRecordPayment,
  onClearAllLoans,
  onShowToast,
}) => {
  // Filter state
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'loan_out' | 'loan_in'>('all');
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'active' | 'fully_paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanRecord | null>(null);

  // Form inputs for Add/Edit
  const [formData, setFormData] = useState<{
    type: LoanType;
    counterparty: string;
    originalAmount: number | '';
    remainingAmount: number | '';
    date: string;
    dueDate: string;
    description: string;
  }>({
    type: 'loan_out',
    counterparty: '',
    originalAmount: '',
    remainingAmount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
  });

  // Repayment Modal State
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<LoanRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Expand payment history for specific loans
  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({});

  const toggleHistory = (loanId: string) => {
    setExpandedHistories(prev => ({ ...prev, [loanId]: !prev[loanId] }));
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalLentOutActive = 0; // Active Loans Out remaining balance
    let totalBorrowedActive = 0; // Active Loans In remaining balance
    let totalLentOutOriginal = 0;
    let totalBorrowedOriginal = 0;

    loans.forEach(loan => {
      if (loan.type === 'loan_out') {
        totalLentOutOriginal += loan.originalAmount;
        if (loan.status !== 'fully_paid') {
          totalLentOutActive += loan.remainingAmount;
        }
      } else if (loan.type === 'loan_in') {
        totalBorrowedOriginal += loan.originalAmount;
        if (loan.status !== 'fully_paid') {
          totalBorrowedActive += loan.remainingAmount;
        }
      }
    });

    return {
      totalLentOutActive,
      totalBorrowedActive,
      totalLentOutOriginal,
      totalBorrowedOriginal,
      netPosition: totalLentOutActive - totalBorrowedActive,
    };
  }, [loans]);

  // Filtered Loans List
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      // Type match
      if (activeTypeTab !== 'all' && loan.type !== activeTypeTab) return false;

      // Status match
      if (activeStatusTab === 'active' && loan.status === 'fully_paid') return false;
      if (activeStatusTab === 'fully_paid' && loan.status !== 'fully_paid') return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = loan.counterparty.toLowerCase().includes(q);
        const matchesDesc = (loan.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [loans, activeTypeTab, activeStatusTab, searchQuery]);

  // Open Modal Helpers
  const handleOpenAddModal = (defaultType: LoanType = 'loan_out') => {
    setEditingLoan(null);
    setFormData({
      type: defaultType,
      counterparty: '',
      originalAmount: 0,
      remainingAmount: 0,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (loan: LoanRecord) => {
    setEditingLoan(loan);
    setFormData({
      type: loan.type,
      counterparty: loan.counterparty,
      originalAmount: loan.originalAmount,
      remainingAmount: loan.remainingAmount,
      date: loan.date,
      dueDate: loan.dueDate || '',
      description: loan.description || '',
    });
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.counterparty.trim()) {
      onShowToast('Please provide a borrower or lender name.');
      return;
    }

    const origAmt = typeof formData.originalAmount === 'number' ? formData.originalAmount : 0;
    const remAmt = typeof formData.remainingAmount === 'number' ? formData.remainingAmount : origAmt;

    if (origAmt < 0 || remAmt < 0) {
      onShowToast('Loan amounts cannot be negative.');
      return;
    }

    if (editingLoan) {
      const status = remAmt <= 0 ? 'fully_paid' : (remAmt < origAmt ? 'partially_paid' : 'active');
      onEditLoan({
        ...editingLoan,
        type: formData.type,
        counterparty: formData.counterparty.trim(),
        originalAmount: origAmt,
        remainingAmount: remAmt,
        status,
        date: formData.date,
        dueDate: formData.dueDate ? formData.dueDate : undefined,
        description: formData.description.trim(),
      });
      onShowToast(`Updated loan record for "${formData.counterparty}".`);
    } else {
      onAddLoan({
        type: formData.type,
        counterparty: formData.counterparty.trim(),
        originalAmount: origAmt,
        date: formData.date,
        dueDate: formData.dueDate ? formData.dueDate : undefined,
        description: formData.description.trim(),
      });
      onShowToast(`Recorded new loan: ${formData.type === 'loan_out' ? 'Lent to' : 'Borrowed from'} "${formData.counterparty}".`);
    }

    setIsAddModalOpen(false);
  };

  // Payment Submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForPayment) return;
    const amt = typeof paymentAmount === 'number' ? paymentAmount : 0;
    if (amt <= 0) {
      onShowToast('Please enter a valid payment amount.');
      return;
    }

    if (amt > selectedLoanForPayment.remainingAmount) {
      onShowToast(`Payment exceeds remaining balance of ${formatCurrency(selectedLoanForPayment.remainingAmount)}.`);
      return;
    }

    onRecordPayment(selectedLoanForPayment.id, {
      amount: amt,
      date: paymentDate,
      notes: paymentNotes.trim() || undefined,
    });

    onShowToast(`Recorded payment of ${formatCurrency(amt)} for ${selectedLoanForPayment.counterparty}.`);
    setSelectedLoanForPayment(null);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  return (
    <div className="space-y-3 sm:space-y-4">

      {/* Main Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-indigo-200/80 dark:border-indigo-900/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
            <HandCoins className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Loans & Credit
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenAddModal('loan_out')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Lent Money</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('loan_in')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Borrowed Money</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Card 1: Collectibles */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              Collectibles
            </span>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
              Receivables
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatCurrency(stats.totalLentOutActive)}
          </div>
        </div>

        {/* Card 2: Payables */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
              Payables
            </span>
            <span className="text-[10px] bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold">
              Liabilities
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 truncate">
            {formatCurrency(stats.totalBorrowedActive)}
          </div>
        </div>

        {/* Card 3: Net Credit / Debt */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
              Net Credit / Debt
            </span>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
              Balance
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black truncate ${
            stats.netPosition >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {stats.netPosition >= 0 ? `+${formatCurrency(stats.netPosition)}` : formatCurrency(stats.netPosition)}
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Type Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTypeTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTypeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Loans ({loans.length})
          </button>
          <button
            onClick={() => setActiveTypeTab('loan_out')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTypeTab === 'loan_out'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Lent Out (Loans Out)
          </button>
          <button
            onClick={() => setActiveTypeTab('loan_in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTypeTab === 'loan_in'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            Borrowed (Loans In)
          </button>
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={activeStatusTab}
            onChange={(e) => setActiveStatusTab(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="active">Active / Outstanding</option>
            <option value="fully_paid">Fully Paid</option>
          </select>

          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search person or bank..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
          <HandCoins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm mb-3">No loan records found matching your filters.</p>
          <button
            onClick={() => handleOpenAddModal('loan_out')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Loan Record</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLoans.map(loan => {
            const isLentOut = loan.type === 'loan_out';
            const paidAmount = loan.originalAmount - loan.remainingAmount;
            const progressPercent = Math.min(100, Math.round((paidAmount / loan.originalAmount) * 100));
            const isFullyPaid = loan.status === 'fully_paid' || loan.remainingAmount <= 0;
            const isHistoryOpen = !!expandedHistories[loan.id];

            return (
              <div
                key={loan.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                  isLentOut
                    ? 'border-emerald-200/90 dark:border-emerald-900/50'
                    : 'border-rose-200/90 dark:border-rose-900/50'
                }`}
              >
                <div className="p-5 space-y-3">
                  
                  {/* Top Badge & Status */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      isLentOut
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                    }`}>
                      {isLentOut ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      {isLentOut ? 'Lent Out (Receivable)' : 'Borrowed (Payable)'}
                    </span>

                    {isFullyPaid ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Settled
                      </span>
                    ) : loan.status === 'partially_paid' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                        Partially Paid ({progressPercent}%)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                        Active / Unpaid
                      </span>
                    )}
                  </div>

                  {/* Name & Dates */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {isLentOut ? <User className="w-4 h-4 text-emerald-500" /> : <Building2 className="w-4 h-4 text-rose-500" />}
                      {loan.counterparty}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>Date: {loan.date}</span>
                      {loan.dueDate && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Due: {loan.dueDate}
                        </span>
                      )}
                    </p>
                    {loan.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                        "{loan.description}"
                      </p>
                    )}
                  </div>

                  {/* Balance Amounts Grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining Balance</span>
                      <span className={`text-lg font-black ${
                        isFullyPaid
                          ? 'text-slate-400'
                          : isLentOut
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatCurrency(loan.remainingAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Original Amount</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(loan.originalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Repayment Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Paid: {formatCurrency(paidAmount)}</span>
                      <span>{progressPercent}% Complete</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFullyPaid
                            ? 'bg-slate-400'
                            : isLentOut
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Footer Controls & Payment History Toggle */}
                <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  
                  <button
                    onClick={() => toggleHistory(loan.id)}
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Payments ({loan.payments.length})</span>
                    {isHistoryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {!isFullyPaid && (
                      <button
                        onClick={() => {
                          setSelectedLoanForPayment(loan);
                          setPaymentAmount(loan.remainingAmount);
                          setPaymentDate(new Date().toISOString().split('T')[0]);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-all active:scale-95 flex items-center gap-1 ${
                          isLentOut ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isLentOut ? 'Collect Payment' : 'Pay Debt'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(loan)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                      title="Edit Loan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteLoan(loan.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                      title="Delete Loan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Expanded Payment History Logs */}
                {isHistoryOpen && (
                  <div className="p-4 bg-slate-100/60 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Repayment Log History
                    </h4>
                    {loan.payments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No payments logged yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {loan.payments.map(p => (
                          <div
                            key={p.id}
                            className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {formatCurrency(p.amount)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {p.date} {p.notes ? `• ${p.notes}` : ''}
                              </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT LOAN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-indigo-600" />
                {editingLoan ? 'Edit Loan Record' : 'Log New Loan / Credit'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Loan Direction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'loan_out' }))}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      formData.type === 'loan_out'
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs">Lent Out (Loan Out)</div>
                      <div className="text-[10px] text-slate-400">Utang ng iba sa atin</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'loan_in' }))}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      formData.type === 'loan_in'
                        ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-800 dark:text-rose-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="text-xs">Borrowed (Loan In)</div>
                      <div className="text-[10px] text-slate-400">Utang natin sa iba/bank</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Counterparty Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {formData.type === 'loan_out' ? 'Borrower Name (Sinong Humiram)' : 'Lender / Bank Name (Sino Inutangan)'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.counterparty}
                  onChange={(e) => setFormData(prev => ({ ...prev, counterparty: e.target.value }))}
                  placeholder={formData.type === 'loan_out' ? 'e.g. Juan Dela Cruz' : 'e.g. Maya Credit, BPI, Tita Mary'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Principal Amount & Remaining Balance */}
              <div className={editingLoan ? 'grid grid-cols-2 gap-3' : 'space-y-1'}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Principal Amount (₱)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={formData.originalAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const num = isNaN(val) ? '' : val;
                      setFormData(prev => ({
                        ...prev,
                        originalAmount: num,
                        remainingAmount: !editingLoan ? num : prev.remainingAmount,
                      }));
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {editingLoan && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Remaining (₱)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, remainingAmount: 0 }))}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                      >
                        Set ₱0
                      </button>
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={formData.remainingAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, remainingAmount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Purpose / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Emergency store inventory cash."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  {editingLoan ? 'Save Changes' : 'Record Loan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REPAYMENT / COLLECTION MODAL */}
      {selectedLoanForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Record Loan Repayment
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedLoanForPayment.counterparty}
                </p>
              </div>
              <button
                onClick={() => setSelectedLoanForPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Remaining Balance:</span>
                  <strong className="text-slate-900 dark:text-white">{formatCurrency(selectedLoanForPayment.remainingAmount)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (₱)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedLoanForPayment.remainingAmount}
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || '')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Payment Method
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via GCash cash-in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForPayment(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Repayment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
