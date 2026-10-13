'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Shield,
  Loader2,
  ArrowRight,
  Sparkles,
  User,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const { loginAsRole } = useAuth();
  const router = useRouter();

  // Simple toggle between 'admin' and 'employee'
  const [activeRole, setActiveRole] = useState<'admin' | 'employee'>('admin');

  // Input states for Admin
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Input states for Employee
  const [employeeId, setEmployeeId] = useState('');
  const [employeePass, setEmployeePass] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');

  // Hardcoded demo credentials
  const DEMO_ADMIN = { id: 'admin@clearaudit.com', pass: 'admin123' };
  const DEMO_EMPLOYEE = { id: 'employee@clearaudit.com', pass: 'emp123' };

  // Autofill handlers for Admin
  const handleAdminIdHint = () => {
    setAdminId(DEMO_ADMIN.id);
    if (!adminPass) setAdminPass(DEMO_ADMIN.pass);
    setError('');
  };

  const handleAdminPassHint = () => {
    setAdminPass(DEMO_ADMIN.pass);
    if (!adminId) setAdminId(DEMO_ADMIN.id);
    setError('');
  };

  // Autofill handlers for Employee
  const handleEmployeeIdHint = () => {
    setEmployeeId(DEMO_EMPLOYEE.id);
    if (!employeePass) setEmployeePass(DEMO_EMPLOYEE.pass);
    setError('');
  };

  const handleEmployeePassHint = () => {
    setEmployeePass(DEMO_EMPLOYEE.pass);
    if (!employeeId) setEmployeeId(DEMO_EMPLOYEE.id);
    setError('');
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError('');

    if (activeRole === 'admin') {
      if (!adminId || !adminPass) {
        setError('Please enter Admin ID and Password, or click Hint.');
        setLoggingIn(false);
        return;
      }
      loginAsRole('admin', adminId);
      router.push('/admin');
    } else {
      if (!employeeId || !employeePass) {
        setError('Please enter Employee ID and Password, or click Hint.');
        setLoggingIn(false);
        return;
      }
      loginAsRole('employee', employeeId);
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
            <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center shadow-xs">
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

      {/* Right panel - Simple Toggle Window & Clean Role Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-neutral-50">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile title */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-neutral-900">
              ClearAudit Corporate Expense Auditor
            </span>
          </div>

          {/* THE SIMPLE PILL TOGGLE FOR ADMIN & EMPLOYEE */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-full bg-neutral-200/90 border border-neutral-300 w-full shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveRole('admin');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeRole === 'admin'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRole('employee');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeRole === 'employee'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Employee Login</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* THE SINGLE CLEAN CARD WITHOUT REDUNDANT HEADINGS */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeRole === 'admin' ? (
                <>
                  {/* ADMIN ID WITH HINT BUTTON INSIDE BOX */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 block">
                      Admin ID
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        placeholder="admin@clearaudit.com"
                        required
                        className="w-full pl-9 pr-16 py-2.5 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleAdminIdHint}
                        className="absolute right-2 px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 cursor-pointer transition-colors shadow-2xs"
                      >
                        Hint
                      </button>
                    </div>
                  </div>

                  {/* PASSWORD WITH EYE & HINT BUTTON INSIDE BOX */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 block">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-3.5 pr-22 py-2.5 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 transition-colors"
                      />
                      <div className="absolute right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleAdminPassHint}
                          className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 cursor-pointer transition-colors shadow-2xs"
                        >
                          Hint
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* EMPLOYEE ID WITH HINT BUTTON INSIDE BOX */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 block">
                      Employee ID
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="employee@clearaudit.com"
                        required
                        className="w-full pl-9 pr-16 py-2.5 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleEmployeeIdHint}
                        className="absolute right-2 px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 cursor-pointer transition-colors shadow-2xs"
                      >
                        Hint
                      </button>
                    </div>
                  </div>

                  {/* PASSWORD WITH EYE & HINT BUTTON INSIDE BOX */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 block">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={employeePass}
                        onChange={(e) => setEmployeePass(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-3.5 pr-22 py-2.5 rounded-lg bg-white border border-neutral-300 text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 transition-colors"
                      />
                      <div className="absolute right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleEmployeePassHint}
                          className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 cursor-pointer transition-colors shadow-2xs"
                        >
                          Hint
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-3"
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
      </div>
    </div>
  );
}
