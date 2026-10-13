'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile } from '@/lib/types';

export interface ExtendedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  profile: UserProfile | null;
  loading: boolean;
  setRole: (role: 'admin' | 'employee') => void;
  loginAsRole: (role: 'admin' | 'employee', credentialId?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  setRole: () => {},
  loginAsRole: () => {},
  logout: async () => {},
});

const SESSION_KEY = 'clearaudit_session_v4';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user && parsed.profile) {
          setUser(parsed.user);
          setProfile(parsed.profile);
        }
      }
    } catch {
      // Ignore parse errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Direct login as Admin or Employee
  const loginAsRole = (role: 'admin' | 'employee', credentialId?: string) => {
    const email =
      credentialId?.trim() ||
      (role === 'admin' ? 'admin@clearaudit.com' : 'employee@clearaudit.com');

    const displayName =
      role === 'admin'
        ? 'Admin Compliance Auditor'
        : 'Corporate Expense Submitter';

    const newUser: ExtendedUser = {
      uid: `${role}_${Math.random().toString(36).substring(2, 9)}`,
      email,
      displayName,
      photoURL: null,
    };

    const newProfile: UserProfile = {
      uid: newUser.uid,
      email,
      displayName,
      role,
    };

    setUser(newUser);
    setProfile(newProfile);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ user: newUser, profile: newProfile })
    );
  };

  const setRole = (role: 'admin' | 'employee') => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
      ...profile,
      role,
    };
    setProfile(updatedProfile);
    if (user) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user, profile: updatedProfile })
      );
    }
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, setRole, loginAsRole, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
