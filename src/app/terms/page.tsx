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
        'Users must authenticate via Google SSO or email/password credentials. You are responsible for maintaining the confidentiality of your account credentials. You must immediately notify your administrator of any unauthorized use of your account. Sharing credentials between users is strictly prohibited.',
    },
    {
      title: '4. Data Submission & Processing',
      content:
        'By submitting receipt images and expense data, you represent that: (a) you have the right to submit such data, (b) the information provided is truthful and accurate, (c) you authorize ClearAudit to process, store, and analyze submitted data using AI and automated systems. Fraudulent submissions may result in termination of access and legal action.',
    },
    {
      title: '5. AI Processing Disclaimer',
      content:
        'ClearAudit utilizes Google Gemma 4 AI models for receipt analysis. While we strive for accuracy, AI-extracted data may contain errors. All AI-generated results are subject to administrator review. ClearAudit is not liable for decisions made based on AI-generated analysis. Users should verify all extracted data before relying on it for financial decisions.',
    },
    {
      title: '6. Data Privacy & Storage',
      content:
        'Receipt images and expense data are stored securely on Google Cloud infrastructure (Firebase). Data is encrypted in transit and at rest. We retain expense data for the duration of your organization\'s account. Upon account termination, data will be retained for 90 days before permanent deletion. We do not sell or share your data with third parties beyond what is necessary for service operation.',
    },
    {
      title: '7. Acceptable Use',
      content:
        'You agree not to: (a) submit fraudulent or falsified receipts, (b) attempt to circumvent policy compliance checks, (c) use the Platform for money laundering or financial fraud, (d) reverse-engineer or attempt to extract the AI models, (e) overload the system with automated or scripted submissions, (f) access other users\' data without authorization.',
    },
    {
      title: '8. Intellectual Property',
      content:
        'The Platform, including its design, AI models, and proprietary algorithms, are the intellectual property of ClearAudit. You are granted a limited, non-exclusive license to use the Platform for its intended purpose. You may not copy, modify, or distribute any part of the Platform without written consent.',
    },
    {
      title: '9. Limitation of Liability',
      content:
        'ClearAudit is provided "as is" without warranties of any kind. We are not liable for: (a) inaccuracies in AI-generated expense analysis, (b) delays in expense processing or reimbursement, (c) data loss due to unforeseen technical failures, (d) decisions made based on Platform outputs. Our total liability shall not exceed the fees paid for the service in the 12 months preceding the claim.',
    },
    {
      title: '10. Termination',
      content:
        'Either party may terminate access at any time. ClearAudit reserves the right to suspend or terminate accounts that violate these terms without notice. Upon termination, your right to access the Platform ceases immediately.',
    },
    {
      title: '11. Governing Law',
      content:
        'These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles.',
    },
    {
      title: '12. Contact',
      content:
        'For questions about these Terms, contact the ClearAudit compliance team at compliance@clearaudit.com or through your organization\'s administrator.',
    },
  ];

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
        <div className="space-y-10">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-50">
              Terms & Conditions
            </h1>
            <p className="text-sm text-neutral-500">
              Last updated: January 15, 2024
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-200">{section.title}</h2>
                <p className="text-sm text-neutral-400 leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="pt-8 border-t border-neutral-800">
            <p className="text-xs text-neutral-600">
              © 2024 ClearAudit. All rights reserved. Enterprise Finance
              Infrastructure.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
