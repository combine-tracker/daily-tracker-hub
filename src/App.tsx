import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header, TabType } from './components/Header';
import { VerticalNav } from './components/VerticalNav';
import { CashMonitoringView } from './components/CashMonitoringView';
import { LoansView } from './components/LoansView';
import { CreditMonitoringView } from './components/CreditMonitoringView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { SalesView } from './components/SalesView';

import { ExpensesView } from './components/ExpensesView';
import { MonthlySoaView } from './components/MonthlySoaView';
import { DeepSearch } from './components/DeepSearch';
import { RecoveryTab } from './components/RecoveryTab';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ExitConfirmationModal } from './components/ExitConfirmationModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { Transaction, TransactionType, LoanRecord, LoanPayment, CashMonitoringState, SubscriptionItem, CreditAccount } from './types';
import {
  loadStoredTransactions,
  saveTransactionsToStorage,
  getLastAutoSaveTime,
  loadStoredLoans,
  saveStoredLoans,
  loadStoredSubscriptions,
  loadStoredCreditAccounts,
  saveCashMonitoringState,
  exportRecoveryFile,
  AUTO_CONSOLIDATING_CATEGORIES,
  consolidateAutoCategories,
  getCanonicalCategory,
} from './utils/storage';
import { checkAndTriggerDueNotifications, getAllDueItems } from './utils/notifications';
import { INITIAL_SAMPLE_TRANSACTIONS, INITIAL_CASH_MONITORING_STATE } from './constants';
import { firebaseSync } from './services/firebaseSync';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Dark/Light Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Main state
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStoredTransactions());
  const [loans, setLoans] = useState<LoanRecord[]>(() => loadStoredLoans());
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => loadStoredSubscriptions());
  const [credits, setCredits] = useState<CreditAccount[]>(() => loadStoredCreditAccounts());
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(() => getLastAutoSaveTime());

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('sales');
  const [modalInitialCategory, setModalInitialCategory] = useState<string>('Cash In');
  const [modalInitialDate, setModalInitialDate] = useState<string>(selectedDate);
  const [isModalCategoryLocked, setIsModalCategoryLocked] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Calculate Due Notification items count
  const dueItems = useMemo(() => {
    return getAllDueItems(subscriptions, credits, loans);
  }, [subscriptions, credits, loans]);

  // Automatic Background Check & Push Trigger for Subscriptions & Credit Lines
  useEffect(() => {
    const timer = setTimeout(() => {
      const sentAlerts = checkAndTriggerDueNotifications();
      if (sentAlerts > 0) {
        showToast(`🔔 ${sentAlerts} push notification alert${sentAlerts > 1 ? 's' : ''} sent for upcoming dues!`);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [subscriptions, credits, loans]);

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
    window.history.pushState({ app: 'store-app', tab: activeTab }, '');

    const handlePopState = () => {
      // Re-push history state so the browser stays inside the app container unless confirmed
      window.history.pushState({ app: 'store-app', tab: activeTab }, '');

      // 1. If Add/Edit Modal is open, close modal
      if (isAddModalOpen) {
        setIsAddModalOpen(false);
        setEditingTx(null);
        return;
      }

      // 2. If Notification Center Modal is open, close modal
      if (isNotifCenterOpen) {
        setIsNotifCenterOpen(false);
        return;
      }

      // 3. If Exit Modal is open and back is pressed, close the modal (Stay in App)
      if (isExitModalOpen) {
        setIsExitModalOpen(false);
        return;
      }

      // 4. Check if currently on the main dashboard (Sales Tab)
      const isMainDashboard = activeTab === 'sales';

      if (!isMainDashboard) {
        // First back press (when on sub-tab): Redirect back to Sales Dashboard
        setActiveTab('sales');
        showToast('Returned to Sales Dashboard');
      } else {
        // Back press on Sales Dashboard: Show Exit Confirmation Modal asking if user wants to leave or stay
        setIsExitModalOpen(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, isAddModalOpen, isNotifCenterOpen, isExitModalOpen]);

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
        setTransactions(consolidateAutoCategories(updatedTxs).consolidated);
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
    showToast('Exited session safely. Data is stored locally.');
    setTimeout(() => {
      try {
        window.close();
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && window.history) {
        window.history.go(-2);
      }
    }, 150);
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

  // Claim an Unclaimed Cash Out transaction
  const handleClaimCashOut = (id: string, customerName: string) => {
    let claimedTx: Transaction | null = null;
    const updated = transactions.map((t) => {
      if (t.id === id) {
        claimedTx = {
          ...t,
          customerName: customerName.trim(),
          status: 'CLAIMED',
          updatedAt: new Date().toISOString(),
        };
        return claimedTx;
      }
      return t;
    });

    handleUpdateTransactions(updated, `Claimed Cash Out ${id}`);
    if (claimedTx) {
      firebaseSync.syncTransactionUpsert(claimedTx);
    }
    showToast(`Cash-out claimed for ${customerName.trim()}!`);
  };

  // Save or Update Transaction
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    // 1. Process Status for Cash Out Category
    let finalTxData = { ...txData };
    if (finalTxData.category === 'Cash Out') {
      const isClaimed = !!(finalTxData.customerName && finalTxData.customerName.trim());
      finalTxData.status = isClaimed ? 'CLAIMED' : 'UNCLAIMED';
    }

    if (existingId) {
      // Update existing
      let updatedTxObj: Transaction | null = null;
      const updated = transactions.map((t) => {
        if (t.id === existingId) {
          updatedTxObj = {
            ...t,
            ...finalTxData,
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
      showToast(`Updated entry: ${finalTxData.category} (₱${finalTxData.amount.toLocaleString()})`);
    } else {
      // Check if this category triggers Daily Auto-Consolidation
      const canonicalCat = getCanonicalCategory(finalTxData.category);
      const cleanDate = finalTxData.date.split('T')[0].trim();
      const isAutoConsolidateCategory = AUTO_CONSOLIDATING_CATEGORIES.has(canonicalCat);

      const normalizedTxData = {
        ...finalTxData,
        category: canonicalCat,
        date: cleanDate,
      };

      let existingConsolidated: Transaction | undefined;
      if (isAutoConsolidateCategory) {
        existingConsolidated = transactions.find(
          (t) =>
            t.date.split('T')[0].trim() === cleanDate &&
            t.type === normalizedTxData.type &&
            getCanonicalCategory(t.category) === canonicalCat
        );
      }

      if (existingConsolidated) {
        // Auto-consolidate into existing record for this date
        const newCount = (existingConsolidated.count || 1) + 1;
        const newAmount = Number(existingConsolidated.amount || 0) + Number(normalizedTxData.amount || 0);
        const defaultDesc = `${canonicalCat} Entry`;

        let newDescription = existingConsolidated.description || defaultDesc;
        if (
          normalizedTxData.description &&
          normalizedTxData.description !== defaultDesc &&
          !newDescription.includes(normalizedTxData.description)
        ) {
          if (newDescription && newDescription !== defaultDesc) {
            newDescription = `${newDescription}, ${normalizedTxData.description}`;
          } else {
            newDescription = normalizedTxData.description;
          }
        }

        const updatedTxObj: Transaction = {
          ...existingConsolidated,
          amount: newAmount,
          time: normalizedTxData.time || existingConsolidated.time,
          description: newDescription,
          count: newCount,
          updatedAt: new Date().toISOString(),
          customerName: normalizedTxData.customerName
            ? existingConsolidated.customerName && !existingConsolidated.customerName.includes(normalizedTxData.customerName)
              ? `${existingConsolidated.customerName}, ${normalizedTxData.customerName}`
              : normalizedTxData.customerName || existingConsolidated.customerName
            : existingConsolidated.customerName,
          referenceNumber: normalizedTxData.referenceNumber
            ? existingConsolidated.referenceNumber && !existingConsolidated.referenceNumber.includes(normalizedTxData.referenceNumber)
              ? `${existingConsolidated.referenceNumber}, ${normalizedTxData.referenceNumber}`
              : normalizedTxData.referenceNumber || existingConsolidated.referenceNumber
            : existingConsolidated.referenceNumber,
        };

        const updated = transactions.map((t) => (t.id === existingConsolidated!.id ? updatedTxObj : t));
        handleUpdateTransactions(updated, `Auto-consolidated ${canonicalCat} entry`);
        firebaseSync.syncTransactionUpsert(updatedTxObj);
        showToast(`Auto-consolidated ${canonicalCat}: total ₱${newAmount.toLocaleString()} (${newCount} logs aggregated)`);
      } else {
        // Create new transaction entry
        const newTx: Transaction = {
          ...normalizedTxData,
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          count: isAutoConsolidateCategory ? 1 : undefined,
          createdAt: new Date().toISOString(),
        };
        const updated = [newTx, ...transactions];
        handleUpdateTransactions(updated, `Added new ${canonicalCat} entry`);
        firebaseSync.syncTransactionUpsert(newTx);
        showToast(`Logged ${canonicalCat}: ₱${normalizedTxData.amount.toLocaleString()}`);
      }
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
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastAutoSave={lastAutoSave}
        totalRecordsCount={transactions.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onQuickAddClick={() => handleOpenAddModal('sales', 'Cash In')}
        onExportBackup={handleExportBackup}
        onExitApp={() => setIsExitModalOpen(true)}
        dueCount={dueItems.length}
        onOpenNotificationCenter={() => setIsNotifCenterOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
          {/* Vertical Navigation Sidebar / Block */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0 sticky top-[88px] sm:top-[60px] lg:top-[68px] z-20">
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
                onCreditsChange={setCredits}
              />
            )}

            {activeTab === 'subscriptions' && (
              <SubscriptionsView
                onShowToast={showToast}
                onSubscriptionsChange={setSubscriptions}
              />
            )}

            {activeTab === 'sales' && (
              <SalesView
                transactions={transactions}
                onOpenAddModal={handleOpenAddModal}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteDayTransactions={handleDeleteDayTransactions}
                onClaimCashOut={handleClaimCashOut}
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

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
      />

      {/* Push Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsNotifCenterOpen(false);
        }}
        subscriptions={subscriptions}
        credits={credits}
        loans={loans}
        showToast={showToast}
      />
    </div>
  );
}
