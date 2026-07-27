import {
  RawBoxEntry,
  BatchOutRecord,
  SalesSlipRecord,
  WalkInSaleRecord,
  HarvestDeductionRecord,
  FishHarvestBackupFile,
} from '../types';

const RAW_BOXES_KEY = 'fish_harvest_raw_boxes_v1';
const BATCH_OUTS_KEY = 'fish_harvest_batch_outs_v1';
const SALES_SLIPS_KEY = 'fish_harvest_sales_slips_v1';
const WALKIN_SALES_KEY = 'fish_harvest_walkin_sales_v1';

export const INITIAL_SAMPLE_RAW_BOXES: RawBoxEntry[] = [
  {
    id: 'raw-os-30',
    size: 'OS (Oversized >500g)',
    boxes: 2,
    kgPerBox: 30.0,
    looseKg: 0,
    totalKg: 60.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'raw-os-34',
    size: 'OS (Oversized >500g)',
    boxes: 2,
    kgPerBox: 34.0,
    looseKg: 0,
    totalKg: 68.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'raw-os-loose',
    size: 'OS (Oversized >500g)',
    boxes: 0,
    kgPerBox: 0,
    looseKg: 4.0,
    totalKg: 4.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'raw-1',
    size: '2-1',
    boxes: 185,
    kgPerBox: 34.0,
    looseKg: 25.0,
    totalKg: 6315.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'raw-2',
    size: '5-2',
    boxes: 44,
    kgPerBox: 34.0,
    looseKg: 25.0,
    totalKg: 1521.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'raw-3',
    size: '3-1',
    boxes: 8,
    kgPerBox: 34.0,
    looseKg: 2.0,
    totalKg: 274.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'raw-4',
    size: '4-1',
    boxes: 4,
    kgPerBox: 34.0,
    looseKg: 29.0,
    totalKg: 165.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'raw-5',
    size: 'Daing / Rejects',
    boxes: 2,
    kgPerBox: 34.0,
    looseKg: 14.0,
    totalKg: 82.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
];

export const INITIAL_SAMPLE_BATCH_OUTS: BatchOutRecord[] = [
  {
    id: 'batch-1-os',
    batchName: 'Batch 1',
    size: 'OS (Oversized >500g)',
    boxesOut: 2,
    kgPerBox: 30.0,
    totalKgOut: 60.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'batch-1-21',
    batchName: 'Batch 1',
    size: '2-1',
    boxesOut: 100,
    kgPerBox: 34.0,
    totalKgOut: 3400.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'batch-2-os',
    batchName: 'Batch 2',
    size: 'OS (Oversized >500g)',
    boxesOut: 2,
    kgPerBox: 34.0,
    totalKgOut: 68.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'batch-2-52',
    batchName: 'Batch 2',
    size: '5-2',
    boxesOut: 44,
    kgPerBox: 34.0,
    totalKgOut: 1496.0,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
];

export const INITIAL_SAMPLE_SALES_SLIPS: SalesSlipRecord[] = [
  // OS (Oversized >500g)
  {
    id: 'slip-os-30',
    sizeGroup: 'OS (Oversized >500g)',
    classification: 'Main broker / buyer bulk',
    totalBoxes: 2,
    acknowledgedNetKg: 30.0,
    looseKg: 0,
    pricePerKg: 160.0,
    totalAmount: 9600.0,
    includeInTotalKg: true,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'slip-os-34',
    sizeGroup: 'OS (Oversized >500g)',
    classification: 'Main broker / buyer bulk',
    totalBoxes: 2,
    acknowledgedNetKg: 34.0,
    looseKg: 0,
    pricePerKg: 160.0,
    totalAmount: 10880.0,
    includeInTotalKg: true,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'slip-os-loose',
    sizeGroup: 'OS (Oversized >500g)',
    classification: 'Main broker / buyer bulk',
    totalBoxes: 0,
    acknowledgedNetKg: 0,
    looseKg: 4.0,
    pricePerKg: 160.0,
    totalAmount: 640.0,
    includeInTotalKg: true,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  // 2-1 (Loose + Boxed)
  {
    id: 'slip-21-box',
    sizeGroup: '2-1',
    classification: 'Main broker / buyer bulk',
    totalBoxes: 185,
    acknowledgedNetKg: 34.0,
    looseKg: 25.0,
    pricePerKg: 145.0,
    totalAmount: 915675.0,
    includeInTotalKg: true,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  // 5-2 (Loose + Boxed)
  {
    id: 'slip-52-box',
    sizeGroup: '5-2',
    classification: 'Main broker / buyer bulk',
    totalBoxes: 44,
    acknowledgedNetKg: 34.0,
    looseKg: 25.0,
    pricePerKg: 135.0,
    totalAmount: 205335.0,
    includeInTotalKg: true,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  // 3-1 (Loose + Boxed)
  {
    id: 'slip-31-box',
    sizeGroup: '3-1',
    classification: 'Main broker / buyer bulk',
    totalBoxes: 8,
    acknowledgedNetKg: 34.0,
    looseKg: 2.0,
    pricePerKg: 125.0,
    totalAmount: 34250.0,
    includeInTotalKg: true,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  // 4-1 (Loose + Boxed)
  {
    id: 'slip-41-box',
    sizeGroup: '4-1',
    classification: 'Main broker / buyer bulk',
    totalBoxes: 4,
    acknowledgedNetKg: 34.0,
    looseKg: 29.0,
    pricePerKg: 115.0,
    totalAmount: 18975.0,
    includeInTotalKg: true,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
  // Daing (Loose + Boxed)
  {
    id: 'slip-daing-box',
    sizeGroup: 'Daing / Rejects',
    classification: 'Processed / Dried fish buyer',
    totalBoxes: 2,
    acknowledgedNetKg: 34.0,
    looseKg: 14.0,
    pricePerKg: 90.0,
    totalAmount: 7380.0,
    includeInTotalKg: true,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  },
];

export const INITIAL_SAMPLE_WALKIN_SALES: WalkInSaleRecord[] = [];

export const INITIAL_SAMPLE_DEDUCTIONS: HarvestDeductionRecord[] = [];

const DEDUCTIONS_KEY = 'fish_harvest_deductions_v1';

export function loadStoredDeductions(): HarvestDeductionRecord[] {
  try {
    const raw = localStorage.getItem(DEDUCTIONS_KEY);
    if (!raw) {
      localStorage.setItem(DEDUCTIONS_KEY, JSON.stringify(INITIAL_SAMPLE_DEDUCTIONS));
      return INITIAL_SAMPLE_DEDUCTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading deductions:', err);
    return INITIAL_SAMPLE_DEDUCTIONS;
  }
}

export function saveDeductionsToStorage(records: HarvestDeductionRecord[]): void {
  try {
    localStorage.setItem(DEDUCTIONS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving deductions:', err);
  }
}

export function loadStoredRawBoxes(): RawBoxEntry[] {
  try {
    const raw = localStorage.getItem(RAW_BOXES_KEY);
    if (!raw) {
      localStorage.setItem(RAW_BOXES_KEY, JSON.stringify(INITIAL_SAMPLE_RAW_BOXES));
      return INITIAL_SAMPLE_RAW_BOXES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading raw boxes:', err);
    return INITIAL_SAMPLE_RAW_BOXES;
  }
}

export function saveRawBoxesToStorage(records: RawBoxEntry[]): void {
  try {
    localStorage.setItem(RAW_BOXES_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving raw boxes:', err);
  }
}

export function loadStoredBatchOuts(): BatchOutRecord[] {
  try {
    const raw = localStorage.getItem(BATCH_OUTS_KEY);
    if (!raw) {
      localStorage.setItem(BATCH_OUTS_KEY, JSON.stringify(INITIAL_SAMPLE_BATCH_OUTS));
      return INITIAL_SAMPLE_BATCH_OUTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading batch outs:', err);
    return INITIAL_SAMPLE_BATCH_OUTS;
  }
}

export function saveBatchOutsToStorage(records: BatchOutRecord[]): void {
  try {
    localStorage.setItem(BATCH_OUTS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving batch outs:', err);
  }
}

export function loadStoredSalesSlips(): SalesSlipRecord[] {
  try {
    const raw = localStorage.getItem(SALES_SLIPS_KEY);
    if (!raw) {
      localStorage.setItem(SALES_SLIPS_KEY, JSON.stringify(INITIAL_SAMPLE_SALES_SLIPS));
      return INITIAL_SAMPLE_SALES_SLIPS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading sales slips:', err);
    return INITIAL_SAMPLE_SALES_SLIPS;
  }
}

export function saveSalesSlipsToStorage(records: SalesSlipRecord[]): void {
  try {
    localStorage.setItem(SALES_SLIPS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving sales slips:', err);
  }
}

export function loadStoredWalkInSales(): WalkInSaleRecord[] {
  try {
    const raw = localStorage.getItem(WALKIN_SALES_KEY);
    if (!raw) {
      localStorage.setItem(WALKIN_SALES_KEY, JSON.stringify(INITIAL_SAMPLE_WALKIN_SALES));
      return INITIAL_SAMPLE_WALKIN_SALES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading walk-in sales:', err);
    return INITIAL_SAMPLE_WALKIN_SALES;
  }
}

export function saveWalkInSalesToStorage(records: WalkInSaleRecord[]): void {
  try {
    localStorage.setItem(WALKIN_SALES_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving walk-in sales:', err);
  }
}
