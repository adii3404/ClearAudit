import React, { useState } from 'react';
import { X, AlertOctagon, HelpCircle } from 'lucide-react';
import { ExpenseRequest } from '../types';
import { formatINR } from '../lib/auditLogic';

interface RevokeModalProps {
  isOpen: boolean;
  expense: ExpenseRequest | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RevokeModal: React.FC<RevokeModalProps> = ({
  isOpen,
  expense,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('A specific reason or tip is mandatory before revoking an expense submission.');
      return;
    }
    if (trimmed.length < 5) {
      setError('Please provide a constructive audit tip or reason (min 5 characters).');
      return;
    }
    setError(null);
    onConfirm(trimmed);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  const predefinedTips = [
    'Missing itemized GST tax invoice. Please re-upload with vendor GSTIN invoice.',
    'Exceeds daily per diem allowance for meals (₹1,500 limit). Please adjust amount.',
    'Requires Department Head pre-approval authorization email attachment.',
    'Incurred date does not match receipt timestamp. Please verify date.'
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-lg bg-white border border-zinc-200 shadow-2xl p-6 sm:p-7 relative">
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 text-zinc-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertOctagon className="w-4 h-4 text-zinc-950" />
            <h2 id="revoke-modal-title" className="text-base font-semibold text-zinc-950 uppercase tracking-wider">
              Revoke Expense Submission
            </h2>
          </div>
          <p className="text-xs text-zinc-600">
            Token: <span className="font-mono font-medium text-zinc-900">{expense.tokenNumber}</span> &bull; {expense.employeeName} ({formatINR(expense.amount)})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-zinc-50 border border-zinc-300 text-xs text-zinc-900">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
              Revocation Reason or Guidance Tip <span className="text-zinc-400 normal-case">(Required for employee)</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Please attach itemized merchant receipt and adjust tip to within policy threshold."
              className="w-full p-3 border border-zinc-300 bg-white text-sm text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors resize-none font-sans"
            />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Quick Audit Feedback Tips
            </p>
            <div className="space-y-1.5">
              {predefinedTips.map((tip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(tip)}
                  className="w-full text-left p-2 text-xs text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors line-clamp-1"
                >
                  &rarr; {tip}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 text-xs uppercase tracking-wider font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium transition-colors"
            >
              Confirm Revocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
