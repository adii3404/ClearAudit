export type UserRole = 'employee' | 'admin';

export interface UserCredentials {
  email: string;
  role: UserRole;
  passwordHash: string; // Plaintext or simulated hash for demo
  name: string;
  department: string;
}

export type ExpenseStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Revoked';

export type ExpenseCategory =
  | 'Meals & Entertainment'
  | 'Travel & Lodging'
  | 'Office & Equipment'
  | 'Software & Subscriptions'
  | 'Transportation'
  | 'Client Relations'
  | 'Other';

export interface ExpenseRequest {
  id: string;
  tokenNumber: string; // E.g., "CA-9B41-8920"
  employeeEmail: string;
  employeeName: string;
  description: string;
  amount: number;
  currency: string;
  date: string; // ISO or YYYY-MM-DD
  category: ExpenseCategory;
  receiptImage?: string; // base64 data URL or placeholder thumbnail
  receiptFileName?: string;
  status: ExpenseStatus;
  submittedAt: string;
  updatedAt?: string;
  revocationReason?: string; // Required when Revoked
  reviewedBy?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  suggestedAction?: string;
}
