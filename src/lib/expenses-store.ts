import { Expense } from './types';
import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-init-001',
    userId: 'default-user',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%23171717"/><rect x="20" y="20" width="360" height="560" rx="12" fill="%230a0a0a" stroke="%23262626" stroke-width="2"/><text x="40" y="70" fill="%23ffffff" font-family="sans-serif" font-size="20" font-weight="bold">UBER TECHNOLOGIES</text><text x="40" y="95" fill="%23737373" font-family="sans-serif" font-size="12">TRIP RECEIPT - SUNDAY OCT 11, 2026</text><line x1="40" y1="120" x2="360" y2="120" stroke="%23262626" stroke-width="1"/><text x="40" y="160" fill="%23a3a3a3" font-family="sans-serif" font-size="14">UberX Trip Fare</text><text x="360" y="160" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="14">$37.00</text><text x="40" y="200" fill="%23a3a3a3" font-family="sans-serif" font-size="14">Airport Surcharge</text><text x="360" y="200" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="14">$5.50</text><line x1="40" y1="240" x2="360" y2="240" stroke="%23262626" stroke-dasharray="4" stroke-width="1"/><text x="40" y="280" fill="%23ffffff" font-family="sans-serif" font-size="16" font-weight="bold">TOTAL USD</text><text x="360" y="280" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="18" font-weight="bold">$42.50</text><rect x="40" y="320" width="320" height="60" rx="8" fill="%23262626" opacity="0.4"/><text x="56" y="355" fill="%23a3a3a3" font-family="sans-serif" font-size="12">Payment Method: Corporate Visa •••• 4242</text></svg>',
    userDescription: 'Airport transfer after client kickoff dinner',
    vendor_name: 'Uber Technologies',
    date_of_purchase: '2026-10-11',
    total_amount: 42.5,
    currency: 'USD',
    inferred_category: 'Travel & Transport',
    line_items: [
      { description: 'UberX Trip Fare', amount: 37.0 },
      { description: 'Airport Surcharge', amount: 5.5 },
    ],
    policy_violation: true,
    violation_reason: 'Weekend transaction detected (Sunday). Requires manager secondary approval per policy §4.2.',
    audit_confidence_score: 0.96,
    status: 'Pending',
    createdAt: new Date('2026-10-11T20:30:00Z'),
    updatedAt: new Date('2026-10-11T20:30:00Z'),
  },
  {
    id: 'exp-init-002',
    userId: 'default-user',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%23171717"/><rect x="20" y="20" width="360" height="560" rx="12" fill="%230a0a0a" stroke="%23262626" stroke-width="2"/><text x="40" y="70" fill="%23ffffff" font-family="sans-serif" font-size="20" font-weight="bold">BLUE BOTTLE BISTRO</text><text x="40" y="95" fill="%23737373" font-family="sans-serif" font-size="12">ORDER #8921 - MONDAY OCT 12, 2026</text><line x1="40" y1="120" x2="360" y2="120" stroke="%23262626" stroke-width="1"/><text x="40" y="150" fill="%23a3a3a3" font-family="sans-serif" font-size="14">Artisan Coffee (x4)</text><text x="360" y="150" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="14">$22.00</text><text x="40" y="180" fill="%23a3a3a3" font-family="sans-serif" font-size="14">Pastry Assortment</text><text x="360" y="180" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="14">$24.20</text><text x="40" y="210" fill="%23ef4444" font-family="sans-serif" font-size="14">Draft Beer (x2)</text><text x="360" y="210" text-anchor="end" fill="%23ef4444" font-family="sans-serif" font-size="14">$22.00</text><line x1="40" y1="240" x2="360" y2="240" stroke="%23262626" stroke-dasharray="4" stroke-width="1"/><text x="40" y="280" fill="%23ffffff" font-family="sans-serif" font-size="16" font-weight="bold">TOTAL USD</text><text x="360" y="280" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="18" font-weight="bold">$68.20</text><rect x="40" y="320" width="320" height="60" rx="8" fill="%23450a0a" stroke="%23991b1b" stroke-width="1"/><text x="56" y="355" fill="%23f87171" font-family="sans-serif" font-size="12">FLAGGED: Alcohol Line Items Prohibited</text></svg>',
    userDescription: 'Team technical architecture review breakfast & drinks',
    vendor_name: 'Blue Bottle Bistro',
    date_of_purchase: '2026-10-12',
    total_amount: 68.2,
    currency: 'USD',
    inferred_category: 'Meals & Entertainment',
    line_items: [
      { description: 'Artisan Coffee (x4)', amount: 22.0 },
      { description: 'Pastry Assortment', amount: 24.2 },
      { description: 'Draft Beer (x2)', amount: 22.0 },
    ],
    policy_violation: true,
    violation_reason: "Alcohol detected in line items ('Draft Beer $22.00') & Single meal limit of $50.00 exceeded.",
    audit_confidence_score: 0.99,
    status: 'Rejected',
    rejectionNote: 'Alcoholic beverages are non-reimbursable per policy §2.1. Please resubmit coffee & pastry items separately.',
    createdAt: new Date('2026-10-12T09:15:00Z'),
    updatedAt: new Date('2026-10-12T11:00:00Z'),
  },
  {
    id: 'exp-init-003',
    userId: 'default-user',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="100%" height="100%" fill="%23171717"/><rect x="20" y="20" width="360" height="560" rx="12" fill="%230a0a0a" stroke="%23262626" stroke-width="2"/><text x="40" y="70" fill="%23ffffff" font-family="sans-serif" font-size="20" font-weight="bold">DELTA AIR LINES</text><text x="40" y="95" fill="%23737373" font-family="sans-serif" font-size="12">E-TICKET RECEIPT #0067219</text><line x1="40" y1="120" x2="360" y2="120" stroke="%23262626" stroke-width="1"/><text x="40" y="160" fill="%23a3a3a3" font-family="sans-serif" font-size="14">Main Cabin Seat DL 1420</text><text x="360" y="160" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="14">$349.50</text><text x="40" y="200" fill="%23a3a3a3" font-family="sans-serif" font-size="14">Standard Baggage Fee</text><text x="360" y="200" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="14">$35.00</text><line x1="40" y1="240" x2="360" y2="240" stroke="%23262626" stroke-dasharray="4" stroke-width="1"/><text x="40" y="280" fill="%23ffffff" font-family="sans-serif" font-size="16" font-weight="bold">TOTAL USD</text><text x="360" y="280" text-anchor="end" fill="%23ffffff" font-family="sans-serif" font-size="18" font-weight="bold">$384.50</text><rect x="40" y="320" width="320" height="60" rx="8" fill="%23052e16" stroke="%23166534" stroke-width="1"/><text x="56" y="355" fill="%234ade80" font-family="sans-serif" font-size="12">COMPLIANT: Standard Economy Class Ticket</text></svg>',
    userDescription: 'Economy flight to Q4 Enterprise Architecture Summit in Chicago',
    vendor_name: 'Delta Air Lines',
    date_of_purchase: '2026-10-09',
    total_amount: 384.5,
    currency: 'USD',
    inferred_category: 'Travel & Transport',
    line_items: [
      { description: 'Main Cabin Seat DL 1420', amount: 349.5 },
      { description: 'Standard Baggage Fee', amount: 35.0 },
    ],
    policy_violation: false,
    violation_reason: null,
    audit_confidence_score: 0.98,
    status: 'Approved',
    createdAt: new Date('2026-10-09T14:20:00Z'),
    updatedAt: new Date('2026-10-10T10:00:00Z'),
  },
];

