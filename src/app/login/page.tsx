'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Shield,
  Loader2,
  ArrowRight,
  Sparkles,
  KeyRound,
  User,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const { user, profile, loading: authLoading, loginWithGoogle, setRole } = useAuth();
  const router = useRouter();

  // Step state: initial Google sign-in vs post-auth credential card
  const [step, setStep] = useState<'google_signin' | 'authenticated_role'>(
    user ? 'authenticated_role' : 'google_signin'
  );

  // Single pill toggle: 'admin' vs 'employee'
  const [activeRole, setActiveRole] = useState<'admin' | 'employee'>('admin');

  // Input states for Admin
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Input states for Employee
  const [employeeId, setEmployeeId] = useState('');
  const [employeePass, setEmployeePass] = useState('');

  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');

  // Hardcoded demo credentials
  const DEMO_ADMIN = { id: 'admin@clearaudit.com', pass: 'admin123' };
  const DEMO_EMPLOYEE = { id: 'employee@clearaudit.com', pass: 'emp123' };

  // Step 1: Google Sign-in click
  const handleGoogleSignIn = async () => {
    setSubmittingGoogle(true);
    setError('');
    try {
      const res = await loginWithGoogle(activeRole, 'adityabhandari3404@gmail.com');
      if (res.success) {
        setStep('authenticated_role');
      } else {
        setError('Google authentication could not be completed. Please try again.');
      }
    } catch {
      setError('Google sign-in error occurred.');
    } finally {
      setSubmittingGoogle(false);
    }
  };

  // Autofill helpers
  const handleFillAdmin = () => {
    setAdminId(DEMO_ADMIN.id);
    setAdminPass(DEMO_ADMIN.pass);
    setError('');
  };

  const handleFillEmployee = () => {
    setEmployeeId(DEMO_EMPLOYEE.id);
    setEmployeePass(DEMO_EMPLOYEE.pass);
    setError('');
  };

  // Step 2: Final Login
  const handleFinalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError('');

    if (activeRole === 'admin') {
      if (!adminId || !adminPass) {
        setError('Please enter Admin ID and Password, or click the demo autofill button.');
        setLoggingIn(false);
        return;
      }
      setRole('admin');
      router.push('/admin');
    } else {
      if (!employeeId || !employeePass) {
        setError('Please enter Employee ID and Password, or click the demo autofill button.');
        setLoggingIn(false);
        return;
      }
      setRole('employee');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex">
      {/* Left panel - Light Theme Branding & AI Stats */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 border-r border-neutral-200 bg-white">
        <div>
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-neutral-900 block">
                ClearAudit Corporate Expense Auditor
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8 max-w-md">
          {/* Gemma 4 Multimodal Audit Engine Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
            <span>Gemma 4 Multimodal Audit Engine</span>
          </div>

          {/* Real-Time Expense Reimbursement */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-neutral-900">
              Real-Time Expense
              <br />
              Reimbursement
            </h1>
          </div>

          {/* Verified Stats */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-neutral-200">
            <div>
              <p className="text-3xl font-extrabold font-mono text-neutral-900">&lt;3s</p>
              <p className="text-xs text-neutral-500 mt-1 font-medium">Audit Latency</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono text-neutral-900">99.4%</p>
              <p className="text-xs text-neutral-500 mt-1 font-medium">Policy Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono text-neutral-900">Zero</p>
              <p className="text-xs text-neutral-500 mt-1 font-medium">Manual Backlog</p>
            </div>
          </div>
        </div>

        {/* Clean minimal bottom spacer */}
        <div className="text-xs text-neutral-400 font-mono">
          ClearAudit Financial Infrastructure
        </div>
      </div>

      {/* Right panel - Google Sign In & Authenticated Role Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-neutral-50">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile title */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-neutral-900">
              ClearAudit Corporate Expense Auditor
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: INITIAL PREVIEW — JUST GOOGLE ACCOUNT SIGN IN & SMALL CONTINUE BUTTON */}
          {step === 'google_signin' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                  Google Account Sign In
                </h2>
                <p className="text-xs text-neutral-500">
                  Secure single sign-on for enterprise expense audit
                </p>
              </div>

              {/* Small box saying continue with google */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={submittingGoogle}
                  className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-50 border border-neutral-300 hover:border-neutral-400 text-neutral-800 text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-xs disabled:opacity-60"
                >
                  {submittingGoogle ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                  ) : (
                    <>
                      {/* Google G logo */}
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
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: AUTHENTICATED WITH GOOGLE — SINGLE PILL TOGGLE & SINGLE CARD */}
          {step === 'authenticated_role' && (
            <div className="space-y-4">
              {/* Authenticated user pill header */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-neutral-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-800">
                    {user?.displayName ? user.displayName.charAt(0) : 'G'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-neutral-900">
                        {user?.displayName || 'Aditya Bhandari'}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-neutral-600" />
                    </div>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {user?.email || 'adityabhandari3404@gmail.com'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('google_signin')}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Switch</span>
                </button>
              </div>

              {/* SINGLE PILL TOGGLE FOR ADMIN AND EMPLOYEE */}
              <div className="flex justify-center">
                <div className="inline-flex p-1 rounded-full bg-neutral-200/80 border border-neutral-300 w-full max-w-xs shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole('admin');
                      setError('');
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer text-center ${
                      activeRole === 'admin'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole('employee');
                      setError('');
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer text-center ${
                      activeRole === 'employee'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Employee
                  </button>
                </div>
              </div>

              {/* ONE SINGLE CARD FOR BOTH ADMIN & EMPLOYEE */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-7 shadow-sm space-y-5">
                {/* Header & Role Indicator */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      {activeRole === 'admin' ? 'Admin Audit Login' : 'Employee Portal Login'}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {activeRole === 'admin'
                        ? 'Financial compliance inspection & claim authorizations'
                        : 'Receipt capture, line-item extraction & reimbursement tracking'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 font-semibold uppercase">
                    {activeRole}
                  </span>
                </div>

                {/* HARDCODED ID AND PASS SMALL HINT BUTTON THAT AUTOFILLS */}
                {activeRole === 'admin' ? (
                  <button
                    type="button"
                    onClick={handleFillAdmin}
                    className="w-full p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-900" />
                      <span className="text-xs text-neutral-700 font-medium">
                        Hint: Use hardcoded Admin credentials
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-neutral-900 underline">
                      Click to fill
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFillEmployee}
                    className="w-full p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-900" />
                      <span className="text-xs text-neutral-700 font-medium">
                        Hint: Use hardcoded Employee credentials
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-neutral-900 underline">
                      Click to fill
                    </span>
                  </button>
                )}

                {/* FORM: ASKING ADMIN ID & PASS (IF ADMIN) OR EMPLOYEE ID & PASS (IF EMPLOYEE) */}
                <form onSubmit={handleFinalLogin} className="space-y-4">
                  {activeRole === 'admin' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-700 block">
                          Admin ID
                        </label>
                        <input
                          type="text"
                          value={adminId}
                          onChange={(e) => setAdminId(e.target.value)}
                          placeholder="admin@clearaudit.com"
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-700 block">
                          Password
                        </label>
                        <input
                          type="password"
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 transition-colors"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-700 block">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          placeholder="employee@clearaudit.com"
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-700 block">
                          Password
                        </label>
                        <input
                          type="password"
                          value={employeePass}
                          onChange={(e) => setEmployeePass(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 transition-colors"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-full py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {loggingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>{activeRole === 'admin' ? 'Login as Admin' : 'Login as Employee'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
