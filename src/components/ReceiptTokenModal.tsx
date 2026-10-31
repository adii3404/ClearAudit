import React, { useState } from 'react';
import { X, Check, Copy, ArrowRight, Download, FileText } from 'lucide-react';
import { ExpenseRequest } from '../types';
import { formatINR } from '../lib/auditLogic';
import { LegitReceiptSlip } from './LegitReceiptSlip';

interface ReceiptTokenModalProps {
  isOpen: boolean;
  expense: ExpenseRequest | null;
  onClose: () => void;
}

export const ReceiptTokenModal: React.FC<ReceiptTokenModalProps> = ({
  isOpen,
  expense,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullSlip, setShowFullSlip] = useState(false);

  if (!isOpen || !expense) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(expense.tokenNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showFullSlip) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-slip-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      >
        <div className="w-full max-w-2xl bg-white border border-zinc-200 shadow-2xl p-4 sm:p-6 relative my-8">
          <button
            onClick={() => setShowFullSlip(false)}
            aria-label="Back to summary"
            className="absolute top-4 right-4 text-zinc-400 hover:text-black transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <LegitReceiptSlip expense={expense} onClose={onClose} />
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-token-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md bg-white border border-zinc-200 shadow-2xl p-6 sm:p-7 relative text-zinc-950">
        <button
          onClick={onClose}
          aria-label="Close receipt dialog"
          className="absolute top-5 right-5 text-zinc-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-5 border-b border-dashed border-zinc-200">
          <img
            src="/assets/aistudio/Gemini_Generated_Image_kdnznskdnznskdnz_c1f00f87.jpeg"
            alt="ClearAudit Logo"
            className="w-12 h-12 mx-auto mb-3 border border-zinc-900 object-cover"
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            ClearAudit GST Slip
          </span>
          <h2 id="receipt-token-title" className="text-lg font-bold tracking-tight text-zinc-950 uppercase mt-0.5">
            Submission Confirmed
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Receipt logged in audit queue for verification.
          </p>
        </div>

        {/* Unique Alpha-Numeric Token Display */}
        <div className="my-5 p-4 bg-zinc-50 border border-zinc-200 text-center">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">
            Receipt Audit Token Number
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-zinc-950 select-all">
              {expense.tokenNumber}
            </span>
            <button
              onClick={handleCopy}
              title="Copy Token Number"
              className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-zinc-950" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <p className="text-[11px] text-zinc-600 mt-1 font-mono">
              Token copied to clipboard
            </p>
          )}
        </div>

        {/* Expense Summary Grid */}
        <div className="space-y-2 text-xs border-y border-dashed border-zinc-200 py-4 my-4 font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-400 uppercase">Amount</span>
            <span className="font-semibold text-zinc-900">{formatINR(expense.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 uppercase">Date Incurred</span>
            <span className="text-zinc-800">{expense.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 uppercase">Category</span>
            <span className="text-zinc-800">{expense.category}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-zinc-400 uppercase shrink-0">Description</span>
            <span className="text-zinc-800 text-right truncate max-w-[200px]" title={expense.description}>
              {expense.description}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 uppercase">Initial Status</span>
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-zinc-100 text-zinc-800 border border-zinc-300 uppercase">
              {expense.status}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowFullSlip(true)}
            className="text-xs font-mono text-zinc-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View &amp; Download Voucher</span>
          </button>
          <button
            onClick={onClose}
            className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Close</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
