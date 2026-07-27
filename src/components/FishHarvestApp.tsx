import React, { useState, useMemo, useRef } from 'react';
import {
  Fish,
  Layers,
  Box,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  ShoppingBag,
  Calculator,
  RefreshCw,
  Download,
  Upload,
  Printer,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  Info,
  Package,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  SlidersHorizontal,
} from 'lucide-react';
import {
  FishSizeCode,
  RawBoxEntry,
  BatchOutRecord,
  SalesSlipRecord,
  WalkInSaleRecord,
  HarvestDeductionRecord,
  FishHarvestBackupFile,
} from '../types';
import {
  loadStoredRawBoxes,
  saveRawBoxesToStorage,
  loadStoredBatchOuts,
  saveBatchOutsToStorage,
  loadStoredSalesSlips,
  saveSalesSlipsToStorage,
  loadStoredWalkInSales,
  saveWalkInSalesToStorage,
  loadStoredDeductions,
  saveDeductionsToStorage,
  INITIAL_SAMPLE_RAW_BOXES,
  INITIAL_SAMPLE_BATCH_OUTS,
  INITIAL_SAMPLE_SALES_SLIPS,
  INITIAL_SAMPLE_WALKIN_SALES,
  INITIAL_SAMPLE_DEDUCTIONS,
} from '../utils/fishHarvestStorage';

type FishTab =
  | 'dashboard'
  | 'raw_sort'
  | 'batch_out'
  | 'sales_slip'
  | 'walk_in'
  | 'settlement'
  | 'recovery';

const HARVEST_TAB_OPTIONS = [
  {
    id: 'dashboard' as FishTab,
    label: 'Dashboard Overview',
    subtitle: 'KPIs & Harvest Flow',
    badge: 'Summary',
    icon: LayoutDashboard,
    activeBg: 'bg-teal-600 dark:bg-teal-600',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/80',
    badgeText: 'text-teal-800 dark:text-teal-200',
  },
  {
    id: 'raw_sort' as FishTab,
    label: 'Raw Sorting Desk',
    subtitle: 'Pre-Settlement Box Weights',
    badge: '1. Raw',
    icon: Box,
    activeBg: 'bg-emerald-600 dark:bg-emerald-600',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
  },
  {
    id: 'batch_out' as FishTab,
    label: 'Batch Out Tracking',
    subtitle: 'Boxes & Kg Per Batch',
    badge: '2. Batch',
    icon: Package,
    activeBg: 'bg-amber-600 dark:bg-amber-600',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-200',
  },
  {
    id: 'sales_slip' as FishTab,
    label: 'Sales Slips Ledger',
    subtitle: 'Buyer Accounts & Kilos',
    badge: '3. Slips',
    icon: FileSpreadsheet,
    activeBg: 'bg-indigo-600 dark:bg-indigo-600',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
    badgeText: 'text-indigo-800 dark:text-indigo-200',
  },
  {
    id: 'walk_in' as FishTab,
    label: 'Walk-In Retail Sales',
    subtitle: 'Retail Buyers & Cash',
    badge: 'Retail',
    icon: ShoppingBag,
    activeBg: 'bg-purple-600 dark:bg-purple-600',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80',
    badgeText: 'text-purple-800 dark:text-purple-200',
  },
  {
    id: 'settlement' as FishTab,
    label: 'Settlement Master',
    subtitle: 'Net Grower Payout & Sheet',
    badge: 'Payout',
    icon: Calculator,
    activeBg: 'bg-sky-600 dark:bg-sky-600',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/80',
    badgeText: 'text-sky-800 dark:text-sky-200',
  },
  {
    id: 'recovery' as FishTab,
    label: 'Backup & Recovery',
    subtitle: 'Export / Import JSON',
    badge: 'Backup',
    icon: RotateCcw,
    activeBg: 'bg-slate-700 dark:bg-slate-700',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200',
  },
];

const FISH_SIZES: FishSizeCode[] = [
  'OS (Oversized >500g)',
  '2-1',
  '5-2',
  '3-1',
  '4-1',
  'Daing / Rejects',
];

