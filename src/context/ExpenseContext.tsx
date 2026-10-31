import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ExpenseRequest, ExpenseCategory, ExpenseStatus } from '../types';
import { getStoredExpenses, saveStoredExpenses } from '../lib/storage';
import { generateReceiptToken } from '../lib/auditLogic';

interface CreateExpenseInput {
  employeeEmail: string;
  employeeName: string;
  description: string;
  amount: number;
  currency?: string;
  date: string;
  category: ExpenseCategory;
  receiptImage?: string;
  receiptFileName?: string;
}

interface ExpenseContextType {
  expenses: ExpenseRequest[];
  addExpense: (input: CreateExpenseInput) => ExpenseRequest;
  acceptExpense: (id: string, reviewer?: string) => void;
  rejectExpense: (id: string, reviewer?: string) => void;
  revokeExpense: (id: string, reason: string, reviewer?: string) => void;
  deleteExpense: (id: string) => void;
  seedDemoData: () => void;
  clearAllExpenses: () => void;
  getExpenseById: (id: string) => ExpenseRequest | undefined;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<ExpenseRequest[]>(() => getStoredExpenses());

  const refreshExpenses = useCallback(() => {
    setExpenses(getStoredExpenses());
  }, []);

  useEffect(() => {
    refreshExpenses();

    const handleStorage = () => refreshExpenses();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('clearaudit_expenses_updated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('clearaudit_expenses_updated', handleStorage);
    };
  }, [refreshExpenses]);

  const addExpense = useCallback(
    (input: CreateExpenseInput): ExpenseRequest => {
      const now = new Date().toISOString();
      const newExpense: ExpenseRequest = {
        id: 'exp_' + Math.random().toString(36).substring(2, 10),
        tokenNumber: generateReceiptToken(),
        employeeEmail: input.employeeEmail,
        employeeName: input.employeeName,
        description: input.description,
        amount: input.amount,
        currency: input.currency || 'INR',
        date: input.date,
        category: input.category,
        receiptImage: input.receiptImage,
        receiptFileName: input.receiptFileName || 'receipt_capture.png',
        status: 'Pending',
        submittedAt: now
      };

      const updated = [newExpense, ...getStoredExpenses()];
      saveStoredExpenses(updated);
      setExpenses(updated);
      return newExpense;
    },
    []
  );

  const acceptExpense = useCallback((id: string, reviewer: string = 'Admin Auditor') => {
    const list = getStoredExpenses();
    const updated = list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Accepted' as ExpenseStatus,
          updatedAt: new Date().toISOString(),
          reviewedBy: reviewer,
          revocationReason: undefined
        };
      }
      return item;
    });
    saveStoredExpenses(updated);
    setExpenses(updated);
  }, []);

  const rejectExpense = useCallback((id: string, reviewer: string = 'Admin Auditor') => {
    const list = getStoredExpenses();
    const updated = list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Rejected' as ExpenseStatus,
          updatedAt: new Date().toISOString(),
          reviewedBy: reviewer
        };
      }
      return item;
    });
    saveStoredExpenses(updated);
    setExpenses(updated);
  }, []);

  const revokeExpense = useCallback((id: string, reason: string, reviewer: string = 'Admin Auditor') => {
    const list = getStoredExpenses();
    const updated = list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Revoked' as ExpenseStatus,
          revocationReason: reason,
          updatedAt: new Date().toISOString(),
          reviewedBy: reviewer
        };
      }
      return item;
    });
    saveStoredExpenses(updated);
    setExpenses(updated);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    const list = getStoredExpenses();
    const updated = list.filter(item => item.id !== id);
    saveStoredExpenses(updated);
    setExpenses(updated);
  }, []);

  const seedDemoData = useCallback(() => {
    const sampleExpenses: ExpenseRequest[] = [
      {
        id: 'exp_demo_1',
        tokenNumber: 'CA-4A82-9B10',
        employeeEmail: 'employee@clearaudit.internal',
        employeeName: 'Sarah Lin',
        description: 'Client Partner Working Lunch at Trident BKC',
        amount: 2450.00,
        currency: 'INR',
        date: '2026-10-24',
        category: 'Meals & Entertainment',
        receiptFileName: 'trident_gst_invoice.pdf',
        status: 'Accepted',
        submittedAt: '2026-10-24T18:30:00.000Z',
        updatedAt: '2026-10-25T09:12:00.000Z',
        reviewedBy: 'Marcus Vance'
      },
      {
        id: 'exp_demo_2',
        tokenNumber: 'CA-7F19-3C42',
        employeeEmail: 'employee@clearaudit.internal',
        employeeName: 'Sarah Lin',
        description: 'Vande Bharat Express Fare - Mumbai to Ahmedabad',
        amount: 1875.00,
        currency: 'INR',
        date: '2026-10-28',
        category: 'Transportation',
        receiptFileName: 'irctc_eticket_vb901.pdf',
        status: 'Pending',
        submittedAt: '2026-10-28T14:15:00.000Z'
      },
      {
        id: 'exp_demo_3',
        tokenNumber: 'CA-9E55-21D8',
        employeeEmail: 'employee@clearaudit.internal',
        employeeName: 'Sarah Lin',
        description: 'Annual Figma Design License Seat',
        amount: 28500.00,
        currency: 'INR',
        date: '2026-10-15',
        category: 'Software & Subscriptions',
        receiptFileName: 'figma_india_tax_inv.pdf',
        status: 'Revoked',
        submittedAt: '2026-10-15T11:00:00.000Z',
        updatedAt: '2026-10-16T14:22:00.000Z',
        revocationReason: 'Please attach Department Head pre-approval authorization email per IT Procurement guidelines §4.2.',
        reviewedBy: 'Marcus Vance'
      }
    ];

    saveStoredExpenses(sampleExpenses);
    setExpenses(sampleExpenses);
  }, []);

  const clearAllExpenses = useCallback(() => {
    saveStoredExpenses([]);
    setExpenses([]);
  }, []);

  const getExpenseById = useCallback(
    (id: string) => expenses.find(e => e.id === id),
    [expenses]
  );

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        addExpense,
        acceptExpense,
        rejectExpense,
        revokeExpense,
        deleteExpense,
        seedDemoData,
        clearAllExpenses,
        getExpenseById
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
