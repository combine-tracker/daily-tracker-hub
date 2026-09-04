import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle2, Trash2, RotateCcw, Smartphone, ShieldCheck, HardDrive, Wifi } from 'lucide-react';
import { Transaction } from '../types';
import { exportRecoveryFile, parseRecoveryFile } from '../utils/storage';

interface RecoveryTabProps {
  transactions: Transaction[];
  lastAutoSave: string | null;
  onRestoreTransactions: (newTransactions: Transaction[], mergeMode: boolean) => void;
  onResetData: () => void;
  onLoadSampleData: () => void;
}

export const RecoveryTab: React.FC<RecoveryTabProps> = ({
  transactions,
  lastAutoSave,
  onRestoreTransactions,
  onResetData,
  onLoadSampleData,
}) => {
  const [backupText, setBackupText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Generate Dump button
  const handleGenerateDump = async () => {
    setImportError(null);
    const dumpObject = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      itemCount: transactions.length,
      transactions: transactions,
    };
    const jsonString = JSON.stringify(dumpObject, null, 2);
    setBackupText(jsonString);

    // Download backup file (uses static daily-tracker-backup.json to overwrite/replace existing backup file)
    await exportRecoveryFile(transactions);
    setSuccessMessage(`Generated dump with ${transactions.length} transactions! Backup saved as daily-tracker-backup.json.`);
  };

  // Handle Inject / Restore State button
  const handleInjectState = () => {
    setImportError(null);
    setSuccessMessage(null);

    if (!backupText.trim()) {
      setImportError('Please paste a valid JSON backup dump into the box above or click "Generate Dump".');
      return;
    }

    const res = parseRecoveryFile(backupText);
    if (res.success && res.data) {
      if (window.confirm(`Restore ${res.data.length} transactions from the backup dump? This will replace current dataset.`)) {
        onRestoreTransactions(res.data, false);
        setSuccessMessage(`Successfully injected state and restored ${res.data.length} transactions!`);
      }
    } else {
      setImportError(res.error || 'Failed to parse JSON backup dump. Please verify text formatting.');
    }
  };

  // Handle File Upload into Textarea / State
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBackupText(content);
      const res = parseRecoveryFile(content);
      if (res.success && res.data) {
        setSuccessMessage(`Loaded ${res.data.length} transactions from file into the text dump box! Click "INJECT / RESTORE STATE" to apply.`);
      } else {
        setImportError(res.error || 'Failed to read recovery file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all transactions from browser storage? Make sure you generated a dump first.')) {
      onResetData();
      setBackupText('');
      setSuccessMessage('All data cleared successfully.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-600 dark:text-indigo-400">
          <RotateCcw className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            System Recovery & Backup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auto-save indicator, raw JSON dump tools, and manual state injection.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {importError && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-semibold animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Main Recovery Card matching user requirements */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* "How this works" explanation box updated according to user request */}
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm space-y-2.5">
          <h3 className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-2 text-sm">
            How this works:
          </h3>
          <ul className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">• Auto-Save ON —</span>
              <span>Your data is automatically saved directly to device storage (LocalStorage) on your mobile phone or computer in real-time. It survives closing the app, restarting your device, or launching from your Home Screen shortcut.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">• Generate Dump —</span>
              <span>Create a manual text JSON backup file (<code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">daily-tracker-backup.json</code>). Re-generating will replace/overwrite your previous backup file.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">• Inject State —</span>
              <span>Paste or upload a previously saved dump to restore everything into browser storage.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">• Clear Data —</span>
              <span>Removes all saved data from browser storage and resets everything.</span>
            </li>
          </ul>
        </div>

        {/* Textarea Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              BACKUP / RESTORE JSON
            </label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Load file into box</span>
            </button>
          </div>

          <textarea
            value={backupText}
            onChange={(e) => setBackupText(e.target.value)}
            placeholder="Click 'Generate Dump' to see your backup data, or paste a previous backup here to restore..."
            rows={8}
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
          />
        </div>

        {/* 3 Prominent Action Buttons matching screenshot design */}
        <div className="space-y-3 pt-2">
          {/* Button 1: GENERATE BACKUP DUMP */}
          <button
            type="button"
            onClick={handleGenerateDump}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>GENERATE BACKUP DUMP</span>
          </button>

          {/* Button 2: INJECT / RESTORE STATE */}
          <button
            type="button"
            onClick={handleInjectState}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>INJECT / RESTORE STATE</span>
          </button>

          {/* Button 3: CLEAR ALL DATA */}
          <button
            type="button"
            onClick={handleClearAllData}
            className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>CLEAR ALL DATA</span>
          </button>
        </div>

      </div>

      {/* PWA & Offline Details Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              PWA & Offline System Details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Progressive Web App specifications and offline storage status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-semibold block">Service Worker</span>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Registered (/sw.js)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-semibold block">Persistence Mode</span>
            <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 text-sm">
              <HardDrive className="w-4 h-4" />
              100% LocalStorage
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-semibold block">Network Status</span>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
              <Wifi className="w-4 h-4" />
              Offline Capable
            </div>
          </div>
        </div>
      </div>

      {/* Quick Utility */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            Sample Data Utility
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Reset dataset to initial rich sample data for testing purposes.
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadSampleData}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          Load Sample Data
        </button>
      </div>

    </div>
  );
};
