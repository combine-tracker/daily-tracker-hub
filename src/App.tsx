import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from './components/Header';
import { VerticalNav } from './components/VerticalNav';
import { AppSuiteHeader, AppModule } from './components/AppSuiteHeader';
import { FishHarvestApp } from './components/FishHarvestApp';
import { CashMonitoringView } from './components/CashMonitoringView';
import { LoansView } from './components/LoansView';
import { CreditMonitoringView } from './components/CreditMonitoringView';
import { SalesView } from './components/SalesView';

import { ExpensesView } from './components/ExpensesView';
import { MonthlySoaView } from './components/MonthlySoaView';
import { DeepSearch } from './components/DeepSearch';
import { RecoveryTab } from './components/RecoveryTab';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ExitConfirmationModal } from './components/ExitConfirmationModal';
import { Transaction, TransactionType, LoanRecord, LoanPayment, CashMonitoringState } from './types';
import {
  loadStoredTransactions,
  saveTransactionsToStorage,
  getLastAutoSaveTime,
  loadStoredLoans,
  saveStoredLoans,
  saveCashMonitoringState,
  exportRecoveryFile,
} from './utils/storage';
import { INITIAL_SAMPLE_TRANSACTIONS, INITIAL_CASH_MONITORING_STATE } from './constants';
import { firebaseSync } from './services/firebaseSync';

