import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { Transaction, LoanRecord } from '../types';
import {
  loadStoredTransactions,
  saveTransactionsToStorage,
  loadStoredLoans,
  saveStoredLoans,
} from '../utils/storage';

const QUEUE_STORAGE_KEY = 'firebase_pending_sync_queue_v1';

export interface PendingSyncOp {
  id: string;
  type: 'upsert' | 'delete';
  collectionName: 'transactions' | 'loans';
  docId: string;
  data?: any;
  timestamp: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

class FirebaseSyncService {
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncStatus: SyncStatus = navigator.onLine ? 'synced' : 'offline';
  private statusListeners: Array<(status: SyncStatus, isOnline: boolean) => void> = [];
  private unsubscribeTxs: Unsubscribe | null = null;
  private unsubscribeLoans: Unsubscribe | null = null;
  private onTransactionsUpdateCb: ((txs: Transaction[]) => void) | null = null;
  private onLoansUpdateCb: ((loans: LoanRecord[]) => void) | null = null;
  private isInitialSyncComplete: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public getStatus(): { status: SyncStatus; isOnline: boolean } {
    return { status: this.syncStatus, isOnline: this.isOnlineState };
  }

  public subscribeStatus(listener: (status: SyncStatus, isOnline: boolean) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.syncStatus, this.isOnlineState);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.statusListeners.forEach(l => l(this.syncStatus, this.isOnlineState));
  }

  private handleNetworkChange(online: boolean) {
    this.isOnlineState = online;
    if (online) {
      this.setStatus('syncing');
      this.flushPendingQueue().then(() => {
        this.runFullSync().then(() => {
          this.setStatus('synced');
        }).catch(err => {
          console.error('Failed sync after coming online:', err);
          this.setStatus('error');
        });
      });
    } else {
      this.setStatus('offline');
    }
  }

