import React, { useEffect, useState } from 'react';
import { HardDrive, Wifi, WifiOff, Download, Smartphone, CheckCircle2, Info, X } from 'lucide-react';

export const CloudSyncStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [swRegistered, setSwRegistered] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check SW registration status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) setSwRegistered(true);
      });
    }

    // Check standalone PWA display mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowPwaModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
        <HardDrive className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="font-semibold hidden sm:inline text-emerald-700 dark:text-emerald-400">LocalStorage Active</span>
        <span className="font-semibold sm:hidden text-emerald-700 dark:text-emerald-400">Local</span>

        <span className="text-slate-300 dark:text-slate-600">|</span>

        {isOnline ? (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400" title="Online mode - all changes saved locally">
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span className="hidden md:inline">Online</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400" title="Offline mode - app works 100% uninterrupted">
            <WifiOff className="w-3 h-3 text-amber-500" />
            <span>Offline Ready</span>
          </span>
        )}

        <button
          type="button"
          onClick={() => setShowPwaModal(true)}
          className="ml-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
          title="View PWA & Offline Details"
        >
          <Smartphone className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>PWA Details</span>
        </button>

        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallPWA}
            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Install App as PWA"
          >
            <Download className="w-3 h-3" />
            <span>Install App</span>
          </button>
        )}
      </div>

      {/* PWA Details Modal */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowPwaModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">PWA & Offline Info</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Progressive Web Application Details</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Service Worker Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active (/sw.js)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Offline Storage:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    LocalStorage Enabled
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">App Display Mode:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isStandalone ? 'Standalone PWA App' : 'Browser Web App'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Manifest File:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    /manifest.json (Linked)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 space-y-1.5">
                <h4 className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5 text-xs">
                  <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  How to Install App on your Phone/Desktop:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  <li>Open browser menu (⋮ on Android/Chrome or Share ⎋ on iOS Safari).</li>
                  <li>Tap <strong>"Add to Home Screen"</strong> or <strong>"Install Application"</strong>.</li>
                  <li>Launch directly from your home screen like a native mobile app!</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPwaModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
