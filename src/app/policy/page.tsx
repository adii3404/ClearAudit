'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Shield,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function PolicyPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-neutral-50" strokeWidth={1.5} />
              <span className="text-sm font-semibold tracking-tight text-neutral-50">
                ClearAudit
              </span>
            </div>
          </div>
          {user && (
            <Link href="/dashboard" className="btn-secondary text-xs">
              Back to Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-50">
              Corporate Spending Policy
            </h1>
            <p className="text-sm text-neutral-500 max-w-xl">
              All expense reimbursements are subject to the following corporate policy.
              ClearAudit&apos;s AI engine automatically enforces these rules during receipt processing.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[10px] font-medium text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded">
                v2.1 — Effective January 2024
              </span>
            </div>
          </div>

          {/* Policy sections */}
          <div className="space-y-8">
            {/* Meal Policy */}
            <section className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-base font-semibold text-neutral-50">Meal Expenses</h2>
              </div>
              <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900/50">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p>
                    <span className="text-neutral-100 font-medium">Maximum per-meal limit:</span>{' '}
                    $50.00 USD per person. Meals exceeding this amount will be automatically flagged
                    for secondary review.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900/50">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p>
                    Business meals with clients are reimbursable. Include client names and business
                    purpose in the expense description.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900/50">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p>Tips up to 20% of the pre-tax subtotal are reimbursable.</p>
                </div>
              </div>
            </section>

            {/* Prohibited Items */}
            <section className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-base font-semibold text-neutral-50">
                  Non-Reimbursable Items
                </h2>
              </div>
              <div className="space-y-3 text-sm text-neutral-300">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20 border border-red-900/30">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p>
                    <span className="text-neutral-100 font-medium">Alcohol:</span> All alcoholic
                    beverages are strictly non-reimbursable, regardless of context.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20 border border-red-900/30">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p>
                    <span className="text-neutral-100 font-medium">Tobacco products:</span> All
                    tobacco and nicotine products are non-reimbursable.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20 border border-red-900/30">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p>
                    <span className="text-neutral-100 font-medium">Personal items:</span> Clothing,
                    personal electronics, and non-business subscriptions.
                  </p>
                </div>
              </div>
            </section>

            {/* Weekend Policy */}
            <section className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-yellow-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-base font-semibold text-neutral-50">Weekend Transactions</h2>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-950/20 border border-yellow-900/30">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm text-neutral-300">
                  <span className="text-neutral-100 font-medium">Automatic flagging:</span> All
                  transactions occurring on Saturday or Sunday are automatically flagged for
                  secondary manual review by the finance team. This includes all categories.
                </p>
              </div>
            </section>

            {/* General Guidelines */}
            <section className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-base font-semibold text-neutral-50">General Guidelines</h2>
              </div>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-neutral-600 mt-1">•</span>
                  Submit receipts within 30 days of the transaction date.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-600 mt-1">•</span>
                  Original itemized receipts are required; credit card statements alone are insufficient.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-600 mt-1">•</span>
                  Provide a clear business justification for each expense in the description field.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-600 mt-1">•</span>
                  Foreign currency expenses will be converted at the date-of-purchase exchange rate.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-600 mt-1">•</span>
                  Duplicate submissions will be flagged and may result in disciplinary action.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
