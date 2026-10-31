import React, { useState } from 'react';
import { X, Lock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { updatePassword, currentUser } = useAuth();
  const [previousPassword, setPreviousPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = updatePassword(previousPassword, newPassword, confirmPassword);
    if (!res.success) {
      setError(res.error || 'Failed to update password');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setPreviousPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }, 1200);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setPreviousPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md bg-white border border-zinc-200 shadow-2xl p-6 sm:p-7 relative transition-all">
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 text-zinc-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <Lock className="w-4 h-4 text-zinc-900" />
            <h2 id="change-password-title" className="text-base font-semibold text-zinc-950 uppercase tracking-wider">
              Change Password
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Account: <span className="font-mono text-zinc-800">{currentUser?.email}</span>
          </p>
        </div>

        {success ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-950 border border-zinc-300">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-zinc-900">Password Updated Successfully</p>
            <p className="text-xs text-zinc-500">Local credentials have been synchronized.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-zinc-50 border border-zinc-300 text-xs text-zinc-900">
                <AlertCircle className="w-4 h-4 shrink-0 text-zinc-800 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                Previous Password
              </label>
              <input
                type="password"
                required
                value={previousPassword}
                onChange={e => setPreviousPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-10 px-3 border border-zinc-300 bg-white text-sm text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-10 px-3 border border-zinc-300 bg-white text-sm text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-10 px-3 border border-zinc-300 bg-white text-sm text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-4 text-xs uppercase tracking-wider font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider font-medium transition-colors"
              >
                Save Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
