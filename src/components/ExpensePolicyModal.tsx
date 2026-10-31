import React from 'react';
import { X, ShieldCheck, Download } from 'lucide-react';

interface ExpensePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpensePolicyModal: React.FC<ExpensePolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white border border-zinc-200 shadow-2xl p-6 sm:p-8 relative my-8 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          aria-label="Close policy modal"
          className="absolute top-5 right-5 text-zinc-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-zinc-950" />
            <h2 id="policy-modal-title" className="text-base font-bold uppercase tracking-wider text-zinc-950">
              Corporate Expense &amp; Audit Policy
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Document REF: CA-POL-2026.04 &bull; Effective Fiscal Year 2026
          </p>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 space-y-5 text-xs text-zinc-700 leading-relaxed font-sans">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1.5 pb-1 border-b border-zinc-100">
              § 1. General Principles &amp; Receipt Requirements
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>All reimbursements must be strictly incurred for legitimate, authorized business activities in India or abroad.</li>
              <li>Valid itemized GST tax invoices or official commercial bills are mandatory for all transactions above ₹500.00 INR.</li>
              <li>Receipts must clearly display merchant GSTIN, date, itemized items, and currency total.</li>
              <li>Claims must be submitted within 30 calendar days from the date of the transaction.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1.5 pb-1 border-b border-zinc-100">
              § 2. Meals &amp; Daily Per Diem
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>Individual daily meal allowance is capped at ₹1,500.00 INR (₹400 breakfast, ₹500 lunch, ₹600 dinner).</li>
              <li>Alcohol is non-reimbursable unless part of pre-approved formal client hosting (&gt;2 external attendees).</li>
              <li>Tips and gratuities exceeding 10% are not eligible for reimbursement.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1.5 pb-1 border-b border-zinc-100">
              § 3. Travel &amp; Accommodation
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>Air travel: Standard Economy required for domestic flights; book at least 14 days in advance. Rail 2nd/3rd AC eligible.</li>
              <li>Hotels: Standard business accommodations capped at ₹5,000.00 INR/night in Tier-1 metros (₹3,500 elsewhere).</li>
              <li>Ground transport: App-based cabs (Uber/Ola Prime Sedan) or local transit preferred over chauffeur rentals.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1.5 pb-1 border-b border-zinc-100">
              § 4. Equipment &amp; Software Licenses
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>Remote home office peripherals are eligible up to ₹15,000.00 INR once per rolling 12 months.</li>
              <li>Software licenses, domain purchases, or cloud services must receive prior approval from IT Procurement.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1.5 pb-1 border-b border-zinc-100">
              § 5. Audit Decisions &amp; Revocations
            </h3>
            <p className="text-zinc-600 mb-1">
              Internal auditors review all submissions against these benchmarks. In the event of an incomplete filing,
              the auditor will revoke the request with a mandatory specific Tip/Reason. The employee may inspect the reason,
              rectify the documentation, and resubmit.
            </p>
          </section>
        </div>

        <div className="pt-4 mt-4 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-mono">
            ClearAudit Internal Compliance v4.0
          </span>
          <button
            onClick={onClose}
            className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium transition-colors"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
