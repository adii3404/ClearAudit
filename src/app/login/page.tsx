'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Shield,
  Loader2,
  ArrowRight,
  CheckCircle2,
  FileText,
  UserCheck,
  Scale,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function LoginPage() {
  const { user, profile, loading: authLoading, loginWithGoogle, setRole } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<'google_form' | 'role_select'>(
    user ? 'role_select' : 'google_form'
  );
  const [googleEmail, setGoogleEmail] = useState(user?.email || 'adityabhandari3404@gmail.com');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'employee'>(
    profile?.role || (googleEmail.includes('admin') || googleEmail === 'adityabhandari3404@gmail.com' ? 'admin' : 'employee')
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle Google Login Form submission (Step 1)
  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await loginWithGoogle(selectedRole, googleEmail);
      if (res.success) {
        setSelectedRole(res.role);
        setStep('role_select');
      } else {
        setError('Failed to authenticate with Google. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Workspace Entry (Step 2)
  const handleEnterWorkspace = (roleToEnter: 'admin' | 'employee') => {
    setRole(roleToEnter);
    router.push(roleToEnter === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left panel - Enterprise Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-neutral-900 bg-neutral-950/40">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-neutral-100" strokeWidth={1.75} />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-neutral-100 block">
                ClearAudit
              </span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                Enterprise AI Compliance
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            <span>Gemma 4 Multimodal Audit Engine</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight leading-tight text-neutral-100">
            Real-Time Expense
            <br />
            Reimbursement SaaS
          </h1>

          <p className="text-neutral-400 text-sm leading-relaxed">
            Automate enterprise expense compliance with multimodal OCR and policy verification.
            Instant line-item audits for weekend transactions, meal limits, and restricted items.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-900">
            <div>
              <p className="text-2xl font-bold font-mono text-neutral-100">&lt;3s</p>
              <p className="text-xs text-neutral-500 mt-1">Audit Latency</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-neutral-100">99.4%</p>
              <p className="text-xs text-neutral-500 mt-1">Policy Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-neutral-100">Zero</p>
              <p className="text-xs text-neutral-500 mt-1">Manual Backlog</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-600 font-mono border-t border-neutral-900 pt-6">
          <span>ClearAudit Infrastructure</span>
          <span>SOC2 Type II Certified</span>
        </div>
      </div>

      {/* Right panel - Auth & Role Selection */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-xl space-y-6">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-neutral-100" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-neutral-100">
              ClearAudit
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-neutral-900 border border-red-900/60 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: ONE CLEAN FORM FOR GOOGLE LOGIN */}
          {step === 'google_form' && (
            <div className="border border-neutral-800 rounded-xl bg-neutral-950 p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
                  Google Account Sign In
                </h2>
                <p className="text-xs text-neutral-400">
                  Authenticate securely using your Google corporate or personal account.
                </p>
              </div>

              <form onSubmit={handleGoogleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="name@company.com or @gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Use your enterprise Google email or default demo account to continue.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-medium text-sm transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  ) : (
                    <>
                      {/* Official Google 'G' icon */}
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>Continue with Google</span>
                      <ArrowRight className="w-4 h-4 text-neutral-600" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                  Instant Authentication
                </span>
                <span>Role selection follows login</span>
              </div>
            </div>
          )}

          {/* STEP 2: AFTER GOOGLE AUTHENTICATION — TOGGLE & DUAL ROLE CARDS WITH HINTS */}
          {step === 'role_select' && (
            <div className="space-y-6">
              {/* Authenticated user header */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-200">
                    {user?.displayName ? user.displayName.charAt(0) : 'G'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-neutral-200">
                        {user?.displayName || 'Google User'}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700">
                        Google Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono">{user?.email || googleEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('google_form')}
                  className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Switch</span>
                </button>
              </div>

              {/* Toggle switch between Admin Login & Employee Login */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    Select Login Workspace:
                  </label>
                  <span className="text-xs text-neutral-500 font-mono">
                    Active: <strong className="text-neutral-200 uppercase">{selectedRole}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 p-1 rounded-lg bg-neutral-900 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`py-2 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedRole === 'admin'
                        ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('employee')}
                    className={`py-2 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedRole === 'employee'
                        ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Employee Login</span>
                  </button>
                </div>
              </div>

              {/* DUAL CARDS WITH DETAILED HINTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ADMIN CARD */}
                <div
                  onClick={() => setSelectedRole('admin')}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-all cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-neutral-900/90 border-neutral-400 ring-1 ring-neutral-400 shadow-lg'
                      : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-neutral-100" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                        AUDIT OFFICER
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-neutral-100">
                        Admin Audit Center
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Compliance & Financial Review
                      </p>
                    </div>

                    {/* Hints & Capabilities */}
                    <div className="space-y-2 pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
                      <div className="flex items-start gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-neutral-300 mt-0.5 flex-shrink-0" />
                        <span>Inspect pending claims & AI violation flags</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neutral-300 mt-0.5 flex-shrink-0" />
                        <span>Approve or reject with custom audit notes</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-neutral-300 mt-0.5 flex-shrink-0" />
                        <span>Export compliance certificates via PDF</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnterWorkspace('admin');
                      }}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-white text-neutral-950 font-semibold"
                    >
                      <span>Login as Admin</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* EMPLOYEE CARD */}
                <div
                  onClick={() => setSelectedRole('employee')}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-all cursor-pointer ${
                    selectedRole === 'employee'
                      ? 'bg-neutral-900/90 border-neutral-400 ring-1 ring-neutral-400 shadow-lg'
                      : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-neutral-100" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                        STAFF PORTAL
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-neutral-100">
                        Employee Dashboard
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Expense Submission & Claims
                      </p>
                    </div>

                    {/* Hints & Capabilities */}
                    <div className="space-y-2 pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
                      <div className="flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-neutral-300 mt-0.5 flex-shrink-0" />
                        <span>Live camera capture & drag-and-drop receipts</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-neutral-300 mt-0.5 flex-shrink-0" />
                        <span>Instant Gemma 4 OCR & policy pre-audit in &lt;3s</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neutral-300 mt-0.5 flex-shrink-0" />
                        <span>Real-time claim status & reimbursement feed</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnterWorkspace('employee');
                      }}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-white text-neutral-950 font-semibold"
                    >
                      <span>Login as Employee</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Big primary button to enter active workspace */}
              <button
                type="button"
                onClick={() => handleEnterWorkspace(selectedRole)}
                className="w-full py-3 px-4 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-medium text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Continue to {selectedRole === 'admin' ? 'Admin Audit Center' : 'Employee Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs text-neutral-500 font-mono pt-2">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  You can toggle roles anytime from the header
                </span>
                <span className="text-neutral-400 font-semibold">ClearAudit v1.0</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
