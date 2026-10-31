import { ExpenseRequest, ExpenseStatus } from '../types';

/**
 * Generates an alphanumeric receipt token in the format CA-XXXX-XXXX
 */
export function generateReceiptToken(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CA-${part1}-${part2}`;
}

/**
 * Formats amount in Indian Rupee format (₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Validates password change constraints
 */
export function validatePasswordChange(
  previousInput: string,
  currentActual: string,
  newInput: string,
  confirmInput: string
): { valid: boolean; error?: string } {
  if (!previousInput || !newInput || !confirmInput) {
    return { valid: false, error: 'All fields are required.' };
  }
  if (previousInput !== currentActual) {
    return { valid: false, error: 'Previous password does not match records.' };
  }
  if (newInput.length < 6) {
    return { valid: false, error: 'New password must be at least 6 characters long.' };
  }
  if (newInput !== confirmInput) {
    return { valid: false, error: 'New password and confirmation do not match.' };
  }
  if (newInput === previousInput) {
    return { valid: false, error: 'New password must be different from previous password.' };
  }
  return { valid: true };
}

/**
 * Validates expense metadata input in INR
 */
export function validateExpenseMetadata(
  description: string,
  amount: number | string,
  date: string
): { valid: boolean; error?: string; numericAmount?: number } {
  const trimmed = description.trim();
  if (!trimmed) {
    return { valid: false, error: 'Description is required.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Description must be at least 3 characters.' };
  }
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Amount must be greater than ₹0.00.' };
  }
  if (num > 5000000) {
    return { valid: false, error: 'Amounts exceeding ₹50,00,000 require executive board approval.' };
  }
  if (!date) {
    return { valid: false, error: 'Expense date is required.' };
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid date format.' };
  }
  const now = new Date();
  if (dateObj > new Date(now.getTime() + 86400000 * 2)) {
    return { valid: false, error: 'Expense date cannot be in the future.' };
  }
  return { valid: true, numericAmount: Math.round(num * 100) / 100 };
}

/**
 * Intelligent Expense Policy Assistant (Ally)
 * Matches query keywords to corporate rules in INR
 */
export function answerPolicyQuery(query: string): string {
  const q = query.toLowerCase().trim();

  if (!q) {
    return 'Please enter a question regarding corporate travel, meals, equipment, or reimbursement rules.';
  }

  if (q.includes('meal') || q.includes('dinner') || q.includes('lunch') || q.includes('food') || q.includes('per diem')) {
    return 'Meal Policy: Daily per diem is capped at ₹1,500.00 (₹400 breakfast, ₹500 lunch, ₹600 dinner). Itemized GST tax invoices are mandatory for any meal over ₹500.00. Alcohol is reimbursable only with prior client entertainment approval.';
  }

  if (q.includes('flight') || q.includes('air') || q.includes('travel') || q.includes('train') || q.includes('rail')) {
    return 'Travel Policy: Domestic flights must be booked in Standard Economy at least 14 days in advance. Rail travel up to 2nd AC / 3rd AC is eligible. Travel itinerary changes require manager authorization.';
  }

  if (q.includes('hotel') || q.includes('lodging') || q.includes('stay') || q.includes('room')) {
    return 'Lodging Policy: Standard business hotels up to ₹5,000.00/night (pre-tax) in Tier-1 metro cities (Mumbai, Bengaluru, Delhi NCR, Hyderabad) and ₹3,500.00 in Tier-2/3 regions. Personal room service and minibar expenses are non-reimbursable.';
  }

  if (q.includes('receipt') || q.includes('lost') || q.includes('proof') || q.includes('missing') || q.includes('gst')) {
    return 'Receipt Requirements: Legible tax invoices or receipts with valid GSTIN are required for all transactions above ₹500.00. The invoice must clearly specify vendor name, GSTIN, date, and itemized breakdown.';
  }

  if (q.includes('software') || q.includes('saas') || q.includes('tool') || q.includes('subscription')) {
    return 'Software Policy: Software licenses and SaaS subscriptions must be procured via IT Procurement. Individual employee reimbursement for software requires Department Head pre-approval.';
  }

  if (q.includes('hardware') || q.includes('monitor') || q.includes('laptop') || q.includes('keyboard') || q.includes('mouse') || q.includes('equipment')) {
    return 'Equipment Policy: Remote work equipment up to ₹15,000.00 per fiscal year is eligible. Purchased peripherals remain corporate property and must be registered with Asset Management.';
  }

  if (q.includes('timeline') || q.includes('when') || q.includes('pay') || q.includes('direct deposit') || q.includes('reimburse') || q.includes('neft') || q.includes('upi')) {
    return 'Reimbursement Timeline: Approved claims are audited within 48 business hours and disbursed via direct NEFT / salary account deposit on the subsequent bi-weekly payroll cycle.';
  }

  if (q.includes('revoke') || q.includes('rejected') || q.includes('reason') || q.includes('fix')) {
    return 'Audit Decision Policy: When an admin marks an expense as Revoked, a mandatory Tip/Reason is provided. You can inspect the note, update your receipt documentation, and resubmit.';
  }

  return 'General Policy: All business expenses must be incurred strictly for legitimate corporate activities in India or abroad and submitted within 30 days of the transaction date.';
}

/**
 * Generate CSV data for admin reports in INR
 */
export function generateExpenseReportCSV(expenses: ExpenseRequest[]): string {
  const headers = [
    'Token Number',
    'Date',
    'Employee Name',
    'Employee Email',
    'Description',
    'Category',
    'Amount (INR)',
    'Status',
    'Submitted At',
    'Reviewer / Reason'
  ];

  const escapeCSV = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = expenses.map(e => [
    escapeCSV(e.tokenNumber),
    escapeCSV(e.date),
    escapeCSV(e.employeeName),
    escapeCSV(e.employeeEmail),
    escapeCSV(e.description),
    escapeCSV(e.category),
    escapeCSV(e.amount.toFixed(2)),
    escapeCSV(e.status),
    escapeCSV(new Date(e.submittedAt).toLocaleDateString('en-IN')),
    escapeCSV(e.revocationReason || e.reviewedBy || '')
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Summary metrics calculator for admin dashboard in INR
 */
export function calculateAuditMetrics(expenses: ExpenseRequest[]) {
  const total = expenses.length;
  const pending = expenses.filter(e => e.status === 'Pending').length;
  const accepted = expenses.filter(e => e.status === 'Accepted').length;
  const rejected = expenses.filter(e => e.status === 'Rejected').length;
  const revoked = expenses.filter(e => e.status === 'Revoked').length;
  const totalDisbursed = expenses
    .filter(e => e.status === 'Accepted')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPendingAmount = expenses
    .filter(e => e.status === 'Pending')
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    total,
    pending,
    accepted,
    rejected,
    revoked,
    totalDisbursed,
    totalPendingAmount
  };
}
