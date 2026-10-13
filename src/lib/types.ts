export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'employee' | 'admin';
  createdAt?: Date;
}

export interface LineItem {
  description: string;
  amount: number;
}

export interface AIAuditResult {
  vendor_name: string;
  date_of_purchase: string;
  total_amount: number;
  currency: string;
  inferred_category: string;
  line_items: LineItem[];
  policy_violation: boolean;
  violation_reason: string | null;
  audit_confidence_score: number;
}

export interface Expense {
  id?: string;
  userId: string;
  imageUrl: string;
  userDescription: string;
  vendor_name: string;
  date_of_purchase: string;
  total_amount: number;
  currency: string;
  inferred_category: string;
  line_items: LineItem[];
  policy_violation: boolean;
  violation_reason: string | null;
  audit_confidence_score: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}
