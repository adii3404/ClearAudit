'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content:
        'By accessing and using ClearAudit ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not use the Platform. ClearAudit reserves the right to modify these terms at any time, with changes effective upon posting.',
    },
    {
      title: '2. Service Description',
      content:
        'ClearAudit provides AI-powered expense reimbursement processing, receipt analysis, and compliance auditing services. The Platform uses machine learning models to extract information from receipt images and assess policy compliance. AI-generated results are advisory and subject to human review.',
    },
    {
      title: '3. User Accounts & Authentication',
      content:
        'Users must authenticate via Google SSO or role credentials. You are responsible for maintaining the confidentiality of your account credentials. You must immediately notify your administrator of any unauthorized use of your account. Sharing credentials between users is strictly prohibited.',
    },
    {
      title: '4. Data Submission & Processing',
      content:
        'By submitting receipt images and expense data, you represent that: (a) you have the right to submit such data, (b) the information provided is truthful and accurate, (c) you authorize ClearAudit to process, store, and analyze submitted data using AI and automated systems.',
    },
    {
      title: '5. AI Processing Disclaimer',
      content:
        'ClearAudit utilizes Google Gemma 4 AI models for receipt analysis. While we strive for accuracy, AI-extracted data may contain errors. All AI-generated results are subject to administrator review. ClearAudit is not liable for decisions made based on AI-generated analysis.',
    },
    {
      title: '6. Data Privacy & Storage',
      content:
        'Receipt images and expense data are stored securely on Google Cloud infrastructure. Data is encrypted in transit and at rest. We do not sell or share your data with third parties beyond what is necessary for service operation.',
    },
    {
      title: '7. Limitation of Liability',
      content:
        'ClearAudit is provided "as is" without warranties of any kind. We are not liable for: (a) inaccuracies in AI-generated expense analysis, (b) delays in expense processing or reimbursement, (c) data loss due to unforeseen technical failures.',
    },
  ];

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
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
              Terms & Conditions
            </h1>
            <p className="text-sm text-neutral-500 font-mono">
              Enterprise Governance Infrastructure
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-2">
                <h2 className="text-sm font-bold text-neutral-900">{section.title}</h2>
                <p className="text-sm text-neutral-600 leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="pt-8 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 font-mono">
              © 2026 ClearAudit Corporate Expense Auditor. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
