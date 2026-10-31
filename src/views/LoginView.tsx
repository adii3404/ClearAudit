import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { users, login } = useAuth();
  const [activeRole, setActiveRole] = useState<UserRole>('employee');
  const [email, setEmail] = useState(() => users.employee.email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (role: UserRole) => {
    setActiveRole(role);
    setEmail(users[role].email);
    setPassword('');
    setError(null);
  };

  const handleHintClick = () => {
    const cred = users[activeRole];
    if (cred) {
      setEmail(cred.email);
      setPassword(cred.passwordHash);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = login(activeRole, password);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please verify credentials.');
      return;
    }

    if (activeRole === 'admin') {
      navigate('/admin');
    } else {
      navigate('/employee');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-zinc-950 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Left 50% Brand Showcase */}
      <div className="w-full md:w-1/2 py-8 px-6 sm:p-12 md:p-16 md:min-h-screen flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-50 relative overflow-hidden select-none">
        {/* Subtle geometric grid background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="text-center z-10 max-w-sm">
          {/* Uploaded Logo Image */}
          <div className="inline-flex items-center justify-center mb-4 md:mb-6">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_kdnznskdnznskdnz_c1f00f87.jpeg"
              alt="ClearAudit Logo"
              className="w-16 h-16 border border-zinc-900 object-cover shadow-xs"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 uppercase font-sans">
            ClearAudit
          </h1>

          <p className="mt-2 md:mt-3 text-xs sm:text-sm tracking-widest uppercase text-zinc-500 font-mono">
            Corporate Expense Auditor
          </p>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-zinc-200/80 flex items-center justify-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            <span>Automated Slips</span>
            <span>&bull;</span>
            <span>Policy Guard</span>
            <span>&bull;</span>
            <span>Token Tracking</span>
          </div>
        </div>
      </div>

      {/* Right 50% Login Container */}
      <div className="w-full md:w-1/2 py-8 px-4 sm:p-10 md:min-h-screen flex items-center justify-center bg-white">
        {/* Fixed Sizing Card: w-[380px] h-[460px] ensures zero layout shift when toggling */}
        <div className="w-full max-w-[380px] md:w-[380px] h-[460px] flex flex-col justify-between p-6 sm:p-7 border border-zinc-200 bg-white shadow-sm">
          <div>
            {/* Elegant Single Toggle Switch between Admin and Employee */}
            <div className="relative p-1 bg-zinc-100 border border-zinc-200 flex items-center mb-6">
              <button
                type="button"
                onClick={() => handleToggle('employee')}
                className={`flex-1 py-2 text-xs uppercase tracking-wider font-medium text-center transition-all cursor-pointer ${
                  activeRole === 'employee'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Employee
              </button>
              <button
                type="button"
                onClick={() => handleToggle('admin')}
                className={`flex-1 py-2 text-xs uppercase tracking-wider font-medium text-center transition-all cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-4 p-2.5 bg-zinc-50 border border-zinc-300 text-xs text-zinc-900 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-zinc-950" />
                <span className="truncate">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email with small Hint button to the right */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600">
                    Email
                  </label>
                  <button
                    type="button"
                    onClick={handleHintClick}
                    title="Auto-fill credentials hint"
                    className="px-2 py-0.5 text-[10px] font-mono uppercase bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 transition-colors cursor-pointer"
                  >
                    Hint
                  </button>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-300 bg-white text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors"
                />
              </div>

              {/* Password with Eye toggle */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter password"
                    className="w-full h-10 pl-3 pr-10 border border-zinc-300 bg-white text-sm text-zinc-950 font-mono focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full h-10 mt-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-semibold flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
