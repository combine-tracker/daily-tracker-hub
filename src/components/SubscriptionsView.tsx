import React, { useState, useEffect, useMemo } from 'react';
import {
  Tv,
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Mail,
  Phone,
  FileText,
  X,
  Plus,
} from 'lucide-react';
import { SubscriptionItem, SubscriptionCategory } from '../types';
import { loadStoredSubscriptions, saveStoredSubscriptions, formatCurrency } from '../utils/storage';

interface SubscriptionsViewProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSubscriptionsChange?: (items: SubscriptionItem[]) => void;
}

const CATEGORIES: { id: SubscriptionCategory; name: string; color: string; badgeBg: string }[] = [
  { id: 'Canva', name: 'Canva', color: 'text-cyan-400', badgeBg: 'bg-cyan-950/80 border-cyan-800 text-cyan-300' },
  { id: 'Capcut', name: 'CapCut', color: 'text-sky-400', badgeBg: 'bg-sky-950/80 border-sky-800 text-sky-300' },
  { id: 'Gemini', name: 'Gemini', color: 'text-indigo-400', badgeBg: 'bg-indigo-950/80 border-indigo-800 text-indigo-300' },
  { id: 'Loklok', name: 'LokLok', color: 'text-purple-400', badgeBg: 'bg-purple-950/80 border-purple-800 text-purple-300' },
  { id: 'Others', name: 'Others', color: 'text-slate-400', badgeBg: 'bg-slate-800/80 border-slate-700 text-slate-300' },
];

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onShowToast, onSubscriptionsChange }) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => loadStoredSubscriptions());
  
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Save to localStorage when changed
  useEffect(() => {
    saveStoredSubscriptions(subscriptions);
    if (onSubscriptionsChange) {
      onSubscriptionsChange(subscriptions);
    }
  }, [subscriptions, onSubscriptionsChange]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<SubscriptionItem | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState<string>('Canva');
  const [formServiceName, setFormServiceName] = useState<string>('Canva Pro');
  const [formCustomServiceName, setFormCustomServiceName] = useState<string>('');
  const [formCost, setFormCost] = useState<number | ''>(195);
  const [formBillingCycle, setFormBillingCycle] = useState<string>('Monthly');
  const [formStatus, setFormStatus] = useState<'Active' | 'Paused' | 'Cancelled' | 'Expired'>('Active');
  const [formNextRenewalDate, setFormNextRenewalDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('Maya');
  const [formCustomPayment, setFormCustomPayment] = useState<string>('');
  const [formAssociatedEmail, setFormAssociatedEmail] = useState<string>('');
  const [formSimNumber, setFormSimNumber] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Expanded items state map for accordion collapse
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id], // Default expanded (true unless explicitly collapsed)
    }));
  };

  const isExpanded = (id: string) => {
    return expandedMap[id] !== false; // Default expanded
  };

  // Preset services mapping for easy form selection
  const presetServices: Record<string, string[]> = {
    Canva: ['Canva Pro', 'Canva for Teams'],
    Capcut: ['CapCut Pro', 'CapCut Business'],
    Gemini: ['Gemini Advanced', 'Google One AI Premium'],
    Loklok: ['LokLok VIP', 'LokLok Premium'],
    Spotify: ['Spotify Individual', 'Spotify Premium Duo', 'Spotify Family'],
    Netflix: ['Netflix Standard', 'Netflix Premium 4K'],
    'Disney+': ['Disney+ Mobile', 'Disney+ Premium'],
    Others: ['Custom Service'],
  };

  const handleCategorySelectInForm = (cat: string) => {
    setFormCategory(cat);
    const presets = presetServices[cat] || ['Custom Service'];
    if (presets.length > 0 && presets[0] !== 'Custom Service') {
      setFormServiceName(presets[0]);
    } else {
      setFormServiceName('Custom Service');
    }
  };

  // Open Modal for Create
  const handleOpenAddModal = (presetCategory?: string) => {
    setEditingItem(null);
    const cat = presetCategory && presetCategory !== 'All' ? presetCategory : 'Canva';
    setFormCategory(cat);
    const presets = presetServices[cat] || ['Custom Service'];
    setFormServiceName(presets[0] || 'Canva Pro');
    setFormCustomServiceName('');
    setFormCost(195);
    setFormBillingCycle('Monthly');
    setFormStatus('Active');
    
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormNextRenewalDate(d.toISOString().split('T')[0]);

    setFormPaymentMethod('Maya');
    setFormCustomPayment('');
    setFormAssociatedEmail('');
    setFormSimNumber('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: SubscriptionItem) => {
    setEditingItem(item);
    setFormCategory(item.category || 'Others');
    
    const presets = presetServices[item.category] || [];
    if (presets.includes(item.serviceName)) {
      setFormServiceName(item.serviceName);
      setFormCustomServiceName('');
    } else {
      setFormServiceName('Custom Service');
      setFormCustomServiceName(item.serviceName);
    }

    setFormCost(item.cost);
    setFormBillingCycle(item.billingCycle || 'Monthly');
    setFormStatus(item.status || 'Active');
    setFormNextRenewalDate(item.nextRenewalDate || '');
    
    if (['Maya', 'GCash', 'Credit Card', 'Bank Transfer', 'Cash'].includes(item.paymentMethod)) {
      setFormPaymentMethod(item.paymentMethod);
      setFormCustomPayment('');
    } else {
      setFormPaymentMethod('Custom');
      setFormCustomPayment(item.paymentMethod || '');
    }

    setFormAssociatedEmail(item.associatedEmail || '');
    setFormSimNumber(item.simNumber || '');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Delete Item
  const confirmDelete = () => {
    if (!deletingItem) return;
    const name = deletingItem.serviceName;
    setSubscriptions((prev) => prev.filter((item) => item.id !== deletingItem.id));
    if (onShowToast) onShowToast(`Deleted ${name} subscription`, 'info');
    setDeletingItem(null);
  };

  // Save Form
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = formServiceName;
    if (formServiceName === 'Custom Service' || !formServiceName) {
      finalName = formCustomServiceName.trim() || `${formCategory} Subscription`;
    }

    let finalPayment = formPaymentMethod;
    if (formPaymentMethod === 'Custom') {
      finalPayment = formCustomPayment.trim() || 'Other Payment';
    }

    const costVal = typeof formCost === 'number' ? formCost : Number(formCost) || 0;

    if (editingItem) {
      // Update
      const updated: SubscriptionItem = {
        ...editingItem,
        category: formCategory,
        serviceName: finalName,
        cost: Math.max(0, costVal),
        billingCycle: formBillingCycle,
        status: formStatus,
        nextRenewalDate: formNextRenewalDate,
        paymentMethod: finalPayment,
        associatedEmail: formAssociatedEmail.trim(),
        simNumber: formSimNumber.trim(),
        notes: formNotes.trim(),
        updatedAt: new Date().toISOString(),
      };
      setSubscriptions((prev) => prev.map((item) => (item.id === editingItem.id ? updated : item)));
      if (onShowToast) onShowToast(`Updated ${finalName}`, 'success');
    } else {
      // Create
      const newItem: SubscriptionItem = {
        id: `sub-${Date.now()}`,
        category: formCategory,
        serviceName: finalName,
        cost: Math.max(0, costVal),
        billingCycle: formBillingCycle,
        status: formStatus,
        nextRenewalDate: formNextRenewalDate,
        paymentMethod: finalPayment,
        associatedEmail: formAssociatedEmail.trim(),
        simNumber: formSimNumber.trim(),
        notes: formNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      setSubscriptions((prev) => [newItem, ...prev]);
      if (onShowToast) onShowToast(`Added ${finalName}`, 'success');
    }

    setIsModalOpen(false);
  };

  // Filtered List
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Category filter
      if (selectedCategory !== 'All') {
        const catMatch = (sub.category || '').toLowerCase() === selectedCategory.toLowerCase();
        const nameMatch = (sub.serviceName || '').toLowerCase().includes(selectedCategory.toLowerCase());
        if (!catMatch && !nameMatch) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (sub.serviceName || '').toLowerCase().includes(q);
        const matchesCat = (sub.category || '').toLowerCase().includes(q);
        const matchesEmail = (sub.associatedEmail || '').toLowerCase().includes(q);
        const matchesPay = (sub.paymentMethod || '').toLowerCase().includes(q);
        const matchesNotes = (sub.notes || '').toLowerCase().includes(q);
        return matchesName || matchesCat || matchesEmail || matchesPay || matchesNotes;
      }

      return true;
    });
  }, [subscriptions, selectedCategory, searchQuery]);

  // Calculated Stats
  const stats = useMemo(() => {
    let activeCount = 0;
    let monthlyCost = 0;
    let yearlyCost = 0;
    let upcomingCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subscriptions.forEach((sub) => {
      if (sub.status === 'Active') {
        activeCount++;
        const cost = sub.cost || 0;
        
        if (sub.billingCycle === 'Monthly') {
          monthlyCost += cost;
          yearlyCost += cost * 12;
        } else if (sub.billingCycle === 'Yearly') {
          monthlyCost += cost / 12;
          yearlyCost += cost;
        } else if (sub.billingCycle === 'Weekly') {
          monthlyCost += cost * 4.33;
          yearlyCost += cost * 52;
        } else {
          monthlyCost += cost;
          yearlyCost += cost;
        }

        // Check renewal days remaining
        if (sub.nextRenewalDate) {
          const rDate = new Date(sub.nextRenewalDate);
          if (!isNaN(rDate.getTime())) {
            const diffTime = rDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 7) {
              upcomingCount++;
            }
          }
        }
      }
    });

    return {
      activeCount,
      totalCount: subscriptions.length,
      monthlyCost,
      yearlyCost,
      upcomingCount,
    };
  }, [subscriptions]);

  // Renewal Badge Helper
  const getRenewalDays = (dateStr: string) => {
    if (!dateStr) return null;
    const rDate = new Date(dateStr);
    if (isNaN(rDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = rDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `Expired ${Math.abs(diffDays)} days ago`, isUrgent: true };
    if (diffDays === 0) return { label: 'Due Today!', isUrgent: true };
    if (diffDays === 1) return { label: 'In 1 day!', isUrgent: true };
    if (diffDays <= 7) return { label: `In ${diffDays} days!`, isUrgent: true };
    return { label: `In ${diffDays} days`, isUrgent: false };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/80 text-pink-600 dark:text-pink-400 border border-pink-200/80 dark:border-pink-900/60 shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Digital Subscriptions
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal(selectedCategory)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-600/20 transition-all active:scale-95 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add New Entry</span>
        </button>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-pink-500" />
            <span>Active Subscriptions</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.activeCount} <span className="text-xs text-slate-400 font-normal">/ {stats.totalCount} total</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span>Est. Monthly Outflow</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400 truncate">
            {formatCurrency(stats.monthlyCost)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            <span>Est. Yearly Outflow</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 truncate">
            {formatCurrency(stats.yearlyCost)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Upcoming Renewals (7 Days)</span>
          </div>
          <div className={`text-xl sm:text-2xl font-black ${stats.upcomingCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
            {stats.upcomingCount}
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({subscriptions.length})
            </button>

            {CATEGORIES.map((cat) => {
              const count = subscriptions.filter(
                (s) =>
                  (s.category || '').toLowerCase() === cat.id.toLowerCase() ||
                  (s.serviceName || '').toLowerCase().includes(cat.id.toLowerCase())
              ).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCategory === cat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative shrink-0 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Subscription Cards List */}
      {filteredSubscriptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubscriptions.map((item) => {
            const renewal = getRenewalDays(item.nextRenewalDate);
            const open = isExpanded(item.id);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header Card Row */}
                <div className="p-4 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-900">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-800/80 text-purple-400 shrink-0">
                      <Tv className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {item.serviceName}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Billing Cycle Badge */}
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/60 text-purple-300">
                          {item.billingCycle || 'Monthly'}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                            item.status === 'Active'
                              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                              : item.status === 'Paused'
                              ? 'bg-amber-950/80 border-amber-800 text-amber-400'
                              : 'bg-rose-950/80 border-rose-800 text-rose-400'
                          }`}
                        >
                          {item.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit, Delete, Collapse toggle) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(item);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Subscription"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingItem(item);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Subscription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={open ? 'Collapse Card' : 'Expand Card'}
                    >
                      {open ? <ChevronUp className="w-4 h-4 text-rose-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {open && (
                  <div className="p-4 pt-0 space-y-3">
                    {/* Highlight Cost Banner */}
                    <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">Cost:</span>
                        <span className="text-amber-400 font-extrabold text-lg sm:text-xl">
                          {formatCurrency(item.cost)}{' '}
                          <span className="text-xs font-medium text-amber-300/80">
                            / {item.billingCycle?.toLowerCase() || 'monthly'}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          Next Renewal:
                        </span>
                        <span className="font-bold text-slate-200">
                          {item.nextRenewalDate || 'Not specified'}
                        </span>
                      </div>
                    </div>

                    {/* Upcoming Renewal Badge Alert */}
                    {renewal && renewal.isUrgent && (
                      <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-2.5 text-xs text-amber-300 font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Upcoming Renewal Badge: {renewal.label}</span>
                      </div>
                    )}

                    {/* Details Info List */}
                    <div className="text-xs space-y-1.5 text-slate-400 pt-1">
                      <div className="flex items-center justify-between">
                        <span>Payment Method:</span>
                        <span className="font-semibold text-slate-200">{item.paymentMethod || 'Maya'}</span>
                      </div>

                      {item.associatedEmail && (
                        <div className="flex items-center justify-between">
                          <span>Associated Email:</span>
                          <span className="font-medium text-slate-300 truncate max-w-[200px]" title={item.associatedEmail}>
                            {item.associatedEmail}
                          </span>
                        </div>
                      )}

                      {item.simNumber && (
                        <div className="flex items-center justify-between">
                          <span>Linked SIM:</span>
                          <span className="font-medium text-slate-300">{item.simNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes Box */}
                    {item.notes && (
                      <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/60 text-xs text-slate-300">
                        {item.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL (+ Add / Edit Entry) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 font-bold text-lg">+</span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {editingItem ? 'Edit Subscription Entry' : 'Add New Entry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEntry} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Category / Module Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Category / Module Type
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => handleCategorySelectInForm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="Canva">Canva</option>
                  <option value="Capcut">CapCut</option>
                  <option value="Gemini">Gemini</option>
                  <option value="Loklok">LokLok</option>
                  <option value="Spotify">Spotify</option>
                  <option value="Netflix">Netflix</option>
                  <option value="Disney+">Disney+</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Service Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Service Name *
                </label>
                <select
                  value={formServiceName}
                  onChange={(e) => setFormServiceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {(presetServices[formCategory] || ['Custom Service']).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="Custom Service">Custom / Other Service</option>
                </select>

                {formServiceName === 'Custom Service' && (
                  <input
                    type="text"
                    placeholder="Enter custom service name (e.g. Canva Pro)"
                    value={formCustomServiceName}
                    onChange={(e) => setFormCustomServiceName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                )}
              </div>

              {/* Cost & Billing Cycle Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Cost (₱) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    placeholder="e.g. 195"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Billing Cycle
                  </label>
                  <select
                    value={formBillingCycle}
                    onChange={(e) => setFormBillingCycle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>
              </div>

              {/* Next Renewal Date & Payment Method Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Next Renewal Date *
                  </label>
                  <input
                    type="date"
                    value={formNextRenewalDate}
                    onChange={(e) => setFormNextRenewalDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Payment Method / Card
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Custom">Other Custom</option>
                  </select>

                  {formPaymentMethod === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter payment method"
                      value={formCustomPayment}
                      onChange={(e) => setFormCustomPayment(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Subscription Status
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Active', 'Paused', 'Cancelled', 'Expired'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        formStatus === st
                          ? st === 'Active'
                            ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                            : st === 'Paused'
                            ? 'bg-amber-950 border-amber-600 text-amber-400'
                            : 'bg-rose-950 border-rose-600 text-rose-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Email & Linked SIM Number Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Linked Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. user@gmail.com"
                    value={formAssociatedEmail}
                    onChange={(e) => setFormAssociatedEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Linked SIM Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +63 917 123 4567"
                    value={formSimNumber}
                    onChange={(e) => setFormSimNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Notes / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Notes / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium Duo Subscription."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl overflow-hidden relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Delete Subscription?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Confirm removal of entry
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <p className="text-xs font-semibold text-slate-200">
                Are you sure you want to delete <span className="text-rose-400 font-bold">"{deletingItem.serviceName}"</span>?
              </p>
              <p className="text-[11px] text-slate-400">
                This will permanently remove this {deletingItem.billingCycle || 'monthly'} subscription record ({formatCurrency(deletingItem.cost)}) from your tracker.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
