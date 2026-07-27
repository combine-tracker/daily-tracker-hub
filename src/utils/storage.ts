import { Transaction, BackupSnapshot, BackupFileStructure, CashMonitoringState, LoanRecord, CreditAccount } from '../types';
import { STORAGE_KEY_TRANSACTIONS, STORAGE_KEY_SNAPSHOTS, STORAGE_KEY_LAST_AUTOSAVE, STORAGE_KEY_CASH_MONITORING, STORAGE_KEY_LOANS, STORAGE_KEY_CREDITS, INITIAL_SAMPLE_TRANSACTIONS, INITIAL_CASH_MONITORING_STATE, INITIAL_SAMPLE_LOANS, INITIAL_DEFAULT_CREDIT_ACCOUNTS } from '../constants';

export function loadStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (!raw) {
      saveTransactionsToStorage([], 'Initial setup');
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse transactions from localStorage', err);
    return [];
  }
}

export function saveTransactionsToStorage(transactions: Transaction[], reason = 'Auto-save'): string {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    const nowISO = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_LAST_AUTOSAVE, nowISO);

    // Save automatic backup snapshot if significant or periodic
    createAutoSnapshot(transactions, reason);
    return nowISO;
  } catch (err) {
    console.error('Failed to save transactions to localStorage', err);
    return new Date().toISOString();
  }
}

export function getLastAutoSaveTime(): string | null {
  return localStorage.getItem(STORAGE_KEY_LAST_AUTOSAVE);
}

// Cash Monitoring Storage Helpers
export function loadCashMonitoringState(): CashMonitoringState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CASH_MONITORING);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CASH_MONITORING, JSON.stringify(INITIAL_CASH_MONITORING_STATE));
      return INITIAL_CASH_MONITORING_STATE;
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_CASH_MONITORING_STATE,
      ...parsed,
      balances: {
        ...INITIAL_CASH_MONITORING_STATE.balances,
        ...(parsed.balances || {}),
      },
    };
  } catch (err) {
    console.error('Failed to load cash monitoring state', err);
    return INITIAL_CASH_MONITORING_STATE;
  }
}

export function saveCashMonitoringState(state: CashMonitoringState): void {
  try {
    const toSave = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_CASH_MONITORING, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save cash monitoring state', err);
  }
}

// Loans Storage Helpers
export function loadStoredLoans(): LoanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(INITIAL_SAMPLE_LOANS));
      return INITIAL_SAMPLE_LOANS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_LOANS;
  } catch (err) {
    console.error('Failed to load loans from localStorage', err);
    return INITIAL_SAMPLE_LOANS;
  }
}

export function saveStoredLoans(loans: LoanRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
  } catch (err) {
    console.error('Failed to save loans to localStorage', err);
  }
}

// Credit Lines Storage Helpers
export function loadStoredCreditAccounts(): CreditAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(INITIAL_DEFAULT_CREDIT_ACCOUNTS));
      return INITIAL_DEFAULT_CREDIT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEFAULT_CREDIT_ACCOUNTS;
  } catch (err) {
    console.error('Failed to load credit accounts from localStorage', err);
    return INITIAL_DEFAULT_CREDIT_ACCOUNTS;
  }
}

export function saveStoredCreditAccounts(accounts: CreditAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save credit accounts to localStorage', err);
  }
}


// Snapshot system for auto-recovery points
export function getAutoSnapshots(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load snapshots', err);
    return [];
  }
}

export function deleteAutoSnapshot(snapshotId: string): BackupSnapshot[] {
  try {
    const snapshots = getAutoSnapshots();
    const updated = snapshots.filter(s => s.id !== snapshotId);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete snapshot', err);
    return getAutoSnapshots();
  }
}

export function keepOnlyLatestSnapshot(): BackupSnapshot[] {
  try {
    const snapshots = getAutoSnapshots();
    const updated = snapshots.slice(0, 1);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to trim snapshots', err);
    return getAutoSnapshots();
  }
}

export function clearAllSnapshots(): BackupSnapshot[] {
  try {
    localStorage.removeItem(STORAGE_KEY_SNAPSHOTS);
    return [];
  } catch (err) {
    console.error('Failed to clear snapshots', err);
    return [];
  }
}

export function createAutoSnapshot(transactions: Transaction[], reason: string): void {
  try {
    const snapshots = getAutoSnapshots();
    const newSnapshot: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      version: '1.0',
      itemCount: transactions.length,
      data: transactions,
    };

    // Keep top 8 latest snapshots
    const updated = [newSnapshot, ...snapshots.filter(s => s.itemCount !== transactions.length || Math.abs(new Date(s.timestamp).getTime() - Date.now()) > 60000)].slice(0, 8);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to create snapshot', err);
  }
}

// Export Recovery File as JSON
export function exportRecoveryFile(transactions: Transaction[]): void {
  const fileData: BackupFileStructure = {
    app: 'Daily Sales & Expense Tracker',
    version: '1.0',
    exportDate: new Date().toISOString(),
    totalTransactions: transactions.length,
    transactions,
  };

  const jsonStr = JSON.stringify(fileData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `Daily_Tracker_Recovery_File_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import & Validate Recovery File JSON
export function parseRecoveryFile(jsonText: string): { success: boolean; data?: Transaction[]; error?: string; metadata?: Partial<BackupFileStructure> } {
  try {
    const parsed = JSON.parse(jsonText);
    let items: Transaction[] = [];

    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.transactions)) {
      items = parsed.transactions;
    } else {
      return { success: false, error: 'Invalid file format: JSON must contain a transactions array.' };
    }

    // Validate transaction structure
    const isValid = items.every(item =>
      item &&
      typeof item.id === 'string' &&
      typeof item.date === 'string' &&
      typeof item.type === 'string' &&
      typeof item.category === 'string' &&
      typeof item.amount === 'number'
    );

    if (!isValid) {
      return { success: false, error: 'File contains corrupted or improperly formatted transaction items.' };
    }

    return {
      success: true,
      data: items,
      metadata: {
        app: parsed.app || 'Backup File',
        exportDate: parsed.exportDate || new Date().toISOString(),
        totalTransactions: items.length,
      },
    };
  } catch (err) {
    return { success: false, error: 'Failed to parse JSON file. Please make sure it is a valid JSON recovery file.' };
  }
}

// Helper to export transactions as CSV
export function exportToCSV(transactions: Transaction[], filenamePrefix = 'daily_tracker_export'): void {
  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Description', 'Time', 'Created At'];
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type}"`,
    `"${t.category}"`,
    t.amount,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${t.time || ''}"`,
    `"${t.createdAt || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}
