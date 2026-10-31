import React from 'react';
import { X } from 'lucide-react';
import { ExpenseRequest } from '../types';
import { LegitReceiptSlip } from './LegitReceiptSlip';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  expense: ExpenseRequest | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  expense,
  onClose
}) => {
  if (!isOpen || !expense) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white border border-zinc-200 shadow-2xl p-4 sm:p-6 relative my-8">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-zinc-400 hover:text-black transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <LegitReceiptSlip expense={expense} onClose={onClose} />
      </div>
    </div>
  );
};
