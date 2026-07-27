import React from 'react';
import { Calculator, Fish, Sparkles, Layers, LogOut } from 'lucide-react';

export type AppModule = 'daily-tracker' | 'harvest-monitoring';

interface AppSuiteHeaderProps {
  activeApp: AppModule;
  setActiveApp: (app: AppModule) => void;
  onExitApp?: () => void;
}

export function AppSuiteHeader({ activeApp, setActiveApp, onExitApp }: AppSuiteHeaderProps) {
  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-black tracking-wider text-slate-200 uppercase hidden xs:inline">
            Business Hub
          </span>
        </div>

        {/* The Main 2-App Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveApp('daily-tracker')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeApp === 'daily-tracker'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-4 h-4 text-indigo-300" />
            <span>Daily Tracker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveApp('harvest-monitoring')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeApp === 'harvest-monitoring'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Fish className="w-4 h-4 text-emerald-300" />
            <span>Harvest Monitoring</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] text-slate-400 font-medium hidden md:flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Saved</span>
          </div>

          {onExitApp && (
            <button
              type="button"
              onClick={onExitApp}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exit application"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit App</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