export function FishHarvestApp() {
  const [activeTab, setActiveTab] = useState<FishTab>('dashboard');
  const [isHarvestNavExpanded, setIsHarvestNavExpanded] = useState(false);

  const activeHarvestOption = HARVEST_TAB_OPTIONS.find((t) => t.id === activeTab) || HARVEST_TAB_OPTIONS[0];
  const ActiveHarvestIcon = activeHarvestOption.icon;

  // Core Data States
  const [rawBoxes, setRawBoxes] = useState<RawBoxEntry[]>(() => loadStoredRawBoxes());
  const [batchOuts, setBatchOuts] = useState<BatchOutRecord[]>(() => loadStoredBatchOuts());
  const [salesSlips, setSalesSlips] = useState<SalesSlipRecord[]>(() => loadStoredSalesSlips());
  const [walkInSales, setWalkInSales] = useState<WalkInSaleRecord[]>(() => loadStoredWalkInSales());
  const [deductions, setDeductions] = useState<HarvestDeductionRecord[]>(() => loadStoredDeductions());

  // Toast & Auto-save status
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [harvestBackupText, setHarvestBackupText] = useState<string>('');
  const [harvestError, setHarvestError] = useState<string | null>(null);
  const [harvestSuccess, setHarvestSuccess] = useState<string | null>(null);
  const harvestFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // State Synchronizers
  const updateRawBoxes = (items: RawBoxEntry[]) => {
    setRawBoxes(items);
    saveRawBoxesToStorage(items);
  };

  const updateBatchOuts = (items: BatchOutRecord[]) => {
    setBatchOuts(items);
    saveBatchOutsToStorage(items);
  };

  const updateSalesSlips = (items: SalesSlipRecord[]) => {
    setSalesSlips(items);
    saveSalesSlipsToStorage(items);
  };

  const updateWalkInSales = (items: WalkInSaleRecord[]) => {
    setWalkInSales(items);
    saveWalkInSalesToStorage(items);
  };

  const updateDeductions = (items: HarvestDeductionRecord[]) => {
    setDeductions(items);
    saveDeductionsToStorage(items);
  };

  // --- FORM STATES ---
  // Raw Sort Form
  const [rawSize, setRawSize] = useState<FishSizeCode>('OS (Oversized >500g)');
  const [rawNumBoxes, setRawNumBoxes] = useState<string>('');
  const [rawKgPerBox, setRawKgPerBox] = useState<string>('');
  const [rawLooseKg, setRawLooseKg] = useState<string>('');
  const [showLastRawEntry, setShowLastRawEntry] = useState(false);

  // Batch Out Form
  const [batchName, setBatchName] = useState<string>('');
  const [batchSize, setBatchSize] = useState<FishSizeCode>('OS (Oversized >500g)');
  const [batchKgPerBox, setBatchKgPerBox] = useState<string>('');
  const [batchNumBoxes, setBatchNumBoxes] = useState<string>('');

  // Sales Slip Form
  const [slipSizeGroup, setSlipSizeGroup] = useState<FishSizeCode>('OS (Oversized >500g)');
  const [slipClassification, setSlipClassification] = useState<string>('Main broker / buyer bulk');
  const [slipTotalBoxes, setSlipTotalBoxes] = useState<string>('');
  const [slipAckNetKg, setSlipAckNetKg] = useState<string>('');
  const [slipLooseKg, setSlipLooseKg] = useState<string>('');
  const [slipPricePerKg, setSlipPricePerKg] = useState<string>('');
  const [slipIncludeTotalKg, setSlipIncludeTotalKg] = useState<boolean>(true);

  // Collapsible Open/Closed States
  const [openRawSizes, setOpenRawSizes] = useState<Record<string, boolean>>({});
  const [openBatchNames, setOpenBatchNames] = useState<Record<string, boolean>>({});
  const [openSlipSizes, setOpenSlipSizes] = useState<Record<string, boolean>>({});
  const [openWalkInSizes, setOpenWalkInSizes] = useState<Record<string, boolean>>({});
  const [openSettlementSizes, setOpenSettlementSizes] = useState<Record<string, boolean>>({});

  const toggleGroup = (
    setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    key: string
  ) => {
    setter((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  // Walk-in Form
  const [walkSize, setWalkSize] = useState<FishSizeCode>('OS (Oversized >500g)');
  const [walkKgSold, setWalkKgSold] = useState<string>('');
  const [walkAmount, setWalkAmount] = useState<string>('');
  const [walkIncludeTotalKg, setWalkIncludeTotalKg] = useState<boolean>(true);

  // Settlement Master Customizations
  const [cageOwnerName, setCageOwnerName] = useState<string>(() => {
    return localStorage.getItem('fh_cageOwnerName') || 'LIIT';
  });
  const [harvestDate, setHarvestDate] = useState<string>(() => {
    return localStorage.getItem('fh_harvestDate') || new Date().toISOString().split('T')[0];
  });
  const [harvestCycle, setHarvestCycle] = useState<string>(() => {
    return localStorage.getItem('fh_harvestCycle') || 'Cycle 1';
  });
  const [fingerlingsQty, setFingerlingsQty] = useState<string>(() => {
    return localStorage.getItem('fh_fingerlingsQty') || '50,000';
  });
  const [buyerCommissionPct, setBuyerCommissionPct] = useState<number>(() => {
    const saved = localStorage.getItem('fh_buyerCommissionPct');
    return saved !== null ? parseFloat(saved) : 5;
  });
  const [applyBuyerCommission, setApplyBuyerCommission] = useState<boolean>(() => {
    const saved = localStorage.getItem('fh_applyBuyerCommission');
    return saved !== null ? saved === 'true' : true;
  });
  const [includeOwnerNameInPrint, setIncludeOwnerNameInPrint] = useState<boolean>(true);
  const [includeWalkInInSettlement, setIncludeWalkInInSettlement] = useState<boolean>(() => {
    const saved = localStorage.getItem('fh_includeWalkInInSettlement');
    return saved !== null ? saved === 'true' : true;
  });

  // Edit Modal States
  const [editingRawBox, setEditingRawBox] = useState<RawBoxEntry | null>(null);
  const [editingBatchOut, setEditingBatchOut] = useState<BatchOutRecord | null>(null);
  const [editingSalesSlip, setEditingSalesSlip] = useState<SalesSlipRecord | null>(null);
  const [editingWalkIn, setEditingWalkIn] = useState<WalkInSaleRecord | null>(null);
  const [editingDeduction, setEditingDeduction] = useState<HarvestDeductionRecord | null>(null);

  // Modal State for Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Auto-save Settlement Settings
  React.useEffect(() => {
    localStorage.setItem('fh_cageOwnerName', cageOwnerName);
    localStorage.setItem('fh_harvestDate', harvestDate);
    localStorage.setItem('fh_harvestCycle', harvestCycle);
    localStorage.setItem('fh_fingerlingsQty', fingerlingsQty);
    localStorage.setItem('fh_buyerCommissionPct', buyerCommissionPct.toString());
    localStorage.setItem('fh_applyBuyerCommission', applyBuyerCommission.toString());
    localStorage.setItem('fh_includeWalkInInSettlement', includeWalkInInSettlement.toString());
  }, [
    cageOwnerName,
    harvestDate,
    harvestCycle,
    fingerlingsQty,
    buyerCommissionPct,
    applyBuyerCommission,
    includeWalkInInSettlement,
  ]);

  // --- CALCULATIONS ---
  const totals = useMemo(() => {
    const rawTotalKg = rawBoxes.reduce((acc, b) => acc + (b.totalKg || 0), 0);
    const rawTotalBoxes = rawBoxes.reduce((acc, b) => acc + (b.boxes || 0), 0);

    const buyerSalesTotal = salesSlips.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const walkInTotalAmount = walkInSales.reduce((acc, w) => acc + (w.amount || 0), 0);

    // Buyer's Commission calculation (5% default)
    const buyerCommissionAmount = applyBuyerCommission ? buyerSalesTotal * (buyerCommissionPct / 100) : 0;

    // Sub Total = Grand Total (Buyer Sales) - Buyer's 5%
    const subTotal = buyerSalesTotal - buyerCommissionAmount;

    // Walk-in Sales addition based on toggle
    const walkInAddition = includeWalkInInSettlement ? walkInTotalAmount : 0;

    // Net Sales = Sub Total + Walk-in Sales (if toggled ON)
    const netSales = subTotal + walkInAddition;

    // Total Operating Deductions
    const totalDeductionsPHP = deductions.reduce((acc, d) => acc + (d.amount || 0), 0);

    // Final Net Grower / Owner Payout
    const netPayoutPHP = netSales;

    const soldSlipsKg = salesSlips
      .filter((s) => s.includeInTotalKg)
      .reduce((acc, s) => acc + (s.totalBoxes * s.acknowledgedNetKg + (s.looseKg || 0)), 0);

    const soldWalkInKg = walkInSales
      .filter((w) => w.includeInTotalKg)
      .reduce((acc, w) => acc + (w.kgSold || 0), 0);

    const soldTotalKg = soldSlipsKg + (includeWalkInInSettlement ? soldWalkInKg : 0);
    const varianceKg = rawTotalKg - soldTotalKg;

    const batchOutTotalKg = batchOuts.reduce((acc, b) => acc + (b.totalKgOut || 0), 0);
    const batchOutTotalBoxes = batchOuts.reduce((acc, b) => acc + (b.boxesOut || 0), 0);

    const remainingBoxes = rawTotalBoxes - batchOutTotalBoxes;
    const remainingKg = rawTotalKg - batchOutTotalKg;

    return {
      rawTotalKg,
      rawTotalBoxes,
      soldTotalKg,
      varianceKg,
      buyerSalesTotal,
      walkInTotalAmount,
      buyerCommissionAmount,
      subTotal,
      walkInAddition,
      netSales,
      totalGrossSalesPHP: buyerSalesTotal + walkInTotalAmount,
      totalDeductionsPHP,
      netPayoutPHP,
      batchOutTotalKg,
      batchOutTotalBoxes,
      remainingBoxes,
      remainingKg,
    };
  }, [
    rawBoxes,
    salesSlips,
    walkInSales,
    batchOuts,
    deductions,
    buyerCommissionPct,
    applyBuyerCommission,
    includeWalkInInSettlement,
  ]);

  // Grouped Raw Boxes by Size
  const groupedRawBoxes = useMemo(() => {
    const groups: Record<string, RawBoxEntry[]> = {};
    rawBoxes.forEach((b) => {
      if (!groups[b.size]) groups[b.size] = [];
      groups[b.size].push(b);
    });
    return groups;
  }, [rawBoxes]);

  // Grouped Batch Outs by Batch Name
  const groupedBatchOuts = useMemo<Record<string, BatchOutRecord[]>>(() => {
    const groups: Record<string, BatchOutRecord[]> = {};
    batchOuts.forEach((b) => {
      const name = b.batchName?.trim() || 'Batch 1';
      if (!groups[name]) groups[name] = [];
      groups[name].push(b);
    });
    return groups;
  }, [batchOuts]);

  // Grouped Sales Slips by Size
  const groupedSalesSlips = useMemo(() => {
    const groups: Record<string, SalesSlipRecord[]> = {};
    salesSlips.forEach((s) => {
      if (!groups[s.sizeGroup]) groups[s.sizeGroup] = [];
      groups[s.sizeGroup].push(s);
    });
    return groups;
  }, [salesSlips]);

  // Grouped Walk-in Sales by Size
  const groupedWalkInSales = useMemo(() => {
    const groups: Record<string, WalkInSaleRecord[]> = {};
    walkInSales.forEach((w) => {
      if (!groups[w.size]) groups[w.size] = [];
      groups[w.size].push(w);
    });
    return groups;
  }, [walkInSales]);

  // --- HANDLERS ---
  const handleDropBox = (e: React.FormEvent) => {
    e.preventDefault();
    const boxes = parseFloat(rawNumBoxes) || 0;
    const kgBox = parseFloat(rawKgPerBox) || 0;
    const loose = parseFloat(rawLooseKg) || 0;
    const calculatedTotalKg = boxes * kgBox + loose;

    if (calculatedTotalKg <= 0) {
      alert('Please enter valid box count, kg/box, or loose kg.');
      return;
    }

    const newEntry: RawBoxEntry = {
      id: `raw-${Date.now()}`,
      size: rawSize,
      boxes,
      kgPerBox: kgBox,
      looseKg: loose,
      totalKg: calculatedTotalKg,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    updateRawBoxes([newEntry, ...rawBoxes]);
    setRawNumBoxes('');
    setRawKgPerBox('');
    setRawLooseKg('');
    showToast(`Added ${calculatedTotalKg.toFixed(1)} kg to ${rawSize}`);
  };

  const handleDeleteRawBox = (id: string) => {
    updateRawBoxes(rawBoxes.filter((b) => b.id !== id));
    showToast('Raw box entry deleted.');
  };

  const handleAddBatchOut = (e: React.FormEvent) => {
    e.preventDefault();
    const boxes = parseFloat(batchNumBoxes) || 0;
    const kgBox = parseFloat(batchKgPerBox) || 0;
    const totalOut = boxes * kgBox;

    if (totalOut <= 0) {
      alert('Please enter valid number of boxes and kg per box.');
      return;
    }

    const newBatch: BatchOutRecord = {
      id: `batch-${Date.now()}`,
      batchName: batchName || 'General Batch Out',
      size: batchSize,
      boxesOut: boxes,
      kgPerBox: kgBox,
      totalKgOut: totalOut,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    updateBatchOuts([newBatch, ...batchOuts]);
    setBatchName('');
    setBatchNumBoxes('');
    setBatchKgPerBox('');
    showToast(`Batch out recorded: ${boxes} boxes (${totalOut.toFixed(1)} kg)`);
  };

  const handleDeleteBatchOut = (id: string) => {
    updateBatchOuts(batchOuts.filter((b) => b.id !== id));
    showToast('Batch record deleted.');
  };

  const handleSecureSalesEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const boxes = parseFloat(slipTotalBoxes) || 0;
    const ackKg = parseFloat(slipAckNetKg) || 0;
    const loose = parseFloat(slipLooseKg) || 0;
    const price = parseFloat(slipPricePerKg) || 0;
    const totalItemKg = (boxes * ackKg) + loose;
    const totalAmt = totalItemKg * price;

    if (totalItemKg <= 0 && price <= 0) {
      alert('Please enter total boxes, net kg, loose kg, or price per kilo.');
      return;
    }

    const newSlip: SalesSlipRecord = {
      id: `slip-${Date.now()}`,
      sizeGroup: slipSizeGroup,
      classification: slipClassification,
      totalBoxes: boxes,
      acknowledgedNetKg: ackKg,
      looseKg: loose,
      pricePerKg: price,
      totalAmount: totalAmt,
      includeInTotalKg: slipIncludeTotalKg,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    updateSalesSlips([newSlip, ...salesSlips]);
    setSlipTotalBoxes('');
    setSlipAckNetKg('');
    setSlipLooseKg('');
    setSlipPricePerKg('');
    showToast(`Sales slip secured: ₱${totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  };

  const handleDeleteSalesSlip = (id: string) => {
    updateSalesSlips(salesSlips.filter((s) => s.id !== id));
    showToast('Sales slip deleted.');
  };

  const handleLogWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(walkKgSold) || 0;
    const amt = parseFloat(walkAmount) || 0;

    if (kg <= 0 || amt <= 0) {
      alert('Please enter kilograms sold and total amount.');
      return;
    }

    const newSale: WalkInSaleRecord = {
      id: `walk-${Date.now()}`,
      size: walkSize,
      kgSold: kg,
      amount: amt,
      includeInTotalKg: walkIncludeTotalKg,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    updateWalkInSales([newSale, ...walkInSales]);
    setWalkKgSold('');
    setWalkAmount('');
    showToast(`Walk-in retail sale logged: ₱${amt.toLocaleString()}`);
  };

  const handleDeleteWalkIn = (id: string) => {
    updateWalkInSales(walkInSales.filter((w) => w.id !== id));
    showToast('Walk-in sale removed.');
  };

  const handleSaveEditRawBox = (updated: RawBoxEntry) => {
    updateRawBoxes(rawBoxes.map((b) => (b.id === updated.id ? updated : b)));
    setEditingRawBox(null);
    showToast('Raw box entry updated.');
  };

  const handleSaveEditBatchOut = (updated: BatchOutRecord) => {
    updateBatchOuts(batchOuts.map((b) => (b.id === updated.id ? updated : b)));
    setEditingBatchOut(null);
    showToast('Batch record updated.');
  };

  const handleSaveEditSalesSlip = (updated: SalesSlipRecord) => {
    const totalItemKg = (updated.totalBoxes * updated.acknowledgedNetKg) + (updated.looseKg || 0);
    const totalAmount = totalItemKg * updated.pricePerKg;
    const itemWithTotal = { ...updated, totalAmount };
    updateSalesSlips(salesSlips.map((s) => (s.id === itemWithTotal.id ? itemWithTotal : s)));
    setEditingSalesSlip(null);
    showToast('Sales slip updated.');
  };

  const handleSaveEditWalkIn = (updated: WalkInSaleRecord) => {
    updateWalkInSales(walkInSales.map((w) => (w.id === updated.id ? updated : w)));
    setEditingWalkIn(null);
    showToast('Walk-in sale updated.');
  };

  // --- RECOVERY & BACKUP LOGIC ---
  const handleGenerateHarvestDump = () => {
    setHarvestError(null);
    const backup: FishHarvestBackupFile = {
      app: 'Fish Harvest Monitor',
      version: '1.0',
      exportDate: new Date().toISOString(),
      rawBoxes,
      batchOuts,
      salesSlips,
      walkInSales,
      deductions,
    };

    const jsonString = JSON.stringify(backup, null, 2);
    setHarvestBackupText(jsonString);

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `fish_harvest_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setHarvestSuccess('Generated fish harvest dump! Text displayed below and backup file downloaded.');
    showToast('Fish harvest backup dump generated!');
  };

  const handleInjectHarvestState = () => {
    setHarvestError(null);
    setHarvestSuccess(null);

    if (!harvestBackupText.trim()) {
      setHarvestError('Please paste a valid JSON backup dump into the box above or click "Generate Dump".');
      return;
    }

    try {
      const parsed = JSON.parse(harvestBackupText);
      if (parsed && (parsed.rawBoxes || parsed.salesSlips)) {
        if (window.confirm('Restore fish harvest records from the backup dump? This will replace your current active harvest tables.')) {
          updateRawBoxes(parsed.rawBoxes || []);
          updateBatchOuts(parsed.batchOuts || []);
          updateSalesSlips(parsed.salesSlips || []);
          updateWalkInSales(parsed.walkInSales || []);
          updateDeductions(parsed.deductions || []);
          setHarvestSuccess('Successfully injected state and restored fish harvest ledger!');
          showToast('Fish harvest state injected successfully!');
        }
      } else {
        setHarvestError('Invalid backup dump format. Expected "rawBoxes" or "salesSlips" fields.');
      }
    } catch (err) {
      setHarvestError('Failed to parse JSON text dump. Please check for syntax errors.');
    }
  };

  const handleHarvestFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHarvestError(null);
    setHarvestSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.readAsText(file, 'UTF-8');
    fileReader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setHarvestBackupText(content);
        const parsed = JSON.parse(content);
        if (parsed.rawBoxes || parsed.salesSlips) {
          setHarvestSuccess('Loaded backup file into box! Click "INJECT / RESTORE STATE" to apply.');
        } else {
          setHarvestError('Invalid harvest backup file structure.');
        }
      } catch (err) {
        setHarvestError('Error reading JSON backup file.');
      }
    };
  };

  const handleClearAllHarvestData = () => {
    if (window.confirm('Are you sure you want to clear all fish harvest data from browser storage? Make sure you generated a dump first.')) {
      updateRawBoxes([]);
      updateBatchOuts([]);
      updateSalesSlips([]);
      updateWalkInSales([]);
      updateDeductions([]);
      setHarvestBackupText('');
      setHarvestSuccess('All fish harvest data cleared.');
      showToast('All fish harvest data cleared.');
    }
  };

  const handleResetToSampleData = () => {
    if (confirm('Reset Fish Harvest Monitor to sample dataset?')) {
      updateRawBoxes(INITIAL_SAMPLE_RAW_BOXES);
      updateBatchOuts(INITIAL_SAMPLE_BATCH_OUTS);
      updateSalesSlips(INITIAL_SAMPLE_SALES_SLIPS);
      updateWalkInSales(INITIAL_SAMPLE_WALKIN_SALES);
      updateDeductions(INITIAL_SAMPLE_DEDUCTIONS);
      showToast('Restored to initial sample harvest data.');
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Floating Action Buttons: Preview & Print */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-2xl border border-slate-700 active:scale-95 transition-all"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Preview</span>
        </button>
        <button
          type="button"
          onClick={handleTriggerPrint}
          className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-2xl border border-slate-700 active:scale-95 transition-all"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Print</span>
        </button>
      </div>

      {/* Top Banner Notice */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/50 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-center gap-2 text-center">
        <Info className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Changes do not override final verified buyer totals. (Auto-saved data restored)
        </span>
      </div>

      {/* Main Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Fish className="w-6 h-6 text-sky-600" />
                <span>Fish Harvest Monitor</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Sort, track, settle — all in one place
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Vertical Navigation */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
          {/* Vertical Navigation Sidebar for Harvest Monitoring */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-2 sm:p-3 lg:sticky lg:top-20 transition-all">
              {/* Mobile Bar Header */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsHarvestNavExpanded(!isHarvestNavExpanded)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg ${activeHarvestOption.activeBg} text-white shadow-xs shrink-0`}>
                      <ActiveHarvestIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Active View
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate block">
                        {activeHarvestOption.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
                      Vertical ({HARVEST_TAB_OPTIONS.length})
                    </span>
                    {isHarvestNavExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>
              </div>

              {/* Vertical Navigation List */}
              <div className={`${isHarvestNavExpanded ? 'block mt-2' : 'hidden'} lg:block space-y-1`}>
                <div className="hidden lg:flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-500" />
                    Harvest Menu
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-extrabold">
                    Vertical Style
                  </span>
                </div>

                <nav className="space-y-1">
                  {HARVEST_TAB_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = activeTab === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(option.id);
                          setIsHarvestNavExpanded(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer group ${
                          isActive
                            ? `${option.activeBg} text-white shadow-sm scale-[1.01]`
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 transition-colors ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 group-hover:bg-teal-50 dark:group-hover:bg-teal-950 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                            }`}
                          >
                            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          </div>

                          <div className="min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-bold block truncate ${
                                isActive ? 'text-white' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {option.label}
                            </span>
                            <span
                              className={`text-[11px] block truncate ${
                                isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {option.subtitle}
                            </span>
                          </div>
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
          </aside>

          {/* Main View Area */}
          <main className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6">
        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top 3 KPI Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  RAW TOTAL
                </span>
                <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {totals.rawTotalKg.toFixed(1)}kg
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  SOLD TOTAL
                </span>
                <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {totals.soldTotalKg.toFixed(1)}kg
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  VARIANCE
                </span>
                <p
                  className={`text-lg sm:text-2xl font-black mt-1 ${
                    totals.varianceKg >= 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {totals.varianceKg >= 0 ? '+' : ''}
                  {totals.varianceKg.toFixed(1)}kg
                </p>
              </div>
            </div>

            {/* Harvest Flow Graph Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="mb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Harvest flow</h2>
                <p className="text-xs text-slate-500">Kg tracked by category</p>
              </div>

              {/* Chart Visual Simulation */}
              <div className="h-28 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 flex flex-col justify-end relative overflow-hidden border border-slate-100 dark:border-slate-800">
                <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,20 Q 50,20 100,60 T 200,60 T 300,60 L 300,80 L 0,80 Z"
                    fill="url(#flowGrad)"
                  />
                  <path
                    d="M 0,20 Q 50,20 100,60 T 200,60 T 300,60"
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="2.5"
                  />
                  <circle cx="10" cy="20" r="3.5" fill="#0d9488" />
                  <circle cx="100" cy="60" r="3.5" fill="#2563eb" />
                  <circle cx="200" cy="60" r="3.5" fill="#9333ea" />
                  <circle cx="290" cy="60" r="3.5" fill="#e11d48" />
                </svg>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1 font-semibold text-teal-600">
                  <span className="w-2 h-2 rounded-full bg-teal-600" /> Raw
                </span>
                <span className="flex items-center gap-1 font-semibold text-blue-600">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> Sold
                </span>
                <span className="flex items-center gap-1 font-semibold text-purple-600">
                  <span className="w-2 h-2 rounded-full bg-purple-600" /> Walk-in
                </span>
                <span className="flex items-center gap-1 font-semibold text-rose-600">
                  <span className="w-2 h-2 rounded-full bg-rose-600" /> Damaged
                </span>
              </div>
            </div>

            {/* Quick Management Cards Grid */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                Quick management
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Card 1: Raw sorting */}
                <div
                  onClick={() => setActiveTab('raw_sort')}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-400 cursor-pointer transition-all flex items-start justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Raw sorting</h3>
                      <p className="text-xs text-slate-500">Pre-settlement desk</p>
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                </div>

                {/* Card 2: Batch out */}
                <div
                  onClick={() => setActiveTab('batch_out')}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 cursor-pointer transition-all flex items-start justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Batch out</h3>
                      <p className="text-xs text-slate-500">Track boxes per batch</p>
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                    B
                  </span>
                </div>

                {/* Card 3: Sales slip */}
                <div
                  onClick={() => setActiveTab('sales_slip')}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 cursor-pointer transition-all flex items-start justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Sales slip</h3>
                      <p className="text-xs text-slate-500">Saves to financial ledger</p>
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                </div>

                {/* Card 5: Walk-in retail */}
                <div
                  onClick={() => setActiveTab('walk_in')}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-400 cursor-pointer transition-all flex items-start justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Walk-in retail</h3>
                      <p className="text-xs text-slate-500">Log individual buyers</p>
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-bold text-xs flex items-center justify-center">
                    R
                  </span>
                </div>

                {/* Card 6: Recovery */}
                <div
                  onClick={() => setActiveTab('recovery')}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-400 cursor-pointer transition-all flex items-start justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recovery</h3>
                      <p className="text-xs text-slate-500">Backup & Restore JSON</p>
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: RAW SORT --- */}
        {activeTab === 'raw_sort' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Raw sorting box weights
              </h2>

              <form onSubmit={handleDropBox} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    FISH SIZE
                  </label>
                  <select
                    value={rawSize}
                    onChange={(e) => setRawSize(e.target.value as FishSizeCode)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {FISH_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    NUMBER OF BOXES
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 5"
                    value={rawNumBoxes}
                    onChange={(e) => setRawNumBoxes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    KG PER BOX
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 34.5"
                    value={rawKgPerBox}
                    onChange={(e) => setRawKgPerBox(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    LOOSE KG (OPTIONAL)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 5.0 - leftover kg not in boxes"
                    value={rawLooseKg}
                    onChange={(e) => setRawLooseKg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Drop box</span>
                </button>
              </form>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowLastRawEntry(!showLastRawEntry)}
                  className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{showLastRawEntry ? 'Hide last entry' : 'Show last entry'}</span>
                </button>

                {showLastRawEntry && rawBoxes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 text-xs text-teal-950 dark:text-teal-200">
                    <p className="font-bold">Last Box Entry:</p>
                    <p>
                      Size: {rawBoxes[0].size} | Boxes: {rawBoxes[0].boxes} | Kg/Box: {rawBoxes[0].kgPerBox}kg | Total: {rawBoxes[0].totalKg.toFixed(1)}kg
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Box History Grouped By Size */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  BOX HISTORY (GROUPED BY SIZE & BOX WEIGHT)
                </h3>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total: {totals.rawTotalKg.toFixed(2)} kg
                </span>
              </div>

              <div className="space-y-4">
                {Object.keys(groupedRawBoxes).length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No raw sorting entries yet. Drop a box above!
                  </div>
                ) : (
                  (Object.entries(groupedRawBoxes) as [string, RawBoxEntry[]][]).map(([size, entries]) => {
                    const isOpen = openRawSizes[size] !== false;
                    const groupTotalKg = entries.reduce((s, e) => s + e.totalKg, 0);
                    const groupTotalBoxes = entries.reduce((s, e) => s + e.boxes, 0);

                    // Sub-categorize by kgPerBox and loose
                    const catMap: Record<number, { boxes: number; totalKg: number }> = {};
                    let totalLoose = 0;
                    entries.forEach((e) => {
                      if (e.boxes > 0 && e.kgPerBox > 0) {
                        if (!catMap[e.kgPerBox]) catMap[e.kgPerBox] = { boxes: 0, totalKg: 0 };
                        catMap[e.kgPerBox].boxes += e.boxes;
                        catMap[e.kgPerBox].totalKg += e.boxes * e.kgPerBox;
                      }
                      if (e.looseKg) {
                        totalLoose += e.looseKg;
                      }
                    });

                    return (
                      <div
                        key={size}
                        className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs"
                      >
                        {/* Clickable Header */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(setOpenRawSizes, size)}
                          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                {size}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {entries.length} raw entry{entries.length > 1 ? 'ies' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-slate-500 block">
                              {groupTotalBoxes} boxes
                            </span>
                            <span className="font-black text-teal-700 dark:text-teal-400 text-sm">
                              {groupTotalKg.toFixed(2)} kg
                            </span>
                          </div>
                        </button>

                        {/* Accordion Body */}
                        {isOpen && (
                          <div className="bg-white dark:bg-slate-900 p-3 space-y-3">
                            {/* Categorized Sub-breakdown Card */}
                            <div className="p-3 rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 text-xs space-y-1.5">
                              <span className="font-bold uppercase text-[10px] text-teal-800 dark:text-teal-300 block mb-1">
                                Categorized Breakdown ({size}):
                              </span>
                              {Object.entries(catMap).map(([kgBoxStr, data]) => (
                                <div key={kgBoxStr} className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300">
                                  <span>• {data.boxes} box{data.boxes > 1 ? 'es' : ''} @ {parseFloat(kgBoxStr).toFixed(2)} kg/box</span>
                                  <span className="font-bold text-slate-900 dark:text-white">{data.totalKg.toFixed(2)} kg</span>
                                </div>
                              ))}
                              {totalLoose > 0 && (
                                <div className="flex items-center justify-between font-medium text-amber-700 dark:text-amber-400 pt-1 border-t border-teal-200/50 dark:border-teal-900/50">
                                  <span>• Loose kg</span>
                                  <span className="font-bold">{totalLoose.toFixed(2)} kg</span>
                                </div>
                              )}
                            </div>

                            {/* Individual Raw Entries List */}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {entries.map((item) => (
                                <div key={item.id} className="py-2.5 px-1 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                                  <div>
                                    <span className="font-bold text-teal-700 dark:text-teal-400 block">
                                      {item.kgPerBox > 0 ? `${item.kgPerBox.toFixed(2)} kg/box (${item.boxes} boxes)` : 'Loose Only'}
                                    </span>
                                    <span className="text-slate-500 text-[11px]">
                                      Loose: {item.looseKg || 0} kg • Logged: {item.date}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {item.totalKg.toFixed(2)} kg
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingRawBox(item)}
                                      className="text-slate-400 hover:text-indigo-600 p-1"
                                      title="Edit entry"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRawBox(item.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: BATCH OUT --- */}
        {activeTab === 'batch_out' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Batch out monitoring
              </h2>

              <form onSubmit={handleAddBatchOut} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    BATCH NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Batch Out, Truck A..."
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    FISH SIZE
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value as FishSizeCode)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold outline-none"
                  >
                    {FISH_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    KG PER BOX
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 30"
                    value={batchKgPerBox}
                    onChange={(e) => setBatchKgPerBox(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    NUMBER OF BOXES
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 48"
                    value={batchNumBoxes}
                    onChange={(e) => setBatchNumBoxes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                >
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>📦 Add to batch</span>
                </button>
              </form>
            </div>

            {/* Batch Status Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">BATCHES</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">{batchOuts.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">BOXES OUT</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">{totals.batchOutTotalBoxes}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">KG OUT</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {totals.batchOutTotalKg.toFixed(2)} kg
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                  REMAINING BOXES
                </span>
                <p className="text-lg font-black text-emerald-800 dark:text-emerald-200">{totals.remainingBoxes}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                  REMAINING KG
                </span>
                <p className="text-lg font-black text-emerald-800 dark:text-emerald-200">
                  {totals.remainingKg.toFixed(2)} kg
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-center">
                <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">VARIANCE</span>
                <p className="text-lg font-black text-rose-800 dark:text-rose-200">{totals.remainingBoxes} boxes</p>
              </div>
            </div>

            {/* Batch Out History List Grouped By Batch */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                BATCH OUT HISTORY (CATEGORIZED BY BATCH)
              </h3>
              {Object.keys(groupedBatchOuts).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No batches recorded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedBatchOuts).map(([bName, rawItems]) => {
                    const items = rawItems as BatchOutRecord[];
                    const isOpen = openBatchNames[bName] !== false;
                    const totalBatchBoxes = items.reduce((s, item) => s + item.boxesOut, 0);
                    const totalBatchKg = items.reduce((s, item) => s + item.totalKgOut, 0);

                    return (
                      <div
                        key={bName}
                        className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs"
                      >
                        {/* Clickable Header */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(setOpenBatchNames, bName)}
                          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-amber-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                {bName}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {items.length} size entry{items.length > 1 ? 'ies' : ''} in batch
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-slate-500 block">
                              {totalBatchBoxes} boxes out
                            </span>
                            <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                              {totalBatchKg.toFixed(2)} kg
                            </span>
                          </div>
                        </button>

                        {/* Batch Content when open */}
                        {isOpen && (
                          <div className="bg-white dark:bg-slate-900 p-3 space-y-3">
                            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                              {bName} consists of:
                            </p>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {items.map((b) => (
                                <div key={b.id} className="py-2.5 px-1 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">{b.size}</span>
                                    <span className="text-slate-500 text-[11px]">
                                      {b.boxesOut} boxes @ {b.kgPerBox} kg/box
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-amber-600">{b.totalKgOut.toFixed(2)} kg</span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingBatchOut(b)}
                                      className="text-slate-400 hover:text-indigo-600 p-1"
                                      title="Edit batch"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBatchOut(b.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1"
                                      title="Delete batch"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 4: SALES SLIP --- */}
        {activeTab === 'sales_slip' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Buyer sales slip log
              </h2>

              <form onSubmit={handleSecureSalesEntry} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    FISH SIZE GROUP
                  </label>
                  <select
                    value={slipSizeGroup}
                    onChange={(e) => setSlipSizeGroup(e.target.value as FishSizeCode)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold outline-none"
                  >
                    {FISH_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    SALE CLASSIFICATION
                  </label>
                  <select
                    value={slipClassification}
                    onChange={(e) => setSlipClassification(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold outline-none"
                  >
                    <option value="Main broker / buyer bulk">Main broker / buyer bulk</option>
                    <option value="Direct Wholesaler">Direct Wholesaler</option>
                    <option value="Consignment Trader">Consignment Trader</option>
                    <option value="Processed / Dried Fish">Processed / Dried Fish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    TOTAL BOXES
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={slipTotalBoxes}
                    onChange={(e) => setSlipTotalBoxes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    ACKNOWLEDGED NET KILOS (PER BOX)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={slipAckNetKg}
                    onChange={(e) => setSlipAckNetKg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    LOOSE KILOGRAMS (OPTIONAL)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 4.00"
                    value={slipLooseKg}
                    onChange={(e) => setSlipLooseKg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none text-amber-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    PRICE PER KILO (₱)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={slipPricePerKg}
                    onChange={(e) => setSlipPricePerKg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="incKg"
                    checked={slipIncludeTotalKg}
                    onChange={(e) => setSlipIncludeTotalKg(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <label htmlFor="incKg" className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    Include in total kg?
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  Uncheck for damaged/rejected fish not counted in harvest total
                </p>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Secure sales entry</span>
                </button>
              </form>
            </div>

            {/* Slip History Grouped By Size */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                SLIP HISTORY (GROUPED BY SIZE & CATEGORIES)
              </h3>

              <div className="space-y-4">
                {Object.keys(groupedSalesSlips).length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No buyer sales slips logged yet.
                  </div>
                ) : (
                  (Object.entries(groupedSalesSlips) as [string, SalesSlipRecord[]][]).map(([size, slips]) => {
                    const isOpen = openSlipSizes[size] !== false;
                    const groupTotalBoxes = slips.reduce((s, item) => s + item.totalBoxes, 0);
                    const groupTotalKg = slips.reduce(
                      (s, item) => s + (item.totalBoxes * item.acknowledgedNetKg) + (item.looseKg || 0),
                      0
                    );
                    const groupTotalAmt = slips.reduce((s, item) => s + item.totalAmount, 0);

                    // Group by kg per box and loose
                    const catMap: Record<number, { boxes: number; totalKg: number; price: number; amount: number }> = {};
                    let totalLooseKg = 0;
                    let totalLooseAmt = 0;
                    let loosePrice = 0;

                    slips.forEach((item) => {
                      if (item.totalBoxes > 0 && item.acknowledgedNetKg > 0) {
                        const kgKey = item.acknowledgedNetKg;
                        if (!catMap[kgKey]) {
                          catMap[kgKey] = { boxes: 0, totalKg: 0, price: item.pricePerKg, amount: 0 };
                        }
                        const boxedKg = item.totalBoxes * item.acknowledgedNetKg;
                        catMap[kgKey].boxes += item.totalBoxes;
                        catMap[kgKey].totalKg += boxedKg;
                        catMap[kgKey].amount += item.totalAmount;
                      }
                      if (item.looseKg && item.looseKg > 0) {
                        totalLooseKg += item.looseKg;
                        const lAmt = item.looseKg * item.pricePerKg;
                        totalLooseAmt += lAmt;
                        loosePrice = item.pricePerKg;
                      }
                    });

                    return (
                      <div
                        key={size}
                        className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs"
                      >
                        {/* Clickable Header */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(setOpenSlipSizes, size)}
                          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                {size}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {slips.length} sales slip{slips.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-slate-500 block">
                              {groupTotalBoxes} boxes • {groupTotalKg.toFixed(2)} kg
                            </span>
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                              ₱{groupTotalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </button>

                        {/* Accordion Body */}
                        {isOpen && (
                          <div className="bg-white dark:bg-slate-900 p-3 space-y-3">
                            {/* Sub-categorized summary */}
                            <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1.5">
                              <span className="font-bold uppercase text-[10px] text-indigo-800 dark:text-indigo-300 block mb-1">
                                Categorized Sales Summary ({size}):
                              </span>
                              {Object.entries(catMap).map(([kgBoxStr, data]) => (
                                <div key={kgBoxStr} className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300">
                                  <span>• {data.boxes} box{data.boxes > 1 ? 'es' : ''} @ {parseFloat(kgBoxStr).toFixed(2)} kg/box (₱{data.price.toFixed(2)}/kg)</span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {data.totalKg.toFixed(2)} kg (₱{data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                                  </span>
                                </div>
                              ))}
                              {totalLooseKg > 0 && (
                                <div className="flex items-center justify-between font-medium text-amber-700 dark:text-amber-400 pt-1 border-t border-indigo-200/50 dark:border-indigo-900/50">
                                  <span>• Loose kg ({totalLooseKg.toFixed(2)} kg @ ₱{loosePrice.toFixed(2)}/kg)</span>
                                  <span className="font-bold">
                                    ₱{totalLooseAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Individual Sales Slips */}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {slips.map((item) => (
                                <div key={item.id} className="py-2.5 px-1 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">
                                      {item.totalBoxes > 0
                                        ? `${item.totalBoxes} boxes @ ${item.acknowledgedNetKg.toFixed(2)} kg/box`
                                        : 'Loose Sales'}
                                      {item.looseKg ? ` • Loose: ${item.looseKg} kg` : ''}
                                    </span>
                                    <span className="text-slate-500 text-[11px]">
                                      Price: ₱{item.pricePerKg.toFixed(2)}/kg • {item.classification}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-indigo-600 dark:text-indigo-400">
                                      ₱{item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSalesSlip(item)}
                                      className="text-slate-400 hover:text-indigo-600 p-1"
                                      title="Edit sales slip"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSalesSlip(item.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1"
                                      title="Delete sales slip"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 6: WALK-IN --- */}
        {activeTab === 'walk_in' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Walk-in retail sales
              </h2>

              <form onSubmit={handleLogWalkIn} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    FISH SIZE
                  </label>
                  <select
                    value={walkSize}
                    onChange={(e) => setWalkSize(e.target.value as FishSizeCode)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold outline-none"
                  >
                    {FISH_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    KILOGRAMS SOLD
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={walkKgSold}
                    onChange={(e) => setWalkKgSold(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    AMOUNT (₱)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={walkAmount}
                    onChange={(e) => setWalkAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="walkIncKg"
                    checked={walkIncludeTotalKg}
                    onChange={(e) => setWalkIncludeTotalKg(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-600"
                  />
                  <label htmlFor="walkIncKg" className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    Include in total kg?
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>💰 Log sale</span>
                </button>
              </form>
            </div>

            {/* Walk-in History */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                WALK-IN HISTORY (GROUPED BY SIZE)
              </h3>

              {walkInSales.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No walk-in sales yet
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {walkInSales.map((w) => (
                    <div key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{w.size}</span>
                        <span className="text-slate-500">{w.kgSold.toFixed(2)} kg sold</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-600">
                          ₱{w.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingWalkIn(w)}
                          className="text-slate-400 hover:text-indigo-600 p-1"
                          title="Edit walk-in sale"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWalkIn(w.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete walk-in sale"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 7: SETTLEMENT --- */}
        {activeTab === 'settlement' && (
          <div className="space-y-6">
            {/* Top Settlement Key Metrics Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Grand Buyer Sales Total
                </span>
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  ₱{totals.buyerSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Sum of all buyer sales slips
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Sub Total (Less 5% Fee)
                </span>
                <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                  ₱{totals.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Grand Total - Buyer's 5%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Net Sales
                </span>
                <p className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-400">
                  ₱{totals.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Sub total + Walk-in ({includeWalkInInSettlement ? 'Included' : 'Excluded'})
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-teal-600 text-white shadow-md col-span-2 lg:col-span-1">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-100 block mb-1">
                  Net Owner Payout
                </span>
                <p className="text-xl sm:text-2xl font-black text-white">
                  ₱{totals.netPayoutPHP.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-teal-200 mt-1 block">
                  Final Net Sales Payout
                </span>
              </div>
            </div>

            {/* Section 1: Settlement Master Breakdown Accordion */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Settlement master breakdown
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="incWalkInSettlement"
                    checked={includeWalkInInSettlement}
                    onChange={(e) => setIncludeWalkInInSettlement(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-600 cursor-pointer"
                  />
                  <label htmlFor="incWalkInSettlement" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Include walk-in sales in settlement
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                {FISH_SIZES.map((sz) => {
                  const slipsForSize = salesSlips.filter((s) => s.sizeGroup === sz);
                  if (slipsForSize.length === 0) return null;

                  const totalBoxesForSize = slipsForSize.reduce((s, item) => s + item.totalBoxes, 0);
                  const totalKgForSize = slipsForSize.reduce(
                    (s, item) => s + item.totalBoxes * item.acknowledgedNetKg + (item.looseKg || 0),
                    0
                  );
                  const grossAmtForSize = slipsForSize.reduce((s, item) => s + item.totalAmount, 0);

                  const isOpen = openSettlementSizes[sz] !== false;

                  return (
                    <div key={sz} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                      {/* Clickable Header Row for Size Group */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(setOpenSettlementSizes, sz)}
                        className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">{sz}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-500 block">
                            {totalBoxesForSize} boxes • {totalKgForSize.toFixed(2)} kg
                          </span>
                          <span className="font-black text-teal-700 dark:text-teal-400 text-sm">
                            ₱{grossAmtForSize.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </button>

                      {/* Sub-groupings when open */}
                      {isOpen && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {slipsForSize.map((slip) => {
                          const isLoose = slip.totalBoxes === 0 || (slip.looseKg && slip.looseKg > 0);
                          const kgBoxLabel = isLoose ? '0.00 kg/box' : `${slip.acknowledgedNetKg.toFixed(2)} kg/box`;
                          const boxCountText = slip.totalBoxes > 0 ? `${slip.totalBoxes} boxes` : '0 boxes';
                          const kgAmount = slip.totalBoxes > 0 ? slip.totalBoxes * slip.acknowledgedNetKg : (slip.looseKg || slip.acknowledgedNetKg);

                          return (
                            <div key={slip.id} className="p-3.5 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-teal-600 dark:text-teal-400 font-bold text-xs">▲ {kgBoxLabel}</span>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <span className="text-slate-500 text-[11px]">
                                    {boxCountText} • {kgAmount.toFixed(2)} kg
                                  </span>
                                  <span className="font-bold text-teal-700 dark:text-teal-400">
                                    ₱{slip.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSalesSlip(slip)}
                                      className="p-1 text-slate-400 hover:text-indigo-600"
                                      title="Edit entry"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSalesSlip(slip.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Detail Table Row */}
                              <div className="grid grid-cols-5 gap-2 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase">BOXES</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{boxCountText}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase">KG/BOX</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {isLoose ? '0.00 kg' : `${slip.acknowledgedNetKg.toFixed(2)} kg`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase">TOTAL KG</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{kgAmount.toFixed(2)} kg</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase">PRICE/KG</span>
                                  <span className="font-bold text-teal-600 dark:text-teal-400">₱{slip.pricePerKg.toFixed(2)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase">AMOUNT</span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    ₱{slip.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      )}
                    </div>
                  );
                })}

                {/* Grand Total Footer for Buyer Sales */}
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  <span>Grand total (buyer sales)</span>
                  <div className="text-right">
                    <span className="text-slate-500 mr-3 text-xs">
                      {totals.rawTotalBoxes} boxes • {totals.soldTotalKg.toFixed(2)} kg
                    </span>
                    <span className="text-teal-600 dark:text-teal-400 font-black text-base">
                      ₱{totals.buyerSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: SETTLEMENT MASTER SHEET (Dark Card) */}
            <div className="p-6 rounded-2xl bg-[#0f172a] dark:bg-slate-950 text-white shadow-2xl space-y-5 border border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-teal-400 tracking-wider uppercase">
                  SETTLEMENT MASTER SHEET
                </h2>
                <p className="text-xs text-slate-400">Consolidated harvest reconciliation & payout sheet</p>
              </div>

              {/* Harvest Metadata Inputs */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
                  HARVEST DETAILS & METADATA
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Date of Harvest
                    </label>
                    <input
                      type="date"
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white font-bold text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Cycle Number / How Many Cycle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cycle 1"
                      value={harvestCycle}
                      onChange={(e) => setHarvestCycle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white font-bold text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      QTY of Fingerlings
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 50,000 pcs"
                      value={fingerlingsQty}
                      onChange={(e) => setFingerlingsQty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white font-bold text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Fish Cage Owner
                    </label>
                    <input
                      type="text"
                      value={cageOwnerName}
                      onChange={(e) => setCageOwnerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white font-bold text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  <input
                    type="checkbox"
                    id="incOwnerPrint"
                    checked={includeOwnerNameInPrint}
                    onChange={(e) => setIncludeOwnerNameInPrint(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-400 focus:ring-teal-400 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="incOwnerPrint" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Include metadata in printed document summary
                  </label>
                </div>
              </div>

              {/* Master Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[11px] tracking-wider">
                      <th className="py-2.5 px-2">DETAILS</th>
                      <th className="py-2.5 px-2 text-right">BOXES</th>
                      <th className="py-2.5 px-2 text-right">KG</th>
                      <th className="py-2.5 px-2 text-right">PRICE</th>
                      <th className="py-2.5 px-2 text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {FISH_SIZES.map((sz) => {
                      const slipsForSize = salesSlips.filter((s) => s.sizeGroup === sz);
                      if (slipsForSize.length === 0) return null;

                      const totalBoxes = slipsForSize.reduce((s, item) => s + item.totalBoxes, 0);
                      const totalKg = slipsForSize.reduce(
                        (s, item) => s + item.totalBoxes * item.acknowledgedNetKg + (item.looseKg || 0),
                        0
                      );
                      const grossAmt = slipsForSize.reduce((s, item) => s + item.totalAmount, 0);
                      const avgPrice = totalKg > 0 ? grossAmt / totalKg : 0;

                      return (
                        <tr key={sz} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-2 font-bold text-white flex items-center gap-1.5">
                            <span className="text-teal-400 text-[10px]">▼</span>
                            <span>{sz.replace(' (Oversized >500g)', '')}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right">{totalBoxes}</td>
                          <td className="py-2.5 px-2 text-right">{totalKg.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-right text-slate-300">₱{avgPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-teal-400">
                            ₱{grossAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="divide-y divide-slate-800/80">
                    {/* 1. Grand total (buyer sales) */}
                    <tr className="border-t border-slate-700 font-bold text-white bg-slate-900/60">
                      <td className="py-3 px-2 uppercase text-teal-400">Grand total (buyer sales)</td>
                      <td className="py-3 px-2 text-right text-teal-400">{totals.rawTotalBoxes}</td>
                      <td className="py-3 px-2 text-right text-teal-400">{totals.soldTotalKg.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right"></td>
                      <td className="py-3 px-2 text-right text-teal-400 font-black text-sm">
                        ₱{totals.buyerSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* 2. Less: Buyer's 5% */}
                    <tr className="text-amber-300">
                      <td colSpan={4} className="py-2.5 px-2 font-medium">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="applyBuyerComm"
                            checked={applyBuyerCommission}
                            onChange={(e) => setApplyBuyerCommission(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-amber-400 focus:ring-amber-400 bg-slate-800 border-slate-700 cursor-pointer"
                          />
                          <label htmlFor="applyBuyerComm" className="cursor-pointer">
                            Less: Buyer's {buyerCommissionPct}% Commission / Fee
                          </label>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-amber-400">
                        {applyBuyerCommission
                          ? `-₱${totals.buyerCommissionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '₱0.00 (Disabled)'}
                      </td>
                    </tr>

                    {/* 3. Sub total */}
                    <tr className="bg-slate-800/40 font-bold text-slate-100">
                      <td colSpan={4} className="py-2.5 px-2 text-slate-300 uppercase text-[11px] tracking-wide">
                        Sub total
                      </td>
                      <td className="py-2.5 px-2 text-right text-teal-300 font-black text-sm">
                        ₱{totals.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* 4. Walk-in sales toggle */}
                    <tr className="text-purple-300">
                      <td colSpan={4} className="py-2.5 px-2 font-medium">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="incWalkInSettlementTable"
                            checked={includeWalkInInSettlement}
                            onChange={(e) => setIncludeWalkInInSettlement(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-purple-400 focus:ring-purple-400 bg-slate-800 border-slate-700 cursor-pointer"
                          />
                          <label htmlFor="incWalkInSettlementTable" className="cursor-pointer flex items-center gap-1.5">
                            <span>Add: Walk-in Retail Sales</span>
                            <span className="text-[10px] text-purple-400/80">
                              ({includeWalkInInSettlement ? 'Toggle ON' : 'Toggle OFF'})
                            </span>
                          </label>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-purple-400">
                        {includeWalkInInSettlement
                          ? `+₱${totals.walkInTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '₱0.00 (Excluded)'}
                      </td>
                    </tr>

                    {/* 5. Net sales */}
                    <tr className="border-t border-slate-700 text-white font-black text-sm bg-teal-950/30">
                      <td colSpan={4} className="py-3 px-2 text-teal-300 uppercase tracking-wider">
                        Net sales
                      </td>
                      <td className="py-3 px-2 text-right text-teal-400 font-black text-base">
                        ₱{totals.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* 6. NET OWNER PAYOUT */}
                    <tr className="border-t-2 border-teal-500 text-white font-black text-base bg-teal-600/20">
                      <td colSpan={4} className="py-3.5 px-2 uppercase text-teal-300 tracking-wider">
                        NET OWNER PAYOUT
                      </td>
                      <td className="py-3.5 px-2 text-right text-teal-300 font-black text-lg">
                        ₱{totals.netPayoutPHP.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 8: RECOVERY (EXPLICITLY REQUESTED) --- */}
        {activeTab === 'recovery' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            
            {/* Title Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-xl text-teal-600 dark:text-teal-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  System Recovery & Backup
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Auto-save indicator, raw JSON dump tools, manual state injection, and restore points for Fish Harvest Monitoring.
                </p>
              </div>
            </div>

            {harvestSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{harvestSuccess}</span>
              </div>
            )}

            {harvestError && (
              <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-semibold animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{harvestError}</span>
              </div>
            )}

            {/* Main Recovery Card matching uploaded reference screenshot */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              
              {/* "How this works" explanation box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm space-y-2.5">
                <h3 className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-2 text-sm">
                  How this works:
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">• Auto-Save ON —</span>
                    <span>Your data is automatically saved to browser storage every time you make a change. It survives closing, refreshing, and reopening the page.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">• Generate Dump —</span>
                    <span>Create a manual text backup for extra safety. Save this text to a file on your device.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">• Inject State —</span>
                    <span>Paste a previously saved dump to restore everything.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">• Clear Data —</span>
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
                    ref={harvestFileInputRef}
                    onChange={handleHarvestFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => harvestFileInputRef.current?.click()}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Load file into box</span>
                  </button>
                </div>

                <textarea
                  value={harvestBackupText}
                  onChange={(e) => setHarvestBackupText(e.target.value)}
                  placeholder="Click 'Generate Dump' to see your backup data, or paste a previous backup here to restore..."
                  rows={8}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
                />
              </div>

              {/* 3 Prominent Action Buttons matching screenshot design */}
              <div className="space-y-3 pt-2">
                {/* Button 1: GENERATE BACKUP DUMP */}
                <button
                  type="button"
                  onClick={handleGenerateHarvestDump}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>GENERATE BACKUP DUMP</span>
                </button>

                {/* Button 2: INJECT / RESTORE STATE */}
                <button
                  type="button"
                  onClick={handleInjectHarvestState}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>INJECT / RESTORE STATE</span>
                </button>

                {/* Button 3: CLEAR ALL DATA */}
                <button
                  type="button"
                  onClick={handleClearAllHarvestData}
                  className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>CLEAR ALL DATA</span>
                </button>
              </div>

            </div>

            {/* Reset to Sample Data */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Reset to Initial Sample Data
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reverts data back to original sample values (8,357 kg total across sorting & sales).
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetToSampleData}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Reset Sample Data
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  </div>

      {/* --- EDIT RAW BOX MODAL --- */}
      {editingRawBox && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-teal-600" /> Edit Raw Box Sorting Entry
              </h3>
              <button
                type="button"
                onClick={() => setEditingRawBox(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fish Size</label>
                <select
                  value={editingRawBox.size}
                  onChange={(e) => setEditingRawBox({ ...editingRawBox, size: e.target.value as FishSizeCode })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-semibold"
                >
                  {FISH_SIZES.map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Number of Boxes</label>
                <input
                  type="number"
                  step="any"
                  value={editingRawBox.boxes}
                  onChange={(e) => setEditingRawBox({ ...editingRawBox, boxes: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kg / Box</label>
                <input
                  type="number"
                  step="any"
                  value={editingRawBox.kgPerBox}
                  onChange={(e) => setEditingRawBox({ ...editingRawBox, kgPerBox: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Loose Kg (Optional)</label>
                <input
                  type="number"
                  step="any"
                  value={editingRawBox.looseKg || 0}
                  onChange={(e) => setEditingRawBox({ ...editingRawBox, looseKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRawBox(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditRawBox(editingRawBox)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT BATCH OUT MODAL --- */}
      {editingBatchOut && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-500" /> Edit Batch Out Record
              </h3>
              <button
                type="button"
                onClick={() => setEditingBatchOut(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Batch Name</label>
                <input
                  type="text"
                  value={editingBatchOut.batchName}
                  onChange={(e) => setEditingBatchOut({ ...editingBatchOut, batchName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fish Size</label>
                <select
                  value={editingBatchOut.size}
                  onChange={(e) => setEditingBatchOut({ ...editingBatchOut, size: e.target.value as FishSizeCode })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-semibold"
                >
                  {FISH_SIZES.map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Boxes Out</label>
                <input
                  type="number"
                  step="any"
                  value={editingBatchOut.boxesOut}
                  onChange={(e) => setEditingBatchOut({ ...editingBatchOut, boxesOut: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kg / Box</label>
                <input
                  type="number"
                  step="any"
                  value={editingBatchOut.kgPerBox}
                  onChange={(e) => setEditingBatchOut({ ...editingBatchOut, kgPerBox: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingBatchOut(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditBatchOut(editingBatchOut)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT SALES SLIP MODAL --- */}
      {editingSalesSlip && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" /> Edit Buyer Sales Slip
              </h3>
              <button
                type="button"
                onClick={() => setEditingSalesSlip(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fish Size Group</label>
                <select
                  value={editingSalesSlip.sizeGroup}
                  onChange={(e) => setEditingSalesSlip({ ...editingSalesSlip, sizeGroup: e.target.value as FishSizeCode })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-semibold"
                >
                  {FISH_SIZES.map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Sale Classification</label>
                <select
                  value={editingSalesSlip.classification}
                  onChange={(e) => setEditingSalesSlip({ ...editingSalesSlip, classification: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                >
                  <option value="Main broker / buyer bulk">Main broker / buyer bulk</option>
                  <option value="Direct Wholesaler">Direct Wholesaler</option>
                  <option value="Consignment Trader">Consignment Trader</option>
                  <option value="Processed / Dried Fish">Processed / Dried Fish</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Total Boxes</label>
                  <input
                    type="number"
                    step="any"
                    value={editingSalesSlip.totalBoxes}
                    onChange={(e) => setEditingSalesSlip({ ...editingSalesSlip, totalBoxes: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kg / Box</label>
                  <input
                    type="number"
                    step="any"
                    value={editingSalesSlip.acknowledgedNetKg}
                    onChange={(e) => setEditingSalesSlip({ ...editingSalesSlip, acknowledgedNetKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Loose Kg (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingSalesSlip.looseKg || ''}
                    onChange={(e) => setEditingSalesSlip({ ...editingSalesSlip, looseKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Price Per Kg (₱)</label>
                <input
                  type="number"
                  step="any"
                  value={editingSalesSlip.pricePerKg}
                  onChange={(e) => setEditingSalesSlip({ ...editingSalesSlip, pricePerKg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-teal-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIncKg"
                  checked={editingSalesSlip.includeInTotalKg}
                  onChange={(e) => setEditingSalesSlip({ ...editingSalesSlip, includeInTotalKg: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="editIncKg" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  Include in total kg?
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSalesSlip(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditSalesSlip(editingSalesSlip)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT WALK-IN SALE MODAL --- */}
      {editingWalkIn && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-purple-600" /> Edit Walk-in Retail Sale
              </h3>
              <button
                type="button"
                onClick={() => setEditingWalkIn(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fish Size</label>
                <select
                  value={editingWalkIn.size}
                  onChange={(e) => setEditingWalkIn({ ...editingWalkIn, size: e.target.value as FishSizeCode })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-semibold"
                >
                  {FISH_SIZES.map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kilograms Sold</label>
                <input
                  type="number"
                  step="any"
                  value={editingWalkIn.kgSold}
                  onChange={(e) => setEditingWalkIn({ ...editingWalkIn, kgSold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Amount (₱)</label>
                <input
                  type="number"
                  step="any"
                  value={editingWalkIn.amount}
                  onChange={(e) => setEditingWalkIn({ ...editingWalkIn, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editWalkIncKg"
                  checked={editingWalkIn.includeInTotalKg}
                  onChange={(e) => setEditingWalkIn({ ...editingWalkIn, includeInTotalKg: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-600"
                />
                <label htmlFor="editWalkIncKg" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  Include in total kg?
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingWalkIn(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditWalkIn(editingWalkIn)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            {/* Modal Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-400/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <Fish className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Settlement Master Sheet Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Exact print and document reconciliation copy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleTriggerPrint();
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* --- PRINTABLE SETTLEMENT MASTER SHEET DOCUMENT --- */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 space-y-6">
              {/* Document Header */}
              <div className="border-b border-slate-800 pb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-teal-400 tracking-wider uppercase">
                    FISH HARVEST SETTLEMENT MASTER SHEET
                  </h2>
                  <p className="text-xs text-slate-400">
                    Consolidated harvest reconciliation & owner payout statement
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  <span>Generated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Date of Harvest
                  </span>
                  <span className="font-extrabold text-white">{harvestDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Harvest Cycle
                  </span>
                  <span className="font-extrabold text-white">{harvestCycle || 'Cycle 1'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    QTY of Fingerlings
                  </span>
                  <span className="font-extrabold text-white">{fingerlingsQty || '50,000'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Fish Cage Owner
                  </span>
                  <span className="font-extrabold text-teal-300">{cageOwnerName || 'LIIT'}</span>
                </div>
              </div>

              {/* Master Settlement Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 uppercase font-bold text-[11px] tracking-wider">
                      <th className="py-3 px-3">DETAILS / FISH SIZE</th>
                      <th className="py-3 px-3 text-right">BOXES</th>
                      <th className="py-3 px-3 text-right">NET KG</th>
                      <th className="py-3 px-3 text-right">AVG PRICE / KG</th>
                      <th className="py-3 px-3 text-right">GROSS AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {FISH_SIZES.map((sz) => {
                      const slipsForSize = salesSlips.filter((s) => s.sizeGroup === sz);
                      if (slipsForSize.length === 0) return null;

                      const totalBoxes = slipsForSize.reduce((s, item) => s + item.totalBoxes, 0);
                      const totalKg = slipsForSize.reduce(
                        (s, item) => s + item.totalBoxes * item.acknowledgedNetKg + (item.looseKg || 0),
                        0
                      );
                      const grossAmt = slipsForSize.reduce((s, item) => s + item.totalAmount, 0);
                      const avgPrice = totalKg > 0 ? grossAmt / totalKg : 0;

                      return (
                        <tr key={sz} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                            <span className="text-teal-400 text-[10px]">▼</span>
                            <span>{sz.replace(' (Oversized >500g)', '')}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium">{totalBoxes}</td>
                          <td className="py-2.5 px-3 text-right font-medium">{totalKg.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-300">₱{avgPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-teal-300">
                            ₱{grossAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="divide-y divide-slate-800/80">
                    {/* 1. Grand total (buyer sales) */}
                    <tr className="border-t border-slate-700 font-bold text-white bg-slate-900/80">
                      <td className="py-3 px-3 uppercase text-teal-400">Grand total (buyer sales)</td>
                      <td className="py-3 px-3 text-right text-teal-400">{totals.rawTotalBoxes}</td>
                      <td className="py-3 px-3 text-right text-teal-400">{totals.soldTotalKg.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right"></td>
                      <td className="py-3 px-3 text-right text-teal-400 font-black text-sm">
                        ₱{totals.buyerSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* 2. Less: Buyer's 5% */}
                    <tr className="text-amber-300 bg-amber-950/20">
                      <td colSpan={4} className="py-2.5 px-3 font-medium">
                        Less: Buyer's {buyerCommissionPct}% Commission / Fee
                        {!applyBuyerCommission && <span className="text-xs text-amber-400/70 ml-2">(Disabled)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                        {applyBuyerCommission
                          ? `-₱${totals.buyerCommissionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '₱0.00'}
                      </td>
                    </tr>

                    {/* 3. Sub total */}
                    <tr className="bg-slate-900/50 font-bold text-slate-100">
                      <td colSpan={4} className="py-2.5 px-3 text-slate-300 uppercase text-[11px] tracking-wide">
                        Sub total
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-300 font-black text-sm">
                        ₱{totals.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* 4. Add: Walk-in Retail Sales */}
                    <tr className="text-purple-300 bg-purple-950/20">
                      <td colSpan={4} className="py-2.5 px-3 font-medium">
                        Add: Walk-in Retail Sales
                        {!includeWalkInInSettlement && <span className="text-xs text-purple-400/70 ml-2">(Excluded by Toggle)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-purple-300">
                        {includeWalkInInSettlement
                          ? `+₱${totals.walkInTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '₱0.00'}
                      </td>
                    </tr>

                    {/* 5. Net sales */}
                    <tr className="border-t border-slate-700 text-white font-black text-sm bg-teal-950/30">
                      <td colSpan={4} className="py-3 px-3 text-teal-300 uppercase tracking-wider">
                        Net sales
                      </td>
                      <td className="py-3 px-3 text-right text-teal-400 font-black text-base">
                        ₱{totals.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* 6. NET OWNER PAYOUT */}
                    <tr className="border-t-2 border-teal-500 text-white font-black text-base bg-teal-600/30">
                      <td colSpan={4} className="py-3.5 px-3 uppercase text-teal-300 tracking-wider">
                        NET OWNER PAYOUT
                      </td>
                      <td className="py-3.5 px-3 text-right text-teal-300 font-black text-lg">
                        ₱{totals.netPayoutPHP.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Physical Reconciliation Summary */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Raw Boxes Harvested</span>
                  <span className="font-bold text-white">{totals.rawTotalBoxes} boxes ({totals.rawTotalKg.toFixed(2)} kg)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Weight Sold</span>
                  <span className="font-bold text-white">{totals.soldTotalKg.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Weight Variance</span>
                  <span className={`font-bold ${totals.varianceKg < 0 ? 'text-rose-400' : 'text-teal-400'}`}>
                    {totals.varianceKg >= 0 ? '+' : ''}{totals.varianceKg.toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTriggerPrint();
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <Printer className="w-4 h-4 text-emerald-200" />
                <span>Print Master Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
