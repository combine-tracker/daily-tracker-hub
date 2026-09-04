import React, { useState } from 'react';
import {
  Scale,
  HandCoins,
  CreditCard,
  Tv,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  FileText,
  Search,
  Database,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';

import { TabType } from './Header';

interface VerticalNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

interface TabOption {
  id: TabType;
  label: string;
  badge?: string;
  icon: React.ElementType;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  badgeBg: string;
  badgeText: string;
}

const TAB_OPTIONS: TabOption[] = [
  {
    id: 'search',
    label: 'Deep Search',
    badge: 'Search',
    icon: Search,
    activeBg: 'bg-indigo-600 dark:bg-indigo-600',
    activeText: 'text-white',
    activeBorder: 'border-indigo-500',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    badgeText: 'text-indigo-800 dark:text-indigo-200',
  },
  {
    id: 'cash-monitoring',
    label: 'Cash Monitoring',
    badge: 'Balance',
    icon: Scale,
    activeBg: 'bg-indigo-600 dark:bg-indigo-600',
    activeText: 'text-white',
    activeBorder: 'border-indigo-500',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    badgeText: 'text-indigo-800 dark:text-indigo-200',
  },
  {
    id: 'sales',
    label: 'Sales',
    badge: 'Cash In',
    icon: TrendingUp,
    activeBg: 'bg-emerald-600 dark:bg-emerald-600',
    activeText: 'text-white',
    activeBorder: 'border-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    badge: 'Cash Out',
    icon: TrendingDown,
    activeBg: 'bg-rose-600 dark:bg-rose-600',
    activeText: 'text-white',
    activeBorder: 'border-rose-500',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60',
    badgeText: 'text-rose-800 dark:text-rose-200',
  },
  {
    id: 'loans',
    label: 'Loans',
    badge: 'Utang',
    icon: HandCoins,
    activeBg: 'bg-amber-600 dark:bg-amber-600',
    activeText: 'text-white',
    activeBorder: 'border-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
    badgeText: 'text-amber-800 dark:text-amber-200',
  },
  {
    id: 'credits',
    label: 'Credit Line',
    badge: 'Credits',
    icon: CreditCard,
    activeBg: 'bg-purple-600 dark:bg-purple-600',
    activeText: 'text-white',
    activeBorder: 'border-purple-500',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60',
    badgeText: 'text-purple-800 dark:text-purple-200',
  },
  {
    id: 'subscriptions',
    label: 'Digital Subscriptions',
    badge: 'Subs',
    icon: Tv,
    activeBg: 'bg-pink-600 dark:bg-pink-600',
    activeText: 'text-white',
    activeBorder: 'border-pink-500',
    badgeBg: 'bg-pink-100 dark:bg-pink-900/60',
    badgeText: 'text-pink-800 dark:text-pink-200',
  },
  {
    id: 'soa',
    label: 'Monthly SOA Statement',
    badge: 'SOA',
    icon: FileText,
    activeBg: 'bg-indigo-600 dark:bg-indigo-600',
    activeText: 'text-white',
    activeBorder: 'border-indigo-500',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    badgeText: 'text-indigo-800 dark:text-indigo-200',
  },
  {
    id: 'recovery',
    label: 'Recovery File',
    badge: 'Backup',
    icon: Database,
    activeBg: 'bg-indigo-600 dark:bg-indigo-600',
    activeText: 'text-white',
    activeBorder: 'border-indigo-500',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
    badgeText: 'text-indigo-800 dark:text-indigo-200',
  },
];

export const VerticalNav: React.FC<VerticalNavProps> = ({ activeTab, setActiveTab }) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const activeOption = TAB_OPTIONS.find((t) => t.id === activeTab) || TAB_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  const handleSelectTab = (id: TabType) => {
    setActiveTab(id);
    setIsMobileExpanded(false); // Collapse mobile menu after selecting a tab
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md p-2 sm:p-3 transition-all">
      {/* Mobile Bar Header (Visible on small screens) */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-lg ${activeOption.activeBg} text-white shadow-xs shrink-0`}>
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Active View
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate block">
                {activeOption.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
              Vertical Tabs ({TAB_OPTIONS.length})
            </span>
            {isMobileExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </button>
      </div>

      {/* Vertical Navigation List */}
      <div
        className={`${
          isMobileExpanded ? 'block mt-2 max-h-[70vh] overflow-y-auto pr-1' : 'hidden'
        } lg:block space-y-1`}
      >
        <div className="hidden lg:flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            Navigation Menu
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold">
            Vertical Style
          </span>
        </div>

        <nav className="space-y-1">
          {TAB_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = activeTab === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectTab(option.id)}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer group ${
                  isActive
                    ? `${option.activeBg} ${option.activeText} shadow-sm scale-[1.01]`
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-bold truncate ${
                      isActive ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {option.label}
                  </span>
                </div>

                {option.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                      isActive
                        ? 'bg-white/20 text-white border border-white/30'
                        : `${option.badgeBg} ${option.badgeText}`
                    }`}
                  >
                    {option.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
