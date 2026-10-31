import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateReceiptToken,
  validatePasswordChange,
  validateExpenseMetadata,
  answerPolicyQuery,
  generateExpenseReportCSV,
  calculateAuditMetrics
} from './auditLogic';
import { ExpenseRequest } from '../types';

test('generateReceiptToken generates valid format CA-XXXX-XXXX', () => {
  const token = generateReceiptToken();
  assert.match(token, /^CA-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

test('validatePasswordChange requires correct current password', () => {
  const res = validatePasswordChange('wrongpass', 'correctpass', 'newpass123', 'newpass123');
  assert.equal(res.valid, false);
  assert.equal(res.error, 'Previous password does not match records.');
});

test('validatePasswordChange enforces minimum length and confirmation match', () => {
  const tooShort = validatePasswordChange('correctpass', 'correctpass', '123', '123');
  assert.equal(tooShort.valid, false);

  const mismatch = validatePasswordChange('correctpass', 'correctpass', 'newpass123', 'mismatch123');
  assert.equal(mismatch.valid, false);

  const same = validatePasswordChange('correctpass', 'correctpass', 'correctpass', 'correctpass');
  assert.equal(same.valid, false);

  const success = validatePasswordChange('correctpass', 'correctpass', 'brandNewPass456', 'brandNewPass456');
  assert.equal(success.valid, true);
});

test('validateExpenseMetadata validates fields accurately', () => {
  const emptyDesc = validateExpenseMetadata('', 50, '2026-10-15');
  assert.equal(emptyDesc.valid, false);

  const invalidAmt = validateExpenseMetadata('Team lunch', -10, '2026-10-15');
  assert.equal(invalidAmt.valid, false);

  const valid = validateExpenseMetadata('Client Dinner', 84.50, '2026-10-20');
  assert.equal(valid.valid, true);
  assert.equal(valid.numericAmount, 84.5);
});

test('answerPolicyQuery responds with relevant corporate expense policy rules', () => {
  const mealResp = answerPolicyQuery('What is the dinner meal allowance?');
  assert.match(mealResp, /Daily per diem is capped at ₹1,500\.00/);

  const hotelResp = answerPolicyQuery('Hotel stay limits');
  assert.match(hotelResp, /₹5,000\.00\/night/);

  const flightResp = answerPolicyQuery('Can I book business class flight?');
  assert.match(flightResp, /Standard Economy/);
});

test('calculateAuditMetrics aggregates statuses correctly', () => {
  const mockExpenses: ExpenseRequest[] = [
    {
      id: '1',
      tokenNumber: 'CA-1111-2222',
      employeeEmail: 'emp@test.com',
      employeeName: 'Jane',
      description: 'Flight',
      amount: 300,
      currency: 'USD',
      date: '2026-10-10',
      category: 'Travel & Lodging',
      status: 'Accepted',
      submittedAt: new Date().toISOString()
    },
    {
      id: '2',
      tokenNumber: 'CA-3333-4444',
      employeeEmail: 'emp@test.com',
      employeeName: 'Jane',
      description: 'Dinner',
      amount: 60,
      currency: 'USD',
      date: '2026-10-11',
      category: 'Meals & Entertainment',
      status: 'Pending',
      submittedAt: new Date().toISOString()
    },
    {
      id: '3',
      tokenNumber: 'CA-5555-6666',
      employeeEmail: 'emp@test.com',
      employeeName: 'Jane',
      description: 'Headphones',
      amount: 150,
      currency: 'USD',
      date: '2026-10-12',
      category: 'Office & Equipment',
      status: 'Revoked',
      revocationReason: 'Requires prior asset manager sign-off',
      submittedAt: new Date().toISOString()
    }
  ];

  const metrics = calculateAuditMetrics(mockExpenses);
  assert.equal(metrics.total, 3);
  assert.equal(metrics.accepted, 1);
  assert.equal(metrics.pending, 1);
  assert.equal(metrics.revoked, 1);
  assert.equal(metrics.totalDisbursed, 300);
  assert.equal(metrics.totalPendingAmount, 60);

  const csv = generateExpenseReportCSV(mockExpenses);
  assert.match(csv, /CA-1111-2222/);
  assert.match(csv, /Requires prior asset manager sign-off/);
});
