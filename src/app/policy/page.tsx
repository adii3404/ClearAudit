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
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-bold tracking-tight text-neutral-900">
                ClearAudit Corporate Expense Auditor
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
        <div className="space-y-10">
          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
              Corporate Spending Policy
            </h1>
            <p className="text-sm text-neutral-600 max-w-xl">
              All expense reimbursements are subject to the following corporate policy.
              ClearAudit&apos;s AI engine automatically enforces these rules during receipt processing.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full font-mono">
                v2.1 — Effective 2026
              </span>
            </div>
          </div>

          {/* Policy sections */}
          <div className="space-y-6">
            {/* Meal Policy */}
            <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-neutral-800" strokeWidth={2} />
                </div>
                <h2 className="text-base font-bold text-neutral-900">Meal Expenses</h2>
              </div>
              <div className="space-y-3 text-sm text-neutral-700 leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="text-neutral-900 font-semibold">Maximum per-meal limit:</span>{' '}
                    $50.00 USD per person. Meals exceeding this amount will be automatically flagged
                    for secondary review.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    Business meals with clients are reimbursable. Include client names and business
                    purpose in the expense description.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>Tips up to 20% of the pre-tax subtotal are reimbursable.</p>
                </div>
              </div>
            </section>

            {/* Prohibited Items */}
            <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" strokeWidth={2} />
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Non-Reimbursable Items
                </h2>
              </div>
              <div className="space-y-3 text-sm text-neutral-700">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-200">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="text-red-950 font-semibold">Alcohol:</span> All alcoholic
                    beverages are strictly non-reimbursable, regardless of context.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-200">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="text-red-950 font-semibold">Tobacco products:</span> All
                    tobacco and nicotine products are non-reimbursable.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 border border-red-200">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="text-red-950 font-semibold">Personal items:</span> Clothing,
                    personal electronics, and non-business subscriptions.
                  </p>
                </div>
              </div>
            </section>

            {/* Weekend Policy */}
            <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-amber-600" strokeWidth={2} />
                </div>
                <h2 className="text-base font-bold text-neutral-900">Weekend Transactions</h2>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-neutral-800">
                  <span className="font-semibold text-neutral-900">Automatic flagging:</span> All
                  transactions occurring on Saturday or Sunday are automatically flagged for
                  secondary manual review by the finance team. This includes all categories.
                </p>
              </div>
            </section>

            {/* General Guidelines */}
            <section className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-neutral-800" strokeWidth={2} />
                </div>
                <h2 className="text-base font-bold text-neutral-900">General Guidelines</h2>
              </div>
              <ul className="space-y-2.5 text-sm text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-1">•</span>
                  Submit receipts within 30 days of the transaction date.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-1">•</span>
                  Original itemized receipts are required; credit card statements alone are insufficient.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-1">•</span>
                  Provide a clear business justification for each expense in the description field.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-400 mt-1">•</span>
                  Foreign currency expenses will be converted at the date-of-purchase exchange rate.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
