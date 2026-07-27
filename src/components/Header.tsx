import React from 'react';
import { TrendingUp, TrendingDown, LayoutDashboard, Search, Database, PlusCircle, Scale, Wallet, HandCoins } from 'lucide-react';
import { CloudSyncStatus } from './CloudSyncStatus';

export type TabType = 'cash-monitoring' | 'loans' | 'credits' | 'sales' | 'expenses' | 'soa' | 'search' | 'recovery';


interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lastAutoSave: string | null;
  totalRecordsCount: number;
  onQuickAddClick: () => void;
  onExportBackup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lastAutoSave,
  totalRecordsCount,
  onQuickAddClick,
  onExportBackup,
}) => {
  const formattedSaveTime = lastAutoSave
    ? new Date(lastAutoSave).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          
          {/* App Branding & Auto-save Status */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-semibold text-lg">
                ₱
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Daily Tracker
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                    Sales & Expenses
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Saved at {formattedSaveTime} ({totalRecordsCount} records)
                </p>
              </div>
            </div>

            {/* Quick Actions & Sync Status */}
            <div className="flex items-center gap-2.5">
              <CloudSyncStatus />
              <button
                onClick={onQuickAddClick}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Log Transaction</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};


