import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { LoginView } from './views/LoginView';
import { EmployeeDashboard } from './views/EmployeeDashboard';
import { AdminDashboard } from './views/AdminDashboard';

// Protected Route wrapper for Employee portal
const ProtectedEmployeeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// Protected Route wrapper for Admin portal
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// Root index redirect based on authentication
const RootRedirect: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return currentUser.role === 'admin' ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/employee" replace />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginView />} />
            <Route
              path="/employee"
              element={
                <ProtectedEmployeeRoute>
                  <EmployeeDashboard />
                </ProtectedEmployeeRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ExpenseProvider>
    </AuthProvider>
  );
}
