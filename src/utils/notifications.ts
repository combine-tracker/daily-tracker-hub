import { SubscriptionItem, CreditAccount, LoanRecord } from '../types';
import { loadStoredSubscriptions, loadStoredCreditAccounts, loadStoredLoans, formatCurrency } from './storage';

export interface DueNotificationItem {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  daysDiff: number; // < 0: Overdue, 0: Due Today, 1: Due Tomorrow
  type: 'subscription' | 'credit' | 'loan';
  statusLabel: string;
}

export interface NotificationSettings {
  enablePush: boolean;
  notifyOneDayBefore: boolean;
  notifyOnDueDate: boolean;
  notifyOverdue: boolean;
}

const STORAGE_KEY_NOTIF_SETTINGS = 'tracker_notification_settings_v1';
const STORAGE_KEY_SENT_LOGS = 'tracker_push_sent_logs_v1';

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIF_SETTINGS);
    if (!raw) {
      return {
        enablePush: true,
        notifyOneDayBefore: true,
        notifyOnDueDate: true,
        notifyOverdue: true,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      enablePush: true,
      notifyOneDayBefore: true,
      notifyOnDueDate: true,
      notifyOverdue: true,
    };
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIF_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save notification settings', err);
  }
}

// Helper to normalize dates to YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parses credit due date strings (e.g. "2026-08-15" or "15" or "Every 15th") into target YYYY-MM-DD
function parseCreditDueDate(rawDueDate?: string): string | null {
  if (!rawDueDate) return null;
  const trimmed = rawDueDate.trim();
  
  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Day number like "15" or "15th"
  const dayMatch = trimmed.match(/\b([1-9]|[12]\d|3[01])\b/);
  if (dayMatch) {
    const dayNum = parseInt(dayMatch[1], 10);
    const today = new Date();
    let month = today.getMonth();
    let year = today.getFullYear();

    // Target date for current month
    const targetDate = new Date(year, month, dayNum);
    
    // If date passed more than 20 days ago, assume next month
    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays < -20) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }

    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

export function calculateDaysDiff(targetDateStr: string, todayStr: string): number {
  const target = new Date(targetDateStr + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24));
}

export function getAllDueItems(
  subscriptions: SubscriptionItem[] = loadStoredSubscriptions(),
  credits: CreditAccount[] = loadStoredCreditAccounts(),
  loans: LoanRecord[] = loadStoredLoans()
): DueNotificationItem[] {
  const todayStr = getTodayDateString();
  const items: DueNotificationItem[] = [];

  // 1. Digital Subscriptions
  subscriptions.forEach((sub) => {
    if (sub.status !== 'Active' || !sub.nextRenewalDate) return;
    const diff = calculateDaysDiff(sub.nextRenewalDate, todayStr);

    let statusLabel = '';
    if (diff < 0) statusLabel = `OVERDUE (${Math.abs(diff)}d ago)`;
    else if (diff === 0) statusLabel = 'RENEWING TODAY';
    else if (diff === 1) statusLabel = 'RENEWING TOMORROW';
    else if (diff <= 3) statusLabel = `In ${diff} days`;
    else return; // Only include if within 3 days or overdue

    items.push({
      id: `sub-${sub.id}`,
      title: `${sub.serviceName} Renewal`,
      subtitle: `Digital Subscription (${sub.billingCycle || 'Monthly'})`,
      amount: sub.cost,
      dueDate: sub.nextRenewalDate,
      daysDiff: diff,
      type: 'subscription',
      statusLabel,
    });
  });

  // 2. Credit Line Accounts
  credits.forEach((cred) => {
    if (!cred.payableAmount || cred.payableAmount <= 0) return;
    const parsedDueDate = parseCreditDueDate(cred.dueDate);
    if (!parsedDueDate) return;

    const diff = calculateDaysDiff(parsedDueDate, todayStr);

    let statusLabel = '';
    if (diff < 0) statusLabel = `OVERDUE (${Math.abs(diff)}d ago)`;
    else if (diff === 0) statusLabel = 'DUE TODAY';
    else if (diff === 1) statusLabel = 'DUE TOMORROW';
    else if (diff <= 3) statusLabel = `Due in ${diff} days`;
    else return;

    items.push({
      id: `cred-${cred.id}`,
      title: `${cred.name} Credit Line Bill`,
      subtitle: `Payable: ${formatCurrency(cred.payableAmount)}`,
      amount: cred.payableAmount,
      dueDate: parsedDueDate,
      daysDiff: diff,
      type: 'credit',
      statusLabel,
    });
  });

  // 3. Loans / Utang
  loans.forEach((loan) => {
    if (loan.status === 'fully_paid' || !loan.dueDate || loan.remainingAmount <= 0) return;
    const diff = calculateDaysDiff(loan.dueDate, todayStr);

    let statusLabel = '';
    if (diff < 0) statusLabel = `OVERDUE (${Math.abs(diff)}d ago)`;
    else if (diff === 0) statusLabel = 'DUE TODAY';
    else if (diff === 1) statusLabel = 'DUE TOMORROW';
    else if (diff <= 3) statusLabel = `Due in ${diff} days`;
    else return;

    const loanLabel = loan.type === 'loan_in' ? 'Borrowed Debt Payable' : 'Lent Receivable';

    items.push({
      id: `loan-${loan.id}`,
      title: `Loan: ${loan.counterparty}`,
      subtitle: `${loanLabel} - ${formatCurrency(loan.remainingAmount)}`,
      amount: loan.remainingAmount,
      dueDate: loan.dueDate,
      daysDiff: diff,
      type: 'loan',
      statusLabel,
    });
  });

  // Sort: Overdue & Today first, then Tomorrow
  return items.sort((a, b) => a.daysDiff - b.daysDiff);
}

