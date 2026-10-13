'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
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
  loginWithGoogle: (
    preferredRole?: 'admin' | 'employee'
  ) => Promise<{ success: boolean; role: 'admin' | 'employee'; error?: string }>;
  loginWithCustomEmail: (
    email: string,
    role: 'admin' | 'employee'
  ) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  setRole: () => {},
  loginWithGoogle: async () => ({ success: false, role: 'admin' }),
  loginWithCustomEmail: () => {},
  logout: async () => {},
});

const SESSION_KEY = 'clearaudit_session_v3';

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

    // Attach real Firebase listener for live Google Auth
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userObj: ExtendedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            photoURL: firebaseUser.photoURL,
          };
          setUser(userObj);

          let role: 'admin' | 'employee' = 'employee';
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              role = (userDoc.data() as UserProfile).role || 'employee';
            } else {
              role =
                firebaseUser.email?.endsWith('@admin.clearaudit.com') ||
                firebaseUser.email?.includes('admin')
                  ? 'admin'
                  : 'employee';

              await setDoc(
                userDocRef,
                {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: userObj.displayName,
                  role,
                  createdAt: new Date(),
                },
                { merge: true }
              );
            }
          } catch {
            // Non-blocking
          }

          const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: userObj.displayName || 'User',
            role,
          };
          setProfile(userProfile);
          localStorage.setItem(SESSION_KEY, JSON.stringify({ user: userObj, profile: userProfile }));
        }
      });
    } catch {
      // Fallback
    }

    return () => unsub();
  }, []);

  // Real Google Sign-In with official Firebase popup
  const loginWithGoogle = async (
    preferredRole?: 'admin' | 'employee'
  ): Promise<{ success: boolean; role: 'admin' | 'employee'; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const userObj: ExtendedUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
        photoURL: fbUser.photoURL,
      };

      const finalRole =
        preferredRole ||
        (fbUser.email?.includes('admin') ? 'admin' : 'employee');

      const userProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: userObj.displayName || 'Google User',
        role: finalRole,
      };

      try {
        await setDoc(
          doc(db, 'users', fbUser.uid),
          {
            ...userProfile,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      } catch {
        // Non-blocking
      }

      setUser(userObj);
      setProfile(userProfile);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: userObj, profile: userProfile }));
      return { success: true, role: finalRole };
    } catch (err: unknown) {
      console.error('Firebase Google Sign-In error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Google authentication failed';
      return { success: false, role: 'admin', error: errorMsg };
    }
  };

  // Direct login with user's real email (in case Firebase Google Provider is pending console activation)
  const loginWithCustomEmail = (email: string, role: 'admin' | 'employee') => {
    const cleanEmail = email.trim();
    const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const customUser: ExtendedUser = {
      uid: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      displayName: namePart || 'Corporate User',
      photoURL: null,
    };
    const customProfile: UserProfile = {
      uid: customUser.uid,
      email: cleanEmail,
      displayName: customUser.displayName || 'Corporate User',
      role,
    };

    setUser(customUser);
    setProfile(customProfile);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: customUser, profile: customProfile }));
  };

  const setRole = (role: 'admin' | 'employee') => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
      ...profile,
      role,
    };
    setProfile(updatedProfile);
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, profile: updatedProfile }));
      try {
        setDoc(doc(db, 'users', user.uid), { role }, { merge: true });
      } catch {
        // Non-blocking
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Non-blocking signOut
    }
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, setRole, loginWithGoogle, loginWithCustomEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
