import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserCredentials, UserRole } from '../types';
import {
  getStoredSession,
  setStoredSession,
  getStoredUsers,
  updateStoredPassword,
  initializeStorage
} from '../lib/storage';
import { validatePasswordChange } from '../lib/auditLogic';

interface AuthContextType {
  currentUser: UserCredentials | null;
  users: Record<UserRole, UserCredentials>;
  login: (role: UserRole, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updatePassword: (
    oldPass: string,
    newPass: string,
    confirmPass: string
  ) => { success: boolean; error?: string };
  refreshCredentials: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserCredentials | null>(null);
  const [users, setUsers] = useState<Record<UserRole, UserCredentials>>(() => {
    initializeStorage();
    return getStoredUsers();
  });

  const refreshCredentials = useCallback(() => {
    setUsers(getStoredUsers());
    const sess = getStoredSession();
    setCurrentUser(sess);
  }, []);

  useEffect(() => {
    initializeStorage();
    refreshCredentials();

    const handleStorageChange = () => {
      refreshCredentials();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('clearaudit_users_updated', handleStorageChange);
    window.addEventListener('clearaudit_session_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clearaudit_users_updated', handleStorageChange);
      window.removeEventListener('clearaudit_session_updated', handleStorageChange);
    };
  }, [refreshCredentials]);

  const login = useCallback(
    (role: UserRole, password: string): { success: boolean; error?: string } => {
      const currentUsers = getStoredUsers();
      const user = currentUsers[role];
      if (!user) {
        return { success: false, error: 'User role not configured.' };
      }
      if (user.passwordHash !== password) {
        return { success: false, error: 'Invalid password. Please check credentials.' };
      }

      setStoredSession(user);
      setCurrentUser(user);
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setStoredSession(null);
    setCurrentUser(null);
  }, []);

  const updatePassword = useCallback(
    (
      oldPass: string,
      newPass: string,
      confirmPass: string
    ): { success: boolean; error?: string } => {
      if (!currentUser) {
        return { success: false, error: 'No active session.' };
      }

      const currentUsers = getStoredUsers();
      const currentActual = currentUsers[currentUser.role]?.passwordHash || '';

      const validation = validatePasswordChange(oldPass, currentActual, newPass, confirmPass);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const updated = updateStoredPassword(currentUser.role, newPass);
      if (updated) {
        // Update current session user copy
        const updatedUser = { ...currentUser, passwordHash: newPass };
        setStoredSession(updatedUser);
        setCurrentUser(updatedUser);
        setUsers(getStoredUsers());
        return { success: true };
      }

      return { success: false, error: 'Failed to write updated password to local storage.' };
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        updatePassword,
        refreshCredentials
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