  // --- Queue Storage Helpers ---
  private getQueue(): PendingSyncOp[] {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: PendingSyncOp[]) {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('Failed to save pending sync queue:', err);
    }
  }

  private queueOp(op: Omit<PendingSyncOp, 'id' | 'timestamp'>) {
    const queue = this.getQueue();
    // Remove previous pending ops for the same docId and collection
    const filtered = queue.filter(q => !(q.collectionName === op.collectionName && q.docId === op.docId));
    const newOp: PendingSyncOp = {
      ...op,
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    filtered.push(newOp);
    this.saveQueue(filtered);
  }

  public async flushPendingQueue(): Promise<void> {
    if (!this.isOnlineState) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;

    try {
      const db = getDb();
      const batch = writeBatch(db);
      let opsCount = 0;

      for (const op of queue) {
        const docRef = doc(db, op.collectionName, op.docId);
        if (op.type === 'upsert' && op.data) {
          batch.set(docRef, op.data, { merge: true });
          opsCount++;
        } else if (op.type === 'delete') {
          batch.delete(docRef);
          opsCount++;
        }
      }

      if (opsCount > 0) {
        await batch.commit();
      }
      this.saveQueue([]);
    } catch (err) {
      console.error('Error flushing sync queue:', err);
    }
  }

  // --- Real-time Local & Firestore Operations ---

  public syncTransactionUpsert(tx: Transaction) {
    const nowISO = new Date().toISOString();
    const docData = {
      ...tx,
      updatedAt: (tx as any).updatedAt || nowISO,
    };

    if (this.isOnlineState) {
      const db = getDb();
      setDoc(doc(db, 'transactions', tx.id), docData, { merge: true }).catch(err => {
        console.warn('Failed direct firestore upsert for tx, queuing:', err);
        this.queueOp({ type: 'upsert', collectionName: 'transactions', docId: tx.id, data: docData });
      });
    } else {
      this.queueOp({ type: 'upsert', collectionName: 'transactions', docId: tx.id, data: docData });
    }
  }

  public syncTransactionDelete(txId: string) {
    if (this.isOnlineState) {
      const db = getDb();
      deleteDoc(doc(db, 'transactions', txId)).catch(err => {
        console.warn('Failed direct firestore delete for tx, queuing:', err);
        this.queueOp({ type: 'delete', collectionName: 'transactions', docId: txId });
      });
    } else {
      this.queueOp({ type: 'delete', collectionName: 'transactions', docId: txId });
    }
  }

  public syncLoanUpsert(loan: LoanRecord) {
    const nowISO = new Date().toISOString();
    const docData = {
      ...loan,
      updatedAt: (loan as any).updatedAt || nowISO,
    };

    if (this.isOnlineState) {
      const db = getDb();
      setDoc(doc(db, 'loans', loan.id), docData, { merge: true }).catch(err => {
        console.warn('Failed direct firestore upsert for loan, queuing:', err);
        this.queueOp({ type: 'upsert', collectionName: 'loans', docId: loan.id, data: docData });
      });
    } else {
      this.queueOp({ type: 'upsert', collectionName: 'loans', docId: loan.id, data: docData });
    }
  }

  public syncLoanDelete(loanId: string) {
    if (this.isOnlineState) {
      const db = getDb();
      deleteDoc(doc(db, 'loans', loanId)).catch(err => {
        console.warn('Failed direct firestore delete for loan, queuing:', err);
        this.queueOp({ type: 'delete', collectionName: 'loans', docId: loanId });
      });
    } else {
      this.queueOp({ type: 'delete', collectionName: 'loans', docId: loanId });
    }
  }

  // --- Initial Setup & Synchronization Engine ---

  public async init(
    onTransactionsUpdate: (txs: Transaction[]) => void,
    onLoansUpdate: (loans: LoanRecord[]) => void
  ): Promise<void> {
    this.onTransactionsUpdateCb = onTransactionsUpdate;
    this.onLoansUpdateCb = onLoansUpdate;

    if (!this.isOnlineState) {
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');

    try {
      await this.flushPendingQueue();
      await this.runFullSync();
      this.setupRealtimeListeners();
      this.setStatus('synced');
    } catch (err) {
      console.error('Initialization sync failed:', err);
      this.setStatus('error');
    }
  }

  public async runFullSync(): Promise<{ txs: Transaction[]; loans: LoanRecord[] }> {
    if (!this.isOnlineState) {
      return {
        txs: loadStoredTransactions(),
        loans: loadStoredLoans(),
      };
    }

    const db = getDb();

    // 1. Fetch Remote Transactions
    const txSnap = await getDocs(collection(db, 'transactions'));
    const remoteTxsMap = new Map<string, Transaction & { updatedAt?: string }>();
    txSnap.forEach(d => {
      remoteTxsMap.set(d.id, d.data() as Transaction & { updatedAt?: string });
    });

    // 2. Load Local Transactions
    const localTxs = loadStoredTransactions();
    const localTxsMap = new Map<string, Transaction & { updatedAt?: string }>();
    localTxs.forEach(t => localTxsMap.set(t.id, t));

    // 3. Bi-directional Merge for Transactions
    const mergedTxsMap = new Map<string, Transaction>();
    const txsToUpload: Transaction[] = [];

    // Process all local transactions
    localTxs.forEach(localTx => {
      const remoteTx = remoteTxsMap.get(localTx.id);
      if (!remoteTx) {
        // Record exists only in localStorage -> keep local & upload to Firestore
        mergedTxsMap.set(localTx.id, localTx);
        txsToUpload.push(localTx);
      } else {
        // Record exists in both -> compare timestamps
        const localTime = new Date((localTx as any).updatedAt || localTx.createdAt || 0).getTime();
        const remoteTime = new Date(remoteTx.updatedAt || remoteTx.createdAt || 0).getTime();

        if (localTime >= remoteTime) {
          mergedTxsMap.set(localTx.id, localTx);
          if (localTime > remoteTime) {
            txsToUpload.push(localTx);
          }
        } else {
          mergedTxsMap.set(localTx.id, remoteTx);
        }
      }
    });

    // Process transactions that exist only in Firestore
    remoteTxsMap.forEach((remoteTx, id) => {
      if (!localTxsMap.has(id)) {
        mergedTxsMap.set(id, remoteTx);
      }
    });

    const finalMergedTxs = Array.from(mergedTxsMap.values()).sort((a, b) => {
      return new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime();
    });

    // Save merged transactions back to localStorage
    saveTransactionsToStorage(finalMergedTxs, 'Cloud Sync Merge');
    if (this.onTransactionsUpdateCb) {
      this.onTransactionsUpdateCb(finalMergedTxs);
    }

    // Upload local-only / updated records to Firestore in batches
    if (txsToUpload.length > 0) {
      const batch = writeBatch(db);
      txsToUpload.forEach(tx => {
        const docRef = doc(db, 'transactions', tx.id);
        batch.set(docRef, { ...tx, updatedAt: (tx as any).updatedAt || new Date().toISOString() }, { merge: true });
      });
      await batch.commit().catch(e => console.warn('Batch upload txs failed:', e));
    }


    // 4. Fetch Remote Loans
    const loanSnap = await getDocs(collection(db, 'loans'));
    const remoteLoansMap = new Map<string, LoanRecord & { updatedAt?: string }>();
    loanSnap.forEach(d => {
      remoteLoansMap.set(d.id, d.data() as LoanRecord & { updatedAt?: string });
    });

    // 5. Load Local Loans
    const localLoans = loadStoredLoans();
    const localLoansMap = new Map<string, LoanRecord & { updatedAt?: string }>();
    localLoans.forEach(l => localLoansMap.set(l.id, l));

    // 6. Bi-directional Merge for Loans
    const mergedLoansMap = new Map<string, LoanRecord>();
    const loansToUpload: LoanRecord[] = [];

    localLoans.forEach(localLoan => {
      const remoteLoan = remoteLoansMap.get(localLoan.id);
      if (!remoteLoan) {
        mergedLoansMap.set(localLoan.id, localLoan);
        loansToUpload.push(localLoan);
      } else {
        const localTime = new Date((localLoan as any).updatedAt || localLoan.createdAt || 0).getTime();
        const remoteTime = new Date(remoteLoan.updatedAt || remoteLoan.createdAt || 0).getTime();

        if (localTime >= remoteTime) {
          mergedLoansMap.set(localLoan.id, localLoan);
          if (localTime > remoteTime) {
            loansToUpload.push(localLoan);
          }
        } else {
          mergedLoansMap.set(localLoan.id, remoteLoan);
        }
      }
    });

    remoteLoansMap.forEach((remoteLoan, id) => {
      if (!localLoansMap.has(id)) {
        mergedLoansMap.set(id, remoteLoan);
      }
    });

    const finalMergedLoans = Array.from(mergedLoansMap.values());
    saveStoredLoans(finalMergedLoans);
    if (this.onLoansUpdateCb) {
      this.onLoansUpdateCb(finalMergedLoans);
    }

    if (loansToUpload.length > 0) {
      const batch = writeBatch(db);
      loansToUpload.forEach(l => {
        const docRef = doc(db, 'loans', l.id);
        batch.set(docRef, { ...l, updatedAt: (l as any).updatedAt || new Date().toISOString() }, { merge: true });
      });
      await batch.commit().catch(e => console.warn('Batch upload loans failed:', e));
    }

    this.isInitialSyncComplete = true;
    return { txs: finalMergedTxs, loans: finalMergedLoans };
  }

  // --- Real-time Listeners for Multi-device Synchronization ---

  public setupRealtimeListeners() {
    if (!this.isOnlineState) return;

    const db = getDb();

    // Clean up existing listeners
    if (this.unsubscribeTxs) this.unsubscribeTxs();
    if (this.unsubscribeLoans) this.unsubscribeLoans();

    // 1. Transactions Listener
    this.unsubscribeTxs = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      if (!this.isInitialSyncComplete) return;

      let changed = false;
      const currentLocal = loadStoredTransactions();
      const localMap = new Map(currentLocal.map(t => [t.id, t]));

      snapshot.docChanges().forEach(change => {
        const remoteData = change.doc.data() as Transaction & { updatedAt?: string };
        const id = change.doc.id;

        if (change.type === 'added' || change.type === 'modified') {
          const localItem = localMap.get(id);
          if (!localItem) {
            localMap.set(id, remoteData);
            changed = true;
          } else {
            const localTime = new Date((localItem as any).updatedAt || localItem.createdAt || 0).getTime();
            const remoteTime = new Date(remoteData.updatedAt || remoteData.createdAt || 0).getTime();

            if (remoteTime > localTime) {
              localMap.set(id, remoteData);
              changed = true;
            }
          }
        } else if (change.type === 'removed') {
          if (localMap.has(id)) {
            localMap.delete(id);
            changed = true;
          }
        }
      });

      if (changed) {
        const updatedTxs = Array.from(localMap.values()).sort((a, b) => {
          return new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime();
        });
        saveTransactionsToStorage(updatedTxs, 'Realtime Cloud Sync');
        if (this.onTransactionsUpdateCb) {
          this.onTransactionsUpdateCb(updatedTxs);
        }
      }
    }, (err) => {
      console.warn('Realtime txs listener error:', err);
    });

    // 2. Loans Listener
    this.unsubscribeLoans = onSnapshot(collection(db, 'loans'), (snapshot) => {
      if (!this.isInitialSyncComplete) return;

      let changed = false;
      const currentLocal = loadStoredLoans();
      const localMap = new Map(currentLocal.map(l => [l.id, l]));

      snapshot.docChanges().forEach(change => {
        const remoteData = change.doc.data() as LoanRecord & { updatedAt?: string };
        const id = change.doc.id;

        if (change.type === 'added' || change.type === 'modified') {
          const localItem = localMap.get(id);
          if (!localItem) {
            localMap.set(id, remoteData);
            changed = true;
          } else {
            const localTime = new Date((localItem as any).updatedAt || localItem.createdAt || 0).getTime();
            const remoteTime = new Date(remoteData.updatedAt || remoteData.createdAt || 0).getTime();

            if (remoteTime > localTime) {
              localMap.set(id, remoteData);
              changed = true;
            }
          }
        } else if (change.type === 'removed') {
          if (localMap.has(id)) {
            localMap.delete(id);
            changed = true;
          }
        }
      });

      if (changed) {
        const updatedLoans = Array.from(localMap.values());
        saveStoredLoans(updatedLoans);
        if (this.onLoansUpdateCb) {
          this.onLoansUpdateCb(updatedLoans);
        }
      }
    }, (err) => {
      console.warn('Realtime loans listener error:', err);
    });
  }

  public destroy() {
    if (this.unsubscribeTxs) this.unsubscribeTxs();
    if (this.unsubscribeLoans) this.unsubscribeLoans();
  }
}

export const firebaseSync = new FirebaseSyncService();
