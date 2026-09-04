import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  RefreshCw,
  Send,
  Check,
  Settings,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  getAllDueItems,
  DueNotificationItem,
  requestBrowserNotificationPermission,
  sendPushNotification,
  loadNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
  getTodayDateString,
} from '../utils/notifications';
import { formatCurrency } from '../utils/storage';
import { SubscriptionItem, CreditAccount, LoanRecord } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'subscriptions' | 'credits' | 'loans') => void;
  subscriptions: SubscriptionItem[];
  credits: CreditAccount[];
  loans: LoanRecord[];
  showToast: (msg: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  subscriptions,
  credits,
  loans,
  showToast,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => loadNotificationSettings());
  const [activeTab, setActiveTab] = useState<'dues' | 'settings'>('dues');
  const [isTestingPush, setIsTestingPush] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dueItems = getAllDueItems(subscriptions, credits, loans);
  const todayStr = getTodayDateString();

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      showToast('Notifications enabled! You will now receive push alerts.');
      sendPushNotification(
        '🔔 Push Notifications Activated!',
        'You will be notified 1 day before and on the day of your subscription & credit line dues.',
        'test-activation'
      );
    } else {
      showToast('Notification permission was blocked or dismissed.');
    }
  };

  const handleTestPush = () => {
    setIsTestingPush(true);
    if (permission !== 'granted') {
      handleRequestPermission();
      setIsTestingPush(false);
      return;
    }

    const testSent = sendPushNotification(
      '🔔 Test Push Notification',
      'Daily Tracker Push System is active! Subscriptions & Credit Line bills will notify 1 day before due date.',
      `test-notif-${Date.now()}`
    );

    if (testSent) {
      showToast('Test push notification sent to your device!');
    } else {
      showToast('Could not send notification. Please check browser permissions.');
    }
    setTimeout(() => setIsTestingPush(false), 500);
  };

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveNotificationSettings(updated);
    showToast('Notification settings updated.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 relative">
              <Bell className="w-5 h-5 animate-bounce" />
              {dueItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {dueItems.length}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Notification Center
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Billing & Renewals
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Push alerts for Subscriptions, Credit Lines & Debts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/50 p-1">
          <button
            onClick={() => setActiveTab('dues')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'dues'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming & Due ({dueItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Push Settings</span>
          </button>
        </div>

        {/* Push Status Banner */}
        <div className="px-4 py-2.5 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-300">
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Push Status:{' '}
              <strong
                className={
                  permission === 'granted'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }
              >
                {permission === 'granted' ? 'Active & Allowed' : permission === 'denied' ? 'Blocked' : 'Action Required'}
              </strong>
            </span>
          </div>

          {permission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer shrink-0"
            >
              Enable Push
            </button>
          ) : (
            <button
              onClick={handleTestPush}
              disabled={isTestingPush}
              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <Send className="w-3 h-3" />
              <span>Test Push</span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'dues' && (
            <>
              {dueItems.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">All Dues Are Clear!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    No subscriptions or credit bills due today or in the next 3 days. You are all set!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dueItems.map((item) => {
                    const isOverdue = item.daysDiff < 0;
                    const isToday = item.daysDiff === 0;
                    const isTomorrow = item.daysDiff === 1;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-2xs transition-all ${
                          isOverdue
                            ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/80'
                            : isToday
                            ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
                            : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isOverdue
                                ? 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                                : isToday
                                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                                : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            {item.type === 'subscription' ? (
                              <RefreshCw className="w-4 h-4" />
                            ) : item.type === 'credit' ? (
                              <CreditCard className="w-4 h-4" />
                            ) : (
                              <Calendar className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {item.title}
                              </h4>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                  isOverdue
                                    ? 'bg-rose-600 text-white'
                                    : isToday
                                    ? 'bg-amber-500 text-white'
                                    : isTomorrow
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {item.statusLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {item.subtitle} • Due: {item.dueDate}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {formatCurrency(item.amount)}
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              if (item.type === 'subscription') onNavigateTab('subscriptions');
                              else if (item.type === 'credit') onNavigateTab('credits');
                              else if (item.type === 'loan') onNavigateTab('loans');
                            }}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Push Notification Preferences
                </h3>

                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60">
                    <div>
                      <span className="font-semibold block">Enable Push Notifications</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Receive device browser alerts for upcoming dues
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enablePush}
                      onChange={() => handleToggleSetting('enablePush')}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60">
                    <div>
                      <span className="font-semibold block">Notify 1 Day Before</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Send alert 1 day prior to subscription renewal or bill due
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifyOneDayBefore}
                      onChange={() => handleToggleSetting('notifyOneDayBefore')}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60">
                    <div>
                      <span className="font-semibold block">Notify on Due Date</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Send alert on the exact day of billing / renewal
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifyOnDueDate}
                      onChange={() => handleToggleSetting('notifyOnDueDate')}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60">
                    <div>
                      <span className="font-semibold block">Notify Overdue Dues</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Remind daily for overdue unpaid subscriptions & bills
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifyOverdue}
                      onChange={() => handleToggleSetting('notifyOverdue')}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-300">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  How Push Notifications Work
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  When enabled, your browser will trigger a system banner alert whenever you have subscriptions renewing or credit line bills due today or tomorrow. You can test your push notifications anytime using the "Test Push" button above.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {dueItems.length} active due alert{dueItems.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
