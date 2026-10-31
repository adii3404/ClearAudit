import React, { useState, useEffect } from 'react';
import { X, FileText, AlertCircle, Calendar, DollarSign, Tag, Image as ImageIcon } from 'lucide-react';
import { ExpenseCategory } from '../types';
import { validateExpenseMetadata } from '../lib/auditLogic';

interface UploadMetadataModalProps {
  isOpen: boolean;
  fileInfo: {
    name: string;
    previewUrl?: string;
    type?: string;
  } | null;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
  }) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Meals & Entertainment',
  'Travel & Lodging',
  'Transportation',
  'Office & Equipment',
  'Software & Subscriptions',
  'Client Relations',
  'Other'
];

export const UploadMetadataModal: React.FC<UploadMetadataModalProps> = ({
  isOpen,
  fileInfo,
  onClose,
  onSubmit
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Meals & Entertainment');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('Meals & Entertainment');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !fileInfo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateExpenseMetadata(description, amount, date);
    if (!validation.valid) {
      setError(validation.error || 'Please check your inputs.');
      return;
    }

    onSubmit({
      description: description.trim(),
      amount: validation.numericAmount || Number(amount),
      date,
      category
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-metadata-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-white border border-zinc-200 shadow-2xl p-6 sm:p-7 relative my-8">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 text-zinc-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-4 h-4 text-zinc-950" />
            <h2 id="upload-metadata-title" className="text-base font-semibold text-zinc-950 uppercase tracking-wider">
              Expense Metadata
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Enter expense details for receipt auditing and record logging.
          </p>
        </div>

        {/* Selected file preview pill / card */}
        <div className="mb-5 p-3 bg-zinc-50 border border-zinc-200 flex items-center gap-3">
          {fileInfo.previewUrl ? (
            <img
              src={fileInfo.previewUrl}
              alt="Receipt preview"
              className="w-12 h-12 object-cover border border-zinc-300 shrink-0 bg-white"
            />
          ) : (
            <div className="w-12 h-12 bg-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono font-medium text-zinc-900 truncate">
              {fileInfo.name}
            </p>
            <p className="text-[11px] text-zinc-400">Captured receipt documentation</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-zinc-50 border border-zinc-300 text-xs text-zinc-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-zinc-950 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
              Description <span className="text-zinc-400 normal-case">(Merchant, Purpose)</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Client Dinner at Grand Central Bistro"
              className="w-full h-10 px-3 border border-zinc-300 bg-white text-sm text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 font-mono text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 pl-7 pr-3 border border-zinc-300 bg-white text-sm text-zinc-950 font-mono focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                Transaction Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-300 bg-white text-sm text-zinc-950 font-mono focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="w-full h-10 px-3 border border-zinc-300 bg-white text-sm text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs uppercase tracking-wider font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium transition-colors"
            >
              Submit for Audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
