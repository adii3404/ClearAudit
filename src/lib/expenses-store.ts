import { Expense } from './types';

const DEFAULT_EXPENSES: Expense[] = [];

const LOCAL_STORAGE_KEY = 'clearaudit_expenses_v5';

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
