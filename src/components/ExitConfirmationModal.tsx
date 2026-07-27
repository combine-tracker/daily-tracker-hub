import React from 'react';
import { LogOut, ShieldCheck, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6 relative overflow-hidden animate-scale-up">
        {/* Background glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header with Close X */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Exit Application?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Confirm before closing or leaving
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Message */}
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            You pressed back on the main dashboard. Are you sure you want to leave the application?
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-white block">
                Data Security Guaranteed
              </span>
              <span className="text-slate-500 dark:text-slate-400 block">
                All sales, expenses, and loan entries are automatically saved on your device.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Stay in App</span>
          </button>

          <button
            type="button"
            onClick={onConfirmExit}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