export default function App() {
  const [activeApp, setActiveApp] = useState<AppModule>(() => {
    return (localStorage.getItem('active_app_module_v1') as AppModule) || 'daily-tracker';
  });

  const handleSwitchApp = (app: AppModule) => {
    setActiveApp(app);
    localStorage.setItem('active_app_module_v1', app);
  };

  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);


  // Main state
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStoredTransactions());
  const [loans, setLoans] = useState<LoanRecord[]>(() => loadStoredLoans());
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(() => getLastAutoSaveTime());

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('sales');
  const [modalInitialCategory, setModalInitialCategory] = useState<string>('Cash In');
  const [modalInitialDate, setModalInitialDate] = useState<string>(selectedDate);
  const [isModalCategoryLocked, setIsModalCategoryLocked] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Mobile Back Button Navigation & Exit Interception
  useEffect(() => {
    // Push initial history state to capture back button
    window.history.pushState({ app: activeApp, tab: activeTab }, '');

    const handlePopState = () => {
      // Re-push history state so the user stays inside the app container
      window.history.pushState({ app: activeApp, tab: activeTab }, '');

      // 1. If Add/Edit Modal is open, close it first
      if (isAddModalOpen) {
        setIsAddModalOpen(false);
        setEditingTx(null);
        return;
      }

      // 2. If Exit Modal is already open, close it
      if (isExitModalOpen) {
        setIsExitModalOpen(false);
        return;
      }

      // 3. Check if currently on the main dashboard
      const isMainDashboard = activeApp === 'daily-tracker' && activeTab === 'sales';

      if (!isMainDashboard) {
        // Redirect back to Main Dashboard instead of exiting
        setActiveApp('daily-tracker');
        setActiveTab('sales');
        showToast('Returned to Main Dashboard');
      } else {
        // Already on Main Dashboard -> Show exit confirmation prompt
        setIsExitModalOpen(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeApp, activeTab, isAddModalOpen, isExitModalOpen]);

  // Prevent accidental tab close or page reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave the application? Your financial data is safely auto-saved.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Initialize Firebase Cloud Synchronization (Offline-First)
  useEffect(() => {
    firebaseSync.init(
      (updatedTxs) => {
        setTransactions(updatedTxs);
      },
      (updatedLoans) => {
        setLoans(updatedLoans);
      }
    );
    return () => {
      firebaseSync.destroy();
    };
  }, []);

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    showToast('Exited session safely. Your data remains stored locally.');
  };

  // Synchronize storage whenever transactions change
  const handleUpdateTransactions = useCallback((newItems: Transaction[], reason = 'Auto-save') => {
    setTransactions(newItems);
    const saveTime = saveTransactionsToStorage(newItems, reason);
    setLastAutoSave(saveTime);
  }, []);

  // Loans Storage & Mutations
  const handleUpdateLoans = useCallback((newLoans: LoanRecord[]) => {
    setLoans(newLoans);
    saveStoredLoans(newLoans);
  }, []);

  const handleAddLoan = (loanData: Omit<LoanRecord, 'id' | 'createdAt' | 'remainingAmount' | 'status' | 'payments'>) => {
    const newLoan: LoanRecord = {
      ...loanData,
      id: `loan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      remainingAmount: loanData.originalAmount,
      status: 'active',
      payments: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newLoan, ...loans];
    handleUpdateLoans(updated);
    firebaseSync.syncLoanUpsert(newLoan);
  };

  const handleEditLoan = (updatedLoan: LoanRecord) => {
    const updated = loans.map(l => l.id === updatedLoan.id ? updatedLoan : l);
    handleUpdateLoans(updated);
    firebaseSync.syncLoanUpsert(updatedLoan);
  };

  const handleDeleteLoan = (id: string) => {
    const updated = loans.filter(l => l.id !== id);
    handleUpdateLoans(updated);
    firebaseSync.syncLoanDelete(id);
    showToast('Loan record deleted.');
  };

  const handleClearAllLoans = () => {
    loans.forEach(l => firebaseSync.syncLoanDelete(l.id));
    handleUpdateLoans([]);
    showToast('All loan records cleared to ₱0.');
  };

  const handleRecordPayment = (loanId: string, paymentData: Omit<LoanPayment, 'id' | 'createdAt'>) => {
    const newPayment: LoanPayment = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    let updatedLoanRecord: LoanRecord | null = null;
    const updated = loans.map(loan => {
      if (loan.id !== loanId) return loan;
      const payments = [newPayment, ...loan.payments];
      const newRemaining = Math.max(0, loan.remainingAmount - paymentData.amount);
      const status = newRemaining <= 0 ? 'fully_paid' : 'partially_paid';
      updatedLoanRecord = {
        ...loan,
        payments,
        remainingAmount: newRemaining,
        status,
      };
      return updatedLoanRecord;
    });

    handleUpdateLoans(updated);
    if (updatedLoanRecord) {
      firebaseSync.syncLoanUpsert(updatedLoanRecord);
    }
    showToast('Loan payment recorded.');
  };

  // Save or Update Transaction
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      // Update existing
      let updatedTxObj: Transaction | null = null;
      const updated = transactions.map((t) => {
        if (t.id === existingId) {
          updatedTxObj = {
            ...t,
            ...txData,
            updatedAt: new Date().toISOString(),
          } as Transaction;
          return updatedTxObj;
        }
        return t;
      });
      handleUpdateTransactions(updated, `Updated transaction ${existingId}`);
      if (updatedTxObj) {
        firebaseSync.syncTransactionUpsert(updatedTxObj);
      }
      showToast(`Updated entry: ${txData.category} (₱${txData.amount.toLocaleString()})`);
    } else {
      // Create new
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newTx, ...transactions];
      handleUpdateTransactions(updated, `Added new ${txData.category} entry`);
      firebaseSync.syncTransactionUpsert(newTx);
      showToast(`Logged ${txData.category}: ₱${txData.amount.toLocaleString()}`);
    }

    setEditingTx(null);
  };

  // Delete Transaction (Direct, non-blocking)
  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    handleUpdateTransactions(updated, `Deleted transaction ${id}`);
    firebaseSync.syncTransactionDelete(id);
    showToast('Transaction entry deleted.');
  };

  // Delete All Transactions for a Specific Day (Direct, non-blocking)
  const handleDeleteDayTransactions = (dateStr: string, type?: TransactionType) => {
    const matching = transactions.filter((t) => t.date === dateStr && (!type || t.type === type));
    if (matching.length === 0) {
      showToast(`No ${type ? type : ''} records found for ${dateStr}.`);
      return;
    }

    const typeLabel = type === 'sales' ? 'sales' : type === 'expense' ? 'expense' : '';
    const labelText = typeLabel ? `${typeLabel} ` : '';
    const updated = transactions.filter((t) => !(t.date === dateStr && (!type || t.type === type)));
    handleUpdateTransactions(updated, `Deleted ${labelText}entries for ${dateStr}`);
    matching.forEach((t) => firebaseSync.syncTransactionDelete(t.id));
    showToast(`Deleted all ${matching.length} ${labelText}entries for ${dateStr}.`);
  };

  // Delete Multiple Transactions
  const handleDeleteMultipleTransactions = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const updated = transactions.filter((t) => !idSet.has(t.id));
    handleUpdateTransactions(updated, `Deleted ${ids.length} selected records`);
    ids.forEach((id) => firebaseSync.syncTransactionDelete(id));
    showToast(`Deleted ${ids.length} transaction record(s).`);
  };

  // Open Modal Helpers
  const handleOpenAddModal = (
    type: TransactionType = 'sales',
    category = 'Cash In',
    customDate?: string,
    isLocked = false
  ) => {
    setEditingTx(null);
    setModalInitialType(type);
    setModalInitialCategory(category);
    setIsModalCategoryLocked(isLocked);
    if (customDate) {
      setModalInitialDate(customDate);
    } else {
      setModalInitialDate(new Date().toISOString().split('T')[0]);
    }
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setIsAddModalOpen(true);
  };

  // Restore Transactions (Merge or Replace)
  const handleRestoreTransactions = (newItems: Transaction[], mergeMode: boolean) => {
    if (mergeMode) {
      // Avoid duplicate IDs
      const existingIds = new Set(transactions.map((t) => t.id));
      const filteredNew = newItems.filter((t) => !existingIds.has(t.id));
      const merged = [...transactions, ...filteredNew];
      handleUpdateTransactions(merged, 'Merged recovery file data');
      filteredNew.forEach((t) => firebaseSync.syncTransactionUpsert(t));
      showToast(`Merged ${filteredNew.length} recovery records!`);
    } else {
      handleUpdateTransactions(newItems, 'Restored recovery file data');
      newItems.forEach((t) => firebaseSync.syncTransactionUpsert(t));
      showToast(`Database restored with ${newItems.length} records!`);
    }
  };

  // Reset All Data across Transactions, Loans, and Cash Monitoring
  const handleResetData = () => {
    handleUpdateTransactions([], 'Cleared all data');
    handleUpdateLoans([]);
    saveCashMonitoringState(INITIAL_CASH_MONITORING_STATE);
    showToast('All records cleared! System reset to ₱0 so you can encode fresh.');
  };

  // Load Sample Data
  const handleLoadSampleData = () => {
    handleUpdateTransactions(INITIAL_SAMPLE_TRANSACTIONS, 'Loaded sample data');
    showToast('Sample sales & expense data loaded!');
  };

  const handleExportBackup = () => {
    exportRecoveryFile(transactions);
    showToast('JSON recovery backup exported!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Suite Header for 1-click App Toggle */}
      <AppSuiteHeader
        activeApp={activeApp}
        setActiveApp={handleSwitchApp}
        onExitApp={() => setIsExitModalOpen(true)}
      />

      {/* Render Fish Harvest Monitor App */}
      {activeApp === 'harvest-monitoring' && <FishHarvestApp />}

      {/* Render Daily Sales & Expense Tracker App */}
      {activeApp === 'daily-tracker' && (
        <>
          {/* Navigation Header */}
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            lastAutoSave={lastAutoSave}
            totalRecordsCount={transactions.length}
            onQuickAddClick={() => handleOpenAddModal('sales', 'Cash In')}
            onExportBackup={handleExportBackup}
          />

          {/* Main Container */}
          <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
              {/* Vertical Navigation Sidebar / Block */}
              <aside className="w-full lg:w-64 xl:w-72 shrink-0">
                <VerticalNav activeTab={activeTab} setActiveTab={setActiveTab} />
              </aside>

              {/* View Content Area */}
              <main className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6">
                {activeTab === 'cash-monitoring' && (
                  <CashMonitoringView
                    transactions={transactions}
                    loans={loans}
                    onNavigateToLoans={() => setActiveTab('loans')}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'loans' && (
                  <LoansView
                    loans={loans}
                    onAddLoan={handleAddLoan}
                    onEditLoan={handleEditLoan}
                    onDeleteLoan={handleDeleteLoan}
                    onRecordPayment={handleRecordPayment}
                    onClearAllLoans={handleClearAllLoans}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'credits' && (
                  <CreditMonitoringView
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'sales' && (

                  <SalesView
                    transactions={transactions}
                    onOpenAddModal={handleOpenAddModal}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onDeleteDayTransactions={handleDeleteDayTransactions}
                  />
                )}

                {activeTab === 'expenses' && (
                  <ExpensesView
                    transactions={transactions}
                    onOpenAddModal={handleOpenAddModal}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onDeleteDayTransactions={handleDeleteDayTransactions}
                  />
                )}

                {activeTab === 'soa' && (
                  <MonthlySoaView
                    transactions={transactions}
                    loans={loans}
                  />
                )}

                {activeTab === 'search' && (
                  <DeepSearch
                    transactions={transactions}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onDeleteMultipleTransactions={handleDeleteMultipleTransactions}
                  />
                )}

                {activeTab === 'recovery' && (
                  <RecoveryTab
                    transactions={transactions}
                    lastAutoSave={lastAutoSave}
                    onRestoreTransactions={handleRestoreTransactions}
                    onResetData={handleResetData}
                    onLoadSampleData={handleLoadSampleData}
                  />
                )}
              </main>
            </div>
          </div>

          {/* Add / Edit Modal */}
          <AddTransactionModal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingTx(null);
              setIsModalCategoryLocked(false);
            }}
            onSave={handleSaveTransaction}
            initialType={modalInitialType}
            initialCategory={modalInitialCategory}
            initialDate={modalInitialDate}
            editingTransaction={editingTx}
            isCategoryLocked={isModalCategoryLocked}
          />

          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-700 dark:border-slate-200 animate-slide-up">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Clean Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Daily Sales & Expense Tracker • Cash In, Cash Out, Billing, Load & Expenses</span>
              <span>Auto-Save Enabled • Portable JSON Recovery File Supported</span>
            </div>
          </footer>
        </>
      )}

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
      />
    </div>
  );
}