const LOCAL_STORAGE_KEY = 'clearaudit_expenses_v2';

export function getLocalExpenses(): Expense[] {
  if (typeof window === 'undefined') return DEFAULT_EXPENSES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_EXPENSES));
      return DEFAULT_EXPENSES;
    }
    const parsed = JSON.parse(raw);
    return parsed.map((e: Expense) => ({
      ...e,
      createdAt: new Date(e.createdAt),
      updatedAt: new Date(e.updatedAt),
    }));
  } catch {
    return DEFAULT_EXPENSES;
  }
}

export function saveLocalExpenses(expenses: Expense[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
    window.dispatchEvent(new Event('clearaudit_expenses_updated'));
  } catch (e) {
    console.error('Failed to save expenses locally', e);
  }
}

export function addLocalExpense(expense: Expense): Expense {
  const current = getLocalExpenses();
  const updated = [expense, ...current];
  saveLocalExpenses(updated);
  return expense;
}

export function updateLocalExpenseStatus(
  id: string,
  status: 'Approved' | 'Rejected',
  rejectionNote?: string
): Expense | null {
  const current = getLocalExpenses();
  const index = current.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const updatedExpense = {
    ...current[index],
    status,
    ...(rejectionNote ? { rejectionNote } : {}),
    updatedAt: new Date(),
  };

  current[index] = updatedExpense;
  saveLocalExpenses(current);
  return updatedExpense;
}