// Request Notification Permission
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Failed to request notification permission', err);
    return 'denied';
  }
}

// Send Push Notification
export function sendPushNotification(title: string, body: string, tag?: string): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const options: NotificationOptions = {
      body,
      icon: '/icon.png',
      tag: tag || `tracker-notif-${Date.now()}`,
      requireInteraction: true,
      badge: '/icon.png',
    };

    // Use ServiceWorker Registration if available (for mobile PWAs)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
    return true;
  } catch (err) {
    console.error('Failed to trigger Notification', err);
    return false;
  }
}

// Automatic background check for due subscriptions and credit lines
export function checkAndTriggerDueNotifications(): number {
  if (typeof window === 'undefined') return 0;

  const settings = loadNotificationSettings();
  if (!settings.enablePush) return 0;

  const dueItems = getAllDueItems();
  const todayStr = getTodayDateString();

  let sentCount = 0;

  // Retrieve log of already notified items for today
  let sentLogs: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SENT_LOGS);
    if (raw) sentLogs = JSON.parse(raw);
  } catch {
    sentLogs = {};
  }

  dueItems.forEach((item) => {
    // Check settings filters
    if (item.daysDiff === 1 && !settings.notifyOneDayBefore) return;
    if (item.daysDiff === 0 && !settings.notifyOnDueDate) return;
    if (item.daysDiff < 0 && !settings.notifyOverdue) return;

    const logKey = `${item.id}_${todayStr}_${item.daysDiff}`;
    if (sentLogs[logKey]) {
      // Already notified today for this specific status
      return;
    }

    let notifTitle = '';
    let notifBody = '';

    if (item.daysDiff === 1) {
      notifTitle = `⏰ Reminder (Tomorrow): ${item.title}`;
      notifBody = `Billing/Renewal tomorrow (${item.dueDate}). Amount: ${formatCurrency(item.amount)}. ${item.subtitle}`;
    } else if (item.daysDiff === 0) {
      notifTitle = `🚨 DUE TODAY: ${item.title}`;
      notifBody = `Billing/Renewal due today! Amount: ${formatCurrency(item.amount)}. ${item.subtitle}`;
    } else if (item.daysDiff < 0) {
      notifTitle = `⚠️ OVERDUE: ${item.title}`;
      notifBody = `Overdue by ${Math.abs(item.daysDiff)} days! Amount: ${formatCurrency(item.amount)}. ${item.subtitle}`;
    } else {
      return;
    }

    const sent = sendPushNotification(notifTitle, notifBody, `due-${item.id}`);
    if (sent) {
      sentCount++;
      sentLogs[logKey] = new Date().toISOString();
    }
  });

  try {
    localStorage.setItem(STORAGE_KEY_SENT_LOGS, JSON.stringify(sentLogs));
  } catch (err) {
    console.error('Failed to update push sent logs', err);
  }

  return sentCount;
}
