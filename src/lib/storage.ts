import { UserCredentials, ExpenseRequest, UserRole } from '../types';

export const STORAGE_KEYS = {
  USERS: 'clearaudit_users_v1',
  SESSION: 'clearaudit_session_v1',
  EXPENSES: 'clearaudit_expenses_v1',
  SAVED_SEARCH: 'clearaudit_admin_filter_v1'
} as const;

export const INITIAL_CREDENTIALS: Record<UserRole, UserCredentials> = {
  employee: {
    email: 'employee@clearaudit.internal',
    role: 'employee',
    passwordHash: 'password123',
    name: 'Sarah Lin',
    department: 'Engineering & Operations'
  },
  admin: {
    email: 'admin@clearaudit.internal',
    role: 'admin',
    passwordHash: 'adminpass123',
    name: 'Marcus Vance',
    department: 'Corporate Audit & Finance'
  }
};

/**
 * Initializes localStorage with default credentials if not present.
 */
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!existingUsers) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_CREDENTIALS));
    }

    const existingExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!existingExpenses) {
      // Empty initially as requested by prompt
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Failed to initialize ClearAudit localStorage:', err);
  }
}

/**
 * Retrieves the stored users/credentials
 */
export function getStoredUsers(): Record<UserRole, UserCredentials> {
  if (typeof window === 'undefined') return INITIAL_CREDENTIALS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading stored users:', e);
  }
  return INITIAL_CREDENTIALS;
}

/**
 * Updates a user's password in localStorage
 */
export function updateStoredPassword(role: UserRole, newPass: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const users = getStoredUsers();
    if (users[role]) {
      users[role].passwordHash = newPass;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      // Dispatch storage event for intra-tab updates
      window.dispatchEvent(new Event('clearaudit_users_updated'));
      return true;
    }
  } catch (e) {
    console.error('Error updating password:', e);
  }
  return false;
}

/**
 * Session storage helpers
 */
export function getStoredSession(): UserCredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const sess = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (sess) {
      return JSON.parse(sess);
    }
  } catch (e) {
    console.error('Error reading session:', e);
  }
  return null;
}

export function setStoredSession(user: UserCredentials | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    window.dispatchEvent(new Event('clearaudit_session_updated'));
  } catch (e) {
    console.error('Error writing session:', e);
  }
}

/**
 * Expenses persistence helpers
 */
export function getStoredExpenses(): ExpenseRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading expenses:', e);
  }
  return [];
}

export function saveStoredExpenses(expenses: ExpenseRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    window.dispatchEvent(new Event('clearaudit_expenses_updated'));
  } catch (e) {
    console.error('Error saving expenses:', e);
  }
}
