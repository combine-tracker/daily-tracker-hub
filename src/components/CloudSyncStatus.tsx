import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { firebaseSync, SyncStatus } from '../services/firebaseSync';

export const CloudSyncStatus: React.FC = () => {
  const [{ status, isOnline }, setSyncInfo] = useState(firebaseSync.getStatus());
  const [isSyncingManual, setIsSyncingManual] = useState(false);

  useEffect(() => {
    const unsub = firebaseSync.subscribeStatus((st, online) => {
      setSyncInfo({ status: st, isOnline: online });
    });
    return () => unsub();
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    setIsSyncingManual(true);
    try {
      await firebaseSync.flushPendingQueue();
      await firebaseSync.runFullSync();
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSyncingManual(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
      {!isOnline ? (
        <>
          <CloudOff className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium text-amber-700 dark:text-amber-400">Offline (Local Saved)</span>
        </>
      ) : status === 'syncing' || isSyncingManual ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          <span className="font-medium text-indigo-600 dark:text-indigo-400">Cloud Syncing...</span>
        </>
      ) : status === 'error' ? (
        <>
          <Cloud className="w-3.5 h-3.5 text-rose-500" />
          <span className="font-medium text-rose-600 dark:text-rose-400">Sync Warning</span>
          <button
            onClick={handleManualSync}
            className="ml-1 text-[10px] underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-medium text-slate-700 dark:text-slate-200">Cloud Backup Active</span>
          <button
            onClick={handleManualSync}
            title="Sync latest cloud changes now"
            className="ml-1 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
};
