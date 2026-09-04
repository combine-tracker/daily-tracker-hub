import React from 'react';
import { TrendingUp, TrendingDown, LayoutDashboard, Search, Database, PlusCircle, Scale, Wallet, HandCoins, LogOut, Sun, Moon, Bell } from 'lucide-react';
import { CloudSyncStatus } from './CloudSyncStatus';

export type TabType = 'cash-monitoring' | 'loans' | 'credits' | 'subscriptions' | 'sales' | 'expenses' | 'soa' | 'search' | 'recovery';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lastAutoSave: string | null;
  totalRecordsCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onQuickAddClick: () => void;
  onExportBackup?: () => void;
  onExitApp?: () => void;
  dueCount?: number;
  onOpenNotificationCenter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lastAutoSave,
  totalRecordsCount,
  theme = 'light',
  onToggleTheme,
  onQuickAddClick,
  onExportBackup,
  onExitApp,
  dueCount = 0,
  onOpenNotificationCenter,
}) => {
  const formattedSaveTime = lastAutoSave
    ? new Date(lastAutoSave).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-3 gap-2">
          
          {/* App Branding & Auto-save Status */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-base sm:text-lg">
                ₱
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                  Daily Tracker
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Saved at {formattedSaveTime} ({totalRecordsCount} records)
                </p>
              </div>
            </div>

            {/* Notification Bell & Theme Toggle on mobile right next to branding */}
            <div className="flex sm:hidden items-center gap-1.5">
              {onOpenNotificationCenter && (
                <button
                  type="button"
                  onClick={onOpenNotificationCenter}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer relative"
                  title="Notifications & Due Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {dueCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                      {dueCount}
                    </span>
                  )}
                </button>
              )}

              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions & Local Status */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
            <CloudSyncStatus />

            <div className="flex items-center gap-1.5">
              {/* Notification Center Bell (Desktop) */}
              {onOpenNotificationCenter && (
                <button
                  type="button"
                  onClick={onOpenNotificationCenter}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-xs font-semibold transition-all cursor-pointer relative"
                  title="Notifications & Due Alerts"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Alerts</span>
                  {dueCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                      {dueCount}
                    </span>
                  )}
                </button>
              )}

              {/* Desktop Theme Switcher Button */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onQuickAddClick}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>+ Log Tx</span>
              </button>

              {onExitApp && (
                <button
                  type="button"
                  onClick={onExitApp}
                  className="px-2.5 py-1.5 sm:py-2 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/80 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="Exit application"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};


